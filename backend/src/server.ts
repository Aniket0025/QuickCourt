import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import routes from './routes';
import { BookingModel } from './models/Booking';

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

  // Auto-complete past bookings every 5 minutes
  const FIVE_MINUTES = 5 * 60 * 1000;
  async function runAutoComplete() {
    try {
      const now = Date.now();
      // Find a reasonable batch of confirmed bookings whose end time has passed
      const candidates = await BookingModel.find({ status: 'confirmed' }).limit(500).lean();
      const toCompleteIds: string[] = [];
      for (const b of candidates as any[]) {
        const start = new Date(b.dateTime).getTime();
        const end = start + (Number(b.durationHours || 1) * 60 * 60 * 1000);
        if (end <= now) toCompleteIds.push(String(b._id));
      }
      if (toCompleteIds.length > 0) {
        await BookingModel.updateMany({ _id: { $in: toCompleteIds } }, { $set: { status: 'completed' } });
        console.log(`[auto-complete] Marked ${toCompleteIds.length} bookings as completed`);
      }
    } catch (e) {
      console.error('[auto-complete] error', e);
    }
  }
  // initial delay then interval
  setTimeout(runAutoComplete, 10_000);
  setInterval(runAutoComplete, FIVE_MINUTES);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
