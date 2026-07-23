declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'patient' | 'staff' | 'admin';
      };
      subscription?: any;
      subscriptionPlan?: any;
    }
  }
}

export {};
