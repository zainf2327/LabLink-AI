import { ChatGroq } from '@langchain/groq';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { pineconeIndex } from '../config/pinecone.js';
import { env } from '../config/env.js';
import { appendMedicalDisclaimer } from '../utils/medicalDisclaimer.js';
import logger from '../utils/logger.js';

export const aiAssistantService = {
  /**
   * Vectorize report text content and upsert into Pinecone
   * under the patient's namespace, deleting any previous vectors for this report.
   */
  async upsertReportVectors(patientId: string, reportId: string, textContent: string): Promise<number> {
    try {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50,
      });

      const chunks = await splitter.splitText(textContent);
      if (chunks.length === 0) {
        return 0;
      }

      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: env.GEMINI_API_KEY,
        modelName: 'gemini-embedding-2',
      });

      const embeddedChunks = await embeddings.embedDocuments(chunks);

      const namespace = pineconeIndex.namespace(`patient_${patientId}`);

      // Delete existing vectors for this specific reportId in the patient's namespace
      try {
        await namespace.deleteMany({
          filter: { reportId: { $eq: reportId } },
        });
      } catch (deleteErr: any) {
        logger.warn('Pinecone deleteMany warning (possibly empty namespace):', deleteErr.message);
      }

      const vectors = chunks.map((chunk: string, i: number) => ({
        id: `${reportId}_chunk_${i}`,
        values: embeddedChunks[i],
        metadata: {
          reportId,
          chunkIndex: i,
          patientId,
          text: chunk,
        },
      }));

      // Upsert new vectors
      await namespace.upsert(vectors);

      return vectors.length;
    } catch (err: any) {
      logger.error('Error in upsertReportVectors:', err);
      throw new Error(`Failed to vectorize report: ${err.message}`);
    }
  },

  /**
   * Generate a plain-language summary of the report text content using Groq.
   */
  async generateSummary(textContent: string): Promise<string> {
    try {
      const chat = new ChatGroq({
        apiKey: env.GROQ_API_KEY,
        model: env.GROQ_MODEL_ID,
      });

      const response = await (chat as any).invoke([
        {
          role: 'system',
          content: 'You are a medical assistant. Summarize the following lab report in plain language that a non-medical patient can understand. Focus on key findings, any values outside normal ranges, and what they might generally indicate. Be concise (3-5 sentences).',
        },
        {
          role: 'user',
          content: textContent,
        },
      ]);

      const summary = String(response.content).trim();
      return appendMedicalDisclaimer(summary);
    } catch (err: any) {
      logger.error('Error in generateSummary:', err);
      throw new Error(`Failed to generate summary: ${err.message}`);
    }
  },

  /**
   * Run the dual-context RAG query and return Groq chat stream
   */
  async chatWithAssistant(
    patientId: string,
    reportId: string,
    userMessage: string,
    chatHistory: { role: 'user' | 'assistant'; content: string }[]
  ): Promise<{ fallback: boolean; stream?: any; fallbackMessage?: string }> {
    try {
      // 1. Check if patient has any vectorized records in namespace
      const stats = await pineconeIndex.describeIndexStats();
      const namespaceKey = `patient_${patientId}`;
      
      if (!stats.namespaces || !stats.namespaces[namespaceKey] || stats.namespaces[namespaceKey].recordCount === 0) {
        return {
          fallback: true,
          fallbackMessage: "I don't have any uploaded reports for you yet. Please check back after your test results are ready.",
        };
      }

      // 2. Embed user query message
      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: env.GEMINI_API_KEY,
        modelName: 'gemini-embedding-2',
      });

      const queryVector = await embeddings.embedQuery(userMessage);
      const namespace = pineconeIndex.namespace(namespaceKey);

      // 3. Query Pinecone (Dual Query)
      // Primary: current reportId
      const primaryResponse = await namespace.query({
        vector: queryVector,
        topK: 5,
        filter: { reportId: { $eq: reportId } },
        includeMetadata: true,
      });

      // Secondary: other reports
      const secondaryResponse = await namespace.query({
        vector: queryVector,
        topK: 3,
        filter: { reportId: { $ne: reportId } },
        includeMetadata: true,
      });

      // 4. Build Context
      const primaryChunks = (primaryResponse.matches || [])
        .map((m) => m.metadata?.text)
        .filter(Boolean) as string[];

      const secondaryChunks = (secondaryResponse.matches || [])
        .map((m) => m.metadata?.text)
        .filter(Boolean) as string[];

      const primaryContextText = primaryChunks.length > 0
        ? primaryChunks.join('\n\n')
        : 'No relevant information found in the current report.';

      const secondaryContextText = secondaryChunks.length > 0
        ? secondaryChunks.join('\n\n')
        : 'No past reports or comparison data available.';

      const systemMessage = `You are LabLink AI, a medical assistant. Answer questions based primarily on the CURRENT REPORT context below. Secondary context from past reports is provided for comparison only.
Be concise, clear, and empathetic. Do not speculate beyond the data provided.
Do NOT include any medical disclaimers, advice disclaimers, or warnings about consulting doctors in your response, as the system automatically appends the official disclaimer at the end of the text. Any disclaimer you output will result in an ugly double-disclaimer error.

=== CURRENT REPORT CONTEXT ===
${primaryContextText}

=== PAST REPORTS (for comparison) ===
${secondaryContextText}`;

      // 5. Construct conversation payload
      const formattedHistory = chatHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));

      const messages = [
        { role: 'system' as const, content: systemMessage },
        ...formattedHistory,
        { role: 'user' as const, content: userMessage },
      ];

      // 6. Request streaming answer from Groq
      const chat = new ChatGroq({
        apiKey: env.GROQ_API_KEY,
        model: env.GROQ_MODEL_ID,
      });

      const stream = await (chat as any).stream(messages);

      return {
        fallback: false,
        stream,
      };
    } catch (err: any) {
      logger.error('Error in chatWithAssistant:', err);
      throw new Error(`Failed to complete chat query: ${err.message}`);
    }
  },

  /**
   * Run the general AI assistant query and return Groq chat stream and referenced report IDs
   */
  async chatWithGeneralAssistant(
    patientId: string,
    userMessage: string,
    chatHistory: { role: 'user' | 'assistant'; content: string }[]
  ): Promise<{ fallback: boolean; stream?: any; fallbackMessage?: string; referencedReportIds: string[] }> {
    try {
      // 1. Check if patient has any vectorized records in namespace
      const stats = await pineconeIndex.describeIndexStats();
      const namespaceKey = `patient_${patientId}`;
      
      const hasNamespace = stats.namespaces && stats.namespaces[namespaceKey] && stats.namespaces[namespaceKey].recordCount > 0;

      let contextText = 'No diagnostic reports or comparison data available.';
      let referencedReportIds: string[] = [];

      if (hasNamespace) {
        // 2. Embed user query message
        const embeddings = new GoogleGenerativeAIEmbeddings({
          apiKey: env.GEMINI_API_KEY,
          modelName: 'gemini-embedding-2',
        });

        const queryVector = await embeddings.embedQuery(userMessage);
        const namespace = pineconeIndex.namespace(namespaceKey);

        // 3. Query Pinecone (General RAG across namespace)
        const queryResponse = await namespace.query({
          vector: queryVector,
          topK: 7,
          includeMetadata: true,
        });

        const matches = queryResponse.matches || [];
        referencedReportIds = Array.from(
          new Set(
            matches
              .map((m) => m.metadata?.reportId)
              .filter(Boolean) as string[]
          )
        );

        const chunks = matches
          .map((m) => m.metadata?.text)
          .filter(Boolean) as string[];

        if (chunks.length > 0) {
          contextText = chunks.join('\n\n');
        }
      }

      const systemMessage = `You are LabLink AI, a generalized medical chatbot. You can answer general health, wellness, and medical questions using your built-in knowledge.
Additionally, you have access to context from the patient's medical reports below. If the patient asks about their results, symptoms, or reports, refer to this context. Otherwise, answer their questions using your medical knowledge.
Be concise, clear, and empathetic. Do not speculate beyond the data provided.
Do NOT include any medical disclaimers, advice disclaimers, or warnings about consulting doctors in your response, as the system automatically appends the official disclaimer at the end of the text. Any disclaimer you output will result in an ugly double-disclaimer error.

=== PATIENT MEDICAL REPORTS CONTEXT ===
${contextText}`;

      // 5. Construct conversation payload
      const formattedHistory = chatHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));

      const messages = [
        { role: 'system' as const, content: systemMessage },
        ...formattedHistory,
        { role: 'user' as const, content: userMessage },
      ];

      // 6. Request streaming answer from Groq
      const chat = new ChatGroq({
        apiKey: env.GROQ_API_KEY,
        model: env.GROQ_MODEL_ID,
      });

      const stream = await (chat as any).stream(messages);

      return {
        fallback: false,
        stream,
        referencedReportIds,
      };
    } catch (err: any) {
      logger.error('Error in chatWithGeneralAssistant:', err);
      throw new Error(`Failed to complete general chat query: ${err.message}`);
    }
  },

  /**
   * Automatically generate a concise, 3-5 word title for the chat session using Groq.
   */
  async generateSessionTitle(userMessage: string, assistantResponse: string): Promise<string> {
    try {
      const chat = new ChatGroq({
        apiKey: env.GROQ_API_KEY,
        model: env.GROQ_MODEL_ID,
      });

      const response = await (chat as any).invoke([
        {
          role: 'system',
          content: 'You are a helpful assistant. Generate a concise, relevant title (3 to 5 words max) for a medical chat session based on the user\'s first message and the assistant\'s response. Do NOT use quotes, punctuation, or extra words. Output ONLY the title itself.',
        },
        {
          role: 'user',
          content: `User first message: "${userMessage}"\nAssistant response: "${assistantResponse}"`,
        },
      ]);

      const title = String(response.content).trim().replace(/^["']|["']$/g, '');
      return title || 'Medical Chat';
    } catch (err: any) {
      logger.warn('Failed to generate session title, using fallback:', err);
      return 'Medical Chat';
    }
  },
};
