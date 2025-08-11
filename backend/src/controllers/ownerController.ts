import { Request, Response } from 'express';
import { isValidObjectId, Types } from 'mongoose';
import { VenueModel } from '../models/Venue';
import { BookingModel } from '../models/Booking';

export async function getOwnerVenueMetrics(req: Request, res: Response) {
  try {
    const venueId = (req.query.venueId as string) || '';
    if (!isValidObjectId(venueId)) return res.status(400).json({ error: 'Invalid venueId' });

    const venue = await VenueModel.findById(venueId).lean();
    if (!venue) return res.status(404).json({ error: 'Venue not found' });

    const activeCourts = Array.isArray(venue.courts) ? venue.courts.length : 0;

    const venueObjectId = new Types.ObjectId(venueId);
    const totalBookings = await BookingModel.countDocuments({ venueId: venueObjectId });

    // Earnings for current month by occurrence date (dateTime), include confirmed/completed
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
    const earningsAgg = await BookingModel.aggregate([
      { $match: { venueId: venueObjectId, status: { $in: ['confirmed', 'completed'] } } },
      { $addFields: { _dt: { $convert: { input: '$dateTime', to: 'date', onError: new Date(0), onNull: new Date(0) } } } },
      { $match: { _dt: { $gte: monthStart, $lt: nextMonthStart } } },
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
    const venueObjectId = new Types.ObjectId(venueId);

    // Use UTC boundaries to avoid timezone mismatches between app server and Mongo aggregation.
    // Compute the start as UTC midnight 6 days ago (inclusive of today -> 7 days total)
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6, 0, 0, 0, 0));

    // Group by UTC day key YYYY-MM-DD using booking occurrence date (dateTime)
    const dateFormat = { format: '%Y-%m-%d', date: '$dateTime' } as any;

    const bookingsAgg = await BookingModel.aggregate([
      { $match: { venueId: venueObjectId } },
      { $addFields: { _dt: { $convert: { input: '$dateTime', to: 'date', onError: new Date(0), onNull: new Date(0) } } } },
      { $match: { _dt: { $gte: start } } },
      { $group: { _id: { $dateToString: { ...dateFormat, date: '$_dt' } }, count: { $sum: 1 } } },
    ]);

    const dayLabels: string[] = [];
    const bookingsPerDay: number[] = [];

    const bMap = new Map<string, number>();
    for (const it of bookingsAgg as any[]) bMap.set(it._id, it.count);

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
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
