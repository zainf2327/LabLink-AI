import { env } from './env.js';
// Stub Pinecone configuration
export const pineconeConfig = {
    apiKey: env.PINECONE_API_KEY || '',
    indexName: env.PINECONE_INDEX_NAME || '',
};
console.log('Pinecone Config initialized (Stub)');
