import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { FeedbackModel } from '../models/Feedback';
import { BookingModel } from '../models/Booking';

const router = Router();

const CreateFeedbackSchema = z.object({
  bookingId: z.string().min(1),
  message: z.string().min(1).max(2000),
  rating: z.number().int().min(1).max(5).optional(),
});

// POST /api/feedback
router.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = CreateFeedbackSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

  const { bookingId, message, rating } = parsed.data;
  try {
    // Ensure the booking belongs to the authenticated user
    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (String(booking.userId) !== String(req.user!.userId)) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    const feedback = new FeedbackModel({
      userId: booking.userId,
      bookingId: booking._id,
      message,
      rating,
    });
    await feedback.save();
    return res.status(201).json({ data: feedback.toObject() });
  } catch (e: any) {
    // Handle duplicate key error from unique index (userId, bookingId)
    if (e && e.code === 11000) {
      return res.status(409).json({ error: 'Feedback already submitted for this booking' });
    }
    console.error(e);
    return res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// GET /api/feedback/mine - list current user's feedbacks
router.get('/mine', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const queryAny: any = (FeedbackModel as any).find({ userId: new Types.ObjectId(req.user!.userId) })
      .sort({ createdAt: -1 });
    const items = await queryAny.exec();
    return res.json({ data: items });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to load feedback' });
  }
});

// GET /api/feedback/by-booking/:bookingId - get current user's feedback for a specific booking (if any)
router.get('/by-booking/:bookingId', requireAuth, async (req: AuthedRequest, res) => {
  const ParamsSchema = z.object({ bookingId: z.string().min(1) });
  const parsed = ParamsSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  try {
    const queryAny: any = (FeedbackModel as any).findOne({
      userId: new Types.ObjectId(req.user!.userId),
      bookingId: new Types.ObjectId(parsed.data.bookingId),
    });
    const item = await queryAny.exec();
    return res.json({ data: item });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to load feedback' });
  }
});

export default router;
