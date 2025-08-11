import { Router } from 'express';
import { z } from 'zod';
import { BookingModel } from '../models/Booking';
import { VenueModel } from '../models/Venue';

const router = Router();

// GET /api/user/dashboard/upcoming?userId=...
router.get('/dashboard/upcoming', async (req, res) => {
  try {
    const { userId, limit } = req.query as { userId?: string; limit?: string };
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const now = new Date();
    const lim = Math.max(1, Math.min(Number(limit || 10), 50));

    const bookings = await BookingModel.find({
      userId,
      status: { $in: ['confirmed'] },
      dateTime: { $gte: now },
    })
      .sort({ dateTime: 1 })
      .limit(lim)
      .lean();

    // Optionally attach minimal venue info
    const venueIds = Array.from(new Set(bookings.map(b => String(b.venueId))));
    const venues = await VenueModel.find({ _id: { $in: venueIds } })
      .select({ name: 1, address: 1 })
      .lean();
    const venueMap = new Map(venues.map(v => [String(v._id), v]));

    const data = bookings.map(b => ({
      ...b,
      venue: venueMap.get(String(b.venueId)) || null,
    }));

    return res.json({ data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to fetch upcoming bookings' });
  }
});

// GET /api/user/dashboard/recommended?userId=...&limit=...
// Heuristic: venues with soonest availability, biased to user's recent sports.
router.get('/dashboard/recommended', async (req, res) => {
  try {
    const { userId, limit } = req.query as { userId?: string; limit?: string };
    const lim = Math.max(1, Math.min(Number(limit || 8), 24));

    // Determine sport preference from user's last 10 bookings
    let preferredSports: string[] = [];
    if (userId) {
      const lastBookings = await BookingModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select({ sport: 1 })
        .lean();
      const counts = new Map<string, number>();
      for (const b of lastBookings) {
        if (!b.sport) continue;
        counts.set(b.sport, (counts.get(b.sport) || 0) + 1);
      }
      preferredSports = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([s]) => s)
        .slice(0, 3);
    }

    // Find venues with upcoming availability
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Pull venues and compute an availability score
    const venues = await VenueModel.find({})
      .select({ name: 1, address: 1, sports: 1, amenities: 1, photos: 1, courts: 1 })
      .lean();

    type ScoredVenue = any & { score: number; nextSlot?: Date };
    const scored: ScoredVenue[] = [];

    for (const v of venues as any[]) {
      let count = 0;
      let nextSlot: Date | undefined;
      const hasPreferred = preferredSports.length > 0 && v.sports?.some((s: string) => preferredSports.includes(s));

      for (const c of (v.courts || [])) {
        const slots: Date[] = (c.availableSlots || []).map((d: any) => new Date(d));
        const inWindow = slots.filter(d => d >= now && d <= sevenDaysLater);
        if (inWindow.length) {
          count += inWindow.length;
          const [earliest] = inWindow.sort((a, b) => a.getTime() - b.getTime());
          if (earliest && (!nextSlot || earliest < nextSlot)) nextSlot = earliest;
        }
      }

      if (count > 0) {
        let base = count; // availability weight
        if (hasPreferred) base += 1000; // strong boost if matches user preference
        scored.push({ ...v, score: base, nextSlot });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const data = scored.slice(0, lim).map(v => ({
      _id: v._id,
      name: v.name,
      address: v.address,
      sports: v.sports,
      amenities: v.amenities,
      photo: Array.isArray(v.photos) && v.photos.length ? v.photos[0] : undefined,
      nextSlot: v.nextSlot,
      availableCourts: (v.courts || []).length,
    }));

    return res.json({ data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to fetch recommended venues' });
  }
});

export default router;
