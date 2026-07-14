import { env } from './config/env.js';
import connectDB from './config/db.js';
import app from './app.js';

// Connect to Database and start server
connectDB().then(() => {
  app.listen(env.PORT, () => {
    console.log(`[server] Server running on http://localhost:${env.PORT}`);
  });
}).catch((err) => {
  console.error('[server] Failed to connect to the database:', err);
  process.exit(1);
});