import { Router } from 'express';
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
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

export default router;
