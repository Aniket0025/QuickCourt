import { Router } from 'express';
import { z } from 'zod';
import { BookingModel } from '../models/Booking';
import { VenueModel } from '../models/Venue';

const router = Router();

// List bookings, optional filter by userId
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query as { userId?: string };
    const q: any = {};
    if (userId) q.userId = userId;
    const data = await BookingModel.find(q).sort({ createdAt: -1 }).lean();
    res.json({ data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

const CreateBookingSchema = z.object({
  userId: z.string().min(1),
  venueId: z.string().min(1),
  courtId: z.string().min(1),
  dateTime: z.string().datetime(),
  durationHours: z.number().int().min(1).max(12)
});

// Create booking
router.post('/', async (req, res) => {
  try {
    const parsed = CreateBookingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

    const { userId, venueId, courtId, dateTime, durationHours } = parsed.data;

    const venue = await VenueModel.findById(venueId).lean();
    if (!venue) return res.status(404).json({ error: 'Venue not found' });

    const court = venue.courts?.find((c: any) => String(c._id) === courtId || c.name === courtId || c.name === courtId);
    if (!court) return res.status(404).json({ error: 'Court not found' });

    const price = Number(court.pricePerHour) * durationHours;

    const created = await BookingModel.create({
      userId,
      venueId,
      courtId: String(court._id ?? courtId),
      courtName: court.name,
      sport: court.sport,
      dateTime: new Date(dateTime),
      durationHours,
      price,
      status: 'confirmed'
    });

    res.status(201).json({ data: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Cancel booking
router.patch('/:id/cancel', async (req, res) => {
  try {
    const booking = await BookingModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'cancelled' } },
      { new: true }
    ).lean();
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ data: booking });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Rate a completed booking
const RateSchema = z.object({ rating: z.number().int().min(1).max(5) });
router.patch('/:id/rate', async (req, res) => {
  try {
    const parsed = RateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

    const booking = await BookingModel.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'completed') return res.status(400).json({ error: 'Only completed bookings can be rated' });

    booking.rating = parsed.data.rating;
    await booking.save();
    return res.json({ data: booking.toObject() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to rate booking' });
  }
});

export default router;
