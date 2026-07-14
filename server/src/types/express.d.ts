declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'patient' | 'staff' | 'admin';
      };
    }
  }
}

export {};
