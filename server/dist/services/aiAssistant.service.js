import { ChatGroq } from '@langchain/groq';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { pineconeIndex } from '../config/pinecone.js';
import { env } from '../config/env.js';
export const aiAssistantService = {
    /**
     * Vectorize report text content and upsert into Pinecone
     * under the patient's namespace, deleting any previous vectors for this report.
     */
    async upsertReportVectors(patientId, reportId, textContent) {
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
            }
            catch (deleteErr) {
                console.warn('Pinecone deleteMany warning (possibly empty namespace):', deleteErr.message);
            }
            const vectors = chunks.map((chunk, i) => ({
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
            await namespace.upsert({ records: vectors });
            return vectors.length;
        }
        catch (err) {
            console.error('Error in upsertReportVectors:', err);
            throw new Error(`Failed to vectorize report: ${err.message}`);
        }
    },
    /**
     * Generate a plain-language summary of the report text content using Groq.
     */
    async generateSummary(textContent) {
        try {
            const chat = new ChatGroq({
                apiKey: env.GROQ_API_KEY,
                model: 'llama-3.3-70b-versatile',
            });
            const response = await chat.invoke([
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
            const disclaimer = `\n\n⚕️ *Medical Disclaimer: This AI-generated summary provides informational context of your lab report only and is not a substitute for professional medical advice. Please consult your doctor.*`;
            return summary + disclaimer;
        }
        catch (err) {
            console.error('Error in generateSummary:', err);
            throw new Error(`Failed to generate summary: ${err.message}`);
        }
    },
    /**
     * Run the dual-context RAG query and return Groq chat stream
     */
    async chatWithAssistant(patientId, reportId, userMessage, chatHistory) {
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
                .filter(Boolean);
            const secondaryChunks = (secondaryResponse.matches || [])
                .map((m) => m.metadata?.text)
                .filter(Boolean);
            const primaryContextText = primaryChunks.length > 0
                ? primaryChunks.join('\n\n')
                : 'No relevant information found in the current report.';
            const secondaryContextText = secondaryChunks.length > 0
                ? secondaryChunks.join('\n\n')
                : 'No past reports or comparison data available.';
            const systemMessage = `You are LabLink AI, a medical assistant. Answer questions based primarily on the CURRENT REPORT context below. Secondary context from past reports is provided for comparison only.
Be concise, clear, and empathetic. Do not speculate beyond the data provided.

=== CURRENT REPORT CONTEXT ===
${primaryContextText}

=== PAST REPORTS (for comparison) ===
${secondaryContextText}`;
            // 5. Construct conversation payload
            const formattedHistory = chatHistory.map((msg) => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content,
            }));
            const messages = [
                { role: 'system', content: systemMessage },
                ...formattedHistory,
                { role: 'user', content: userMessage },
            ];
            // 6. Request streaming answer from Groq
            const chat = new ChatGroq({
                apiKey: env.GROQ_API_KEY,
                model: 'llama-3.3-70b-versatile',
            });
            const stream = await chat.stream(messages);
            return {
                fallback: false,
                stream,
            };
        }
        catch (err) {
            console.error('Error in chatWithAssistant:', err);
            throw new Error(`Failed to complete chat query: ${err.message}`);
        }
    },
};
