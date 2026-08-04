import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let mongoServer: MongoMemoryReplSet;

// --- Global Mocks for Third-Party APIs ---

// 1. Resend Email Client
vi.mock('resend', () => {
  return {
    Resend: class {
      emails = {
        send: vi.fn().mockResolvedValue({ id: 'email_dummy_id' }),
      };
    }
  };
});

// 2. Stripe Payment Client
vi.mock('stripe', () => {
  const mockStripeInstance = {
    customers: {
      create: vi.fn().mockResolvedValue({ id: 'cus_dummy_id' }),
    },
    paymentIntents: {
      create: vi.fn().mockResolvedValue({
        id: 'pi_dummy_id',
        client_secret: 'pi_dummy_secret',
      }),
      retrieve: vi.fn().mockResolvedValue({
        id: 'pi_dummy_id',
        status: 'succeeded',
      }),
      confirm: vi.fn().mockResolvedValue({
        id: 'pi_dummy_id',
        status: 'succeeded',
      }),
    },
    balance: {
      retrieve: vi.fn().mockResolvedValue({}),
    },
  };

  return {
    default: class {
      constructor() {
        return mockStripeInstance;
      }
    }
  };
});

// 3. Google Calendar API (googleapis)
vi.mock('googleapis', () => {
  const mockEvents = {
    insert: vi.fn().mockResolvedValue({ data: { id: 'event_dummy_id' } }),
    delete: vi.fn().mockResolvedValue({}),
  };
  const mockFreebusy = {
    query: vi.fn().mockResolvedValue({
      data: {
        calendars: {
          primary: { busy: [] },
        },
      },
    }),
  };
  const mockCalendar = vi.fn().mockReturnValue({
    events: mockEvents,
    freebusy: mockFreebusy,
  });

  const mockUserinfo = {
    get: vi.fn().mockResolvedValue({ data: { email: 'mocked@gmail.com' } }),
  };
  const mockOauth2 = vi.fn().mockReturnValue({
    userinfo: mockUserinfo,
  });

  const mockOAuth2Client = {
    generateAuthUrl: vi.fn().mockReturnValue('http://mock-auth-url'),
    getToken: vi.fn().mockResolvedValue({ tokens: { refresh_token: 'dummy_refresh' } }),
    setCredentials: vi.fn(),
  };

  return {
    google: {
      auth: {
        OAuth2: class {
          constructor() {
            return mockOAuth2Client;
          }
        }
      },
      calendar: mockCalendar,
      oauth2: mockOauth2,
    },
  };
});

// 4. Pinecone Database Client
vi.mock('@pinecone-database/pinecone', () => {
  const mockNamespace = {
    deleteMany: vi.fn().mockResolvedValue({}),
    upsert: vi.fn().mockResolvedValue({}),
    query: vi.fn().mockResolvedValue({
      matches: [
        {
          id: 'chunk_1',
          score: 0.9,
          metadata: { text: 'Mocked report text about abnormal hemoglobin levels.' },
        },
      ],
    }),
  };

  const mockIndex = {
    namespace: vi.fn().mockReturnValue(mockNamespace),
    describeIndexStats: vi.fn().mockResolvedValue({
      namespaces: {
        'patient_1': { recordCount: 1 }
      }
    }),
  };

  const mockPineconeClient = {
    index: vi.fn().mockReturnValue(mockIndex),
  };

  return {
    Pinecone: class {
      constructor() {
        return mockPineconeClient;
      }
    }
  };
});

// 5. LangChain Google GenAI Embeddings
vi.mock('@langchain/google-genai', () => {
  return {
    GoogleGenerativeAIEmbeddings: class {
      embedDocuments = vi.fn().mockImplementation((chunks: string[]) => {
        return Promise.resolve(chunks.map(() => new Array(768).fill(0.1)));
      });
    }
  };
});

// 6. LangChain Groq Chat Client
vi.mock('@langchain/groq', () => {
  return {
    ChatGroq: class {
      invoke = vi.fn().mockResolvedValue({
        content: 'Mocked AI assistant response containing diagnostic analysis. This is not medical advice.',
      });
      stream = vi.fn().mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield { content: 'Mocked ' };
          yield { content: 'AI ' };
          yield { content: 'response' };
        }
      });
    }
  };
});

// --- MongoDB Memory Server Lifecycle ---

beforeAll(async () => {
  const originalConnect = mongoose.connect;
  vi.spyOn(mongoose, 'connect').mockImplementation(async (uri: string, ...args) => {
    if (uri.includes('127.0.0.1') || uri.includes('localhost')) {
      return originalConnect(uri, ...args);
    }
    return mongoose;
  });

  mongoServer = await MongoMemoryReplSet.create({
    replSet: { storageEngine: 'ephemeralForTest' }
  });
  const uri = mongoServer.getUri();
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);

  // Seed default Free subscription plan
  const SubscriptionPlan = (await import('../models/SubscriptionPlan.model.js')).default;
  await SubscriptionPlan.create({
    name: 'Free',
    price: 0,
    maxFamilyMembers: 0,
    features: ['Single user dashboard', 'Standard report delivery'],
    isActive: true,
    durationMonths: null,
    isDefault: true,
    testDiscountPercent: 0,
    freeHomeCollections: false,
    aiQuestionsPerMonth: 5,
  });
});

afterAll(async () => {
  // Clear all database collections after all tests in the file complete
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }

  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  vi.restoreAllMocks();
});


