import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { env } from '../config/env.js';

async function test() {
  console.log('--- TESTING GEMINI EMBEDDINGS ---');
  console.log('GEMINI_API_KEY length:', env.GEMINI_API_KEY?.length);
  try {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: env.GEMINI_API_KEY,
      modelName: 'gemini-embedding-2',
    });

    console.log('Call embedQuery...');
    const queryEmbed = await embeddings.embedQuery('Hello world');
    console.log('queryEmbed dimension:', queryEmbed.length);
    console.log('queryEmbed (first 5 values):', queryEmbed.slice(0, 5));

    console.log('Call embedDocuments...');
    const docEmbeds = await embeddings.embedDocuments(['Hello world 1', 'Hello world 2']);
    console.log('docEmbeds count:', docEmbeds.length);
    if (docEmbeds.length > 0) {
      console.log('docEmbed 0 dimension:', docEmbeds[0].length);
    }

    console.log('\n--- TESTING PINECONE CONNECTION ---');
    const { pineconeClient } = await import('../config/pinecone.js');
    const indexList = await pineconeClient.listIndexes();
    console.log('Available Pinecone Indexes:');
    console.log(JSON.stringify(indexList, null, 2));
  } catch (err: any) {
    console.error('❌ Test failed:', err.stack || err.message || err);
  }
}

test();
