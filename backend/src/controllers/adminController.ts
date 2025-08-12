import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { VenueModel } from '../models/Venue';
import { BookingModel } from '../models/Booking';

export async function getAdminMetrics(_req: Request, res: Response) {
  try {
    const [totalUsers, facilityOwners, totalVenues, totalBookings] = await Promise.all([
      UserModel.countDocuments({}),
      UserModel.countDocuments({ role: 'facility_owner' }),
      VenueModel.countDocuments({}),
      BookingModel.countDocuments({}),
    ]);

    // Sum of all courts across venues
    const courtsAgg = await VenueModel.aggregate([
      { $project: { courtCount: { $size: { $ifNull: ['$courts', []] } } } },
      { $group: { _id: null, total: { $sum: '$courtCount' } } }
    ]);
    const activeCourts = courtsAgg?.[0]?.total || 0;

    return res.json({
      totalUsers,
      facilityOwners,
      totalVenues,
      totalBookings,
      activeCourts,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to load admin metrics' });
  }
}

// GET /api/admin/user-registrations?granularity=day|week|month|year&limit=365
export async function getAdminRegistrations(req: Request, res: Response) {
  try {
    const granRaw = String(req.query.granularity || 'day');
    const unit: 'day' | 'week' | 'month' | 'year' = ['day','week','month','year'].includes(granRaw) ? (granRaw as any) : 'day';
    const defaultLimit = unit === 'day' ? 30 : unit === 'week' ? 26 : unit === 'month' ? 12 : 5;
    const limit = Math.min(730, Math.max(1, Number(req.query.limit) || defaultLimit));

    const now = new Date();
    const truncateUtc = (d: Date) => {
      if (unit === 'year') return new Date(Date.UTC(d.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
      if (unit === 'month') return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
      if (unit === 'week') {
        const day = (d.getUTCDay() + 6) % 7; // Monday start
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day, 0, 0, 0, 0));
      }
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    };
    const step = (d: Date, n: number) => {
      const x = new Date(d);
      if (unit === 'day') x.setUTCDate(x.getUTCDate() + n);
      else if (unit === 'week') x.setUTCDate(x.getUTCDate() + 7 * n);
      else if (unit === 'month') x.setUTCMonth(x.getUTCMonth() + n);
      else if (unit === 'year') x.setUTCFullYear(x.getUTCFullYear() + n);
      return x;
    };

    const startBase = truncateUtc(now);
    const start = step(startBase, -(limit - 1));

    const usersAgg = await UserModel.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: unit === 'year' ? '%Y' : unit === 'month' ? '%Y-%m' : '%Y-%m-%d',
              date: { $dateTrunc: { date: '$createdAt', unit, timezone: 'UTC' } },
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const byKey = new Map<string, number>();
    for (const it of usersAgg as any[]) byKey.set(it._id as string, it.count as number);

    const labels: string[] = [];
    const counts: number[] = [];
    for (let i = 0; i < limit; i++) {
      const d = step(start, i);
      const key = unit === 'year' ? d.toISOString().slice(0, 4) : unit === 'month' ? d.toISOString().slice(0, 7) : d.toISOString().slice(0, 10);
      labels.push(key);
      counts.push(byKey.get(key) || 0);
    }

    return res.json({ labels, counts, granularity: unit, limit });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to load user registrations' });
  }
}
 
export async function getAdmin7dStats(_req: Request, res: Response) {
  try {
    // last 7 calendar days including today, using UTC boundaries
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6, 0, 0, 0, 0));

    const dateFormat = { format: '%Y-%m-%d', date: '$createdAt' } as any;

    const [bookingsAgg, usersAgg] = await Promise.all([
      BookingModel.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: dateFormat }, count: { $sum: 1 } } },
      ]),
      UserModel.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: dateFormat }, count: { $sum: 1 } } },
      ]),
    ]);

    // map to full 7-day range, fill missing with 0
    const dayLabels: string[] = [];
    const bookingsPerDay: number[] = [];
    const registrationsPerDay: number[] = [];

    const byDate = (arr: { _id: string; count: number }[]) => {
      const m = new Map<string, number>();
      for (const it of arr) m.set(it._id, it.count);
      return m;
    };
    const bMap = byDate(bookingsAgg as any);
    const uMap = byDate(usersAgg as any);

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      dayLabels.push(key);
      bookingsPerDay.push(bMap.get(key) || 0);
      registrationsPerDay.push(uMap.get(key) || 0);
    }

    return res.json({ dayLabels, bookingsPerDay, registrationsPerDay });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to load 7d stats' });
  }
}
