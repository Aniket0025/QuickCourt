import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import routes from './routes';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:8080';
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://shreya:shreya123@oddo.8vdawkj.mongodb.net/?retryWrites=true&w=majority&appName=oddo';

async function bootstrap() {
  await connectDB(MONGO_URI);
//4
  const app = express();
  app.use(cors({ origin: ORIGIN, credentials: true }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', routes);

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
