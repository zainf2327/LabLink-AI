import { Pinecone } from '@pinecone-database/pinecone';
import { env } from './env.js';

export const pineconeClient = new Pinecone({ apiKey: env.PINECONE_API_KEY });
export const pineconeIndex = pineconeClient.index(env.PINECONE_INDEX_NAME);

