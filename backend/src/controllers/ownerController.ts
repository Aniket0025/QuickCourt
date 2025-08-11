import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { VenueModel } from '../models/Venue';
import { BookingModel } from '../models/Booking';

export async function getOwnerVenueMetrics(req: Request, res: Response) {
  try {
    const venueId = (req.query.venueId as string) || '';
    if (!isValidObjectId(venueId)) return res.status(400).json({ error: 'Invalid venueId' });

    const venue = await VenueModel.findById(venueId).lean();
    if (!venue) return res.status(404).json({ error: 'Venue not found' });

    const activeCourts = Array.isArray(venue.courts) ? venue.courts.length : 0;

    const totalBookings = await BookingModel.countDocuments({ venueId });

    // Earnings for current month from confirmed/completed bookings
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const earningsAgg = await BookingModel.aggregate([
      { $match: { venueId: (venueId as any), createdAt: { $gte: monthStart }, status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]);
    const monthEarnings = earningsAgg?.[0]?.total || 0;

    return res.json({ activeCourts, totalBookings, monthEarnings });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to load owner metrics' });
  }
}

export async function getOwnerVenue7dStats(req: Request, res: Response) {
  try {
    const venueId = (req.query.venueId as string) || '';
    if (!isValidObjectId(venueId)) return res.status(400).json({ error: 'Invalid venueId' });

    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);

    const dateFormat = { format: '%Y-%m-%d', date: '$createdAt' } as any;

    const bookingsAgg = await BookingModel.aggregate([
      { $match: { venueId: (venueId as any), createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: dateFormat }, count: { $sum: 1 } } },
    ]);

    const dayLabels: string[] = [];
    const bookingsPerDay: number[] = [];

    const bMap = new Map<string, number>();
    for (const it of bookingsAgg as any[]) bMap.set(it._id, it.count);

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dayLabels.push(key);
      bookingsPerDay.push(bMap.get(key) || 0);
    }

    return res.json({ dayLabels, bookingsPerDay });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to load owner 7d stats' });
  }
}
