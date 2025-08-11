import { Router } from 'express';
import { z } from 'zod';
import { BookingModel } from '../models/Booking';
import { VenueModel } from '../models/Venue';

const router = Router();

// List bookings, optional filter by userId or venueId, with optional limit
router.get('/', async (req, res) => {
  try {
    const { userId, venueId, limit } = req.query as { userId?: string; venueId?: string; limit?: string };
    const q: any = {};
    if (userId) q.userId = userId;
    if (venueId) q.venueId = venueId;
    const lim = Math.max(1, Math.min(Number(limit) || 50, 200));
    const data = await BookingModel.find(q).sort({ createdAt: -1 }).limit(lim).lean();
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

    // Load venue as a document (not lean) to mutate embedded court slots
    const venueDoc = await VenueModel.findById(venueId);
    if (!venueDoc) return res.status(404).json({ error: 'Venue not found' });

    // @ts-ignore courts exists
    const courtDoc: any = venueDoc.courts?.find((c: any) => String(c._id) === courtId || c.name === courtId);
    if (!courtDoc) return res.status(404).json({ error: 'Court not found' });

    const dt = new Date(dateTime);
    const now = new Date();
    if (dt.getTime() < now.getTime()) {
      return res.status(400).json({ error: 'Selected time must be in the future' });
    }

    // Try to remove the slot if pre-seeded, otherwise allow flexible booking with clash checks
    const idx = (courtDoc.availableSlots || []).findIndex((d: Date) => new Date(d).getTime() === dt.getTime());
    if (idx !== -1) {
      courtDoc.availableSlots.splice(idx, 1);
      await venueDoc.save();
    } else {
      // No pre-seeded slot. Ensure no overlap with existing bookings for the same court.
      const newStart = dt.getTime();
      const newEnd = newStart + durationHours * 60 * 60 * 1000;
      // Fetch potentially overlapping bookings (same court, not cancelled, starting within ±1 day window)
      const windowStart = new Date(newStart - 24 * 60 * 60 * 1000);
      const windowEnd = new Date(newEnd + 24 * 60 * 60 * 1000);
      const nearby = await BookingModel.find({
        courtId: String(courtDoc._id ?? courtId),
        status: { $in: ['confirmed', 'completed'] },
        dateTime: { $gte: windowStart, $lt: windowEnd },
      }).lean();
      const hasClash = (nearby || []).some((b: any) => {
        const bStart = new Date(b.dateTime).getTime();
        const bEnd = bStart + Number(b.durationHours || 1) * 60 * 60 * 1000;
        return bStart < newEnd && newStart < bEnd; // overlap
      });
      if (hasClash) {
        return res.status(400).json({ error: 'Selected time overlaps with an existing booking' });
      }
    }

    const price = Number(courtDoc.pricePerHour) * durationHours;

    const created = await BookingModel.create({
      userId,
      venueId,
      courtId: String(courtDoc._id ?? courtId),
      courtName: courtDoc.name,
      sport: courtDoc.sport,
      dateTime: dt,
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
    const bookingDoc = await BookingModel.findById(req.params.id);
    if (!bookingDoc) return res.status(404).json({ error: 'Booking not found' });

    if (bookingDoc.status === 'cancelled') {
      return res.json({ data: bookingDoc.toObject() });
    }

    // Attempt to restore the slot back to the court
    const venueDoc = await VenueModel.findById(bookingDoc.venueId);
    if (venueDoc) {
      // @ts-ignore courts exists
      const courtDoc: any = venueDoc.courts?.find((c: any) => String(c._id) === String(bookingDoc.courtId));
      if (courtDoc) {
        const dt = new Date(bookingDoc.dateTime);
        const exists = (courtDoc.availableSlots || []).some((d: Date) => new Date(d).getTime() === dt.getTime());
        if (!exists) {
          courtDoc.availableSlots.push(dt);
          // keep sorted
          courtDoc.availableSlots = courtDoc.availableSlots
            .map((d: Date) => new Date(d))
            .sort((a: Date, b: Date) => a.getTime() - b.getTime());
          await venueDoc.save();
        }
      }
    }

    bookingDoc.status = 'cancelled';
    await bookingDoc.save();
    res.json({ data: bookingDoc.toObject() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Mark booking as completed
router.patch('/:id/complete', async (req, res) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'cancelled') return res.status(400).json({ error: 'Cancelled bookings cannot be completed' });
    if (booking.status === 'completed') return res.json({ data: booking.toObject() });
    booking.status = 'completed';
    await booking.save();
    return res.json({ data: booking.toObject() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to mark completed' });
  }
});

// Mark booking as confirmed (in case of pending -> confirmed flow)
router.patch('/:id/confirm', async (req, res) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'cancelled') return res.status(400).json({ error: 'Cancelled bookings cannot be confirmed' });
    if (booking.status === 'confirmed') return res.json({ data: booking.toObject() });
    booking.status = 'confirmed';
    await booking.save();
    return res.json({ data: booking.toObject() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to confirm booking' });
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
