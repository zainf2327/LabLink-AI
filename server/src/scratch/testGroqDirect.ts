import Groq from 'groq-sdk';
import { env } from '../config/env.js';

async function test() {
  console.log('--- TESTING GROQ DIRECT ---');
  console.log('GROQ_API_KEY:', env.GROQ_API_KEY);
  try {
    const groq = new Groq({ apiKey: env.GROQ_API_KEY });
    
    console.log('Sending chat completion request...');
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: 'Explain RAG in one sentence.',
        },
      ],
      model: 'llama3-8b-8192', // Use a standard, smaller model for testing
    });

    console.log('Success! Response from Groq:');
    console.log(completion.choices[0]?.message?.content);
  } catch (err: any) {
    console.error('❌ Groq Direct API call failed:');
    console.error(err.stack || err.message || err);
  }
}

test();
