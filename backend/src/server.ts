import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import routes from './routes';
import { BookingModel } from './models/Booking';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:8080';
const MONGO_URI = process.env.MONGO_URI;

async function bootstrap() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI is not set. Please configure backend/.env');
  }
  await connectDB(MONGO_URI);
//4
  const app = express();
  app.use(cors({ origin: ORIGIN, credentials: true }));
  // Increase body size limits to avoid 413 Payload Too Large for admin/owner forms
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ limit: '5mb', extended: true }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', routes);

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });

  // Auto-complete past bookings every 1 minute
  const ONE_MINUTE = 60 * 1000;
  async function runAutoComplete() {
    try {
      // Mark confirmed bookings whose end time (dateTime + durationHours hours) is in the past
      const result = await BookingModel.updateMany(
        {
          status: 'confirmed',
          $expr: {
            $lte: [
              { $add: [ '$dateTime', { $multiply: [ '$durationHours', 60 * 60 * 1000 ] } ] },
              new Date()
            ]
          }
        },
        { $set: { status: 'completed' } }
      );
      if ((result as any)?.modifiedCount) {
        console.log(`[auto-complete] Marked ${(result as any).modifiedCount} bookings as completed`);
      }
    } catch (e) {
      console.error('[auto-complete] error', e);
    }
  }
  // initial delay then interval
  setTimeout(runAutoComplete, 10_000);
  setInterval(runAutoComplete, ONE_MINUTE);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
