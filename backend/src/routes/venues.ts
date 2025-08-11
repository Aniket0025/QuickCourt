import { Router } from 'express';
import { VenueModel } from '../models/Venue';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';

const router = Router();

// List venues (optional sport filter)
router.get('/', async (req, res) => {
  try {
    const { sport } = req.query as { sport?: string };
    const q: any = {};
    if (sport) {
      const esc = String(sport).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(`^${esc}$`, 'i');
      Object.assign(q, {
        $or: [
          { sports: { $elemMatch: { $regex: rx } } },
          { 'courts.sport': { $regex: rx } },
        ],
      });
    }
    const venues = await VenueModel.find(q).lean();
    res.json({ data: venues });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// Featured venues for homepage (recent venues as default heuristic)
router.get('/featured', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(24, Number(req.query.limit) || 6));
    const venues = await VenueModel.find({}, {
      name: 1,
      sports: 1,
      address: 1,
      city: 1,
      location: 1,
      photos: 1,
      rating: 1,
      pricePerHour: 1,
      createdAt: 1,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return res.json({ data: venues });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to fetch featured venues' });
  }
});

// Popular sports with venue counts
router.get('/popular-sports', async (_req, res) => {
  try {
    const agg = await VenueModel.aggregate([
      {
        $addFields: {
          _sportsFromCourts: {
            $map: {
              input: { $ifNull: ['$courts', []] },
              as: 'c',
              in: '$$c.sport',
            },
          },
        },
      },
      {
        $addFields: {
          _allSports: {
            $setUnion: [
              { $ifNull: ['$sports', []] },
              { $ifNull: ['$_sportsFromCourts', []] },
            ],
          },
        },
      },
      { $unwind: '$_allSports' },
      { $set: { _sportKey: { $toLower: '$_allSports' } } },
      { $group: { _id: '$_sportKey', venues: { $sum: 1 } } },
      { $sort: { venues: -1 } },
      { $limit: 20 },
      { $project: { _id: 0, name: '$_id', venues: 1 } },
    ]);
    const defaults = ['badminton', 'tennis', 'football', 'cricket', 'golf', 'hockey'];
    if (!agg || agg.length === 0) {
      return res.json({ data: defaults.map((d) => ({ name: d, venues: 0 })) });
    }
    // Merge defaults not present in agg
    const present = new Set((agg as { name: string; venues: number }[]).map((a) => String(a.name).toLowerCase()));
    const merged = [
      ...agg,
      ...defaults
        .filter((d) => !present.has(d))
        .map((d) => ({ name: d, venues: 0 })),
    ].slice(0, 20);
    return res.json({ data: merged });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to fetch popular sports' });
  }
});

// List venues for the authenticated owner/admin
router.get('/mine', requireAuth, async (req: AuthedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    // Admins can see all venues; facility owners see only their own
    const filter = req.user.role === 'admin' ? {} : { ownerId: req.user.userId };
    const venues = await VenueModel.find(filter).lean();
    res.json({ data: venues });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch your venues' });
  }
});

// Create a venue
router.post('/', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      address: z.string().min(1),
      sports: z.array(z.string()).default([]),
      amenities: z.array(z.string()).default([]),
      about: z.string().optional(),
      photos: z.array(z.string()).default([]),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', issues: parsed.error.flatten() });
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (req.user.role !== 'facility_owner' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only facility owners or admins can create venues' });
    }

    const created = await VenueModel.create({
      ...parsed.data,
      ownerId: req.user.userId,
    } as any);
    return res.status(201).json({ data: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create venue' });
  }
});

// Get single venue
router.get('/:id', async (req, res) => {
  try {
    const venue = await VenueModel.findById(req.params.id).lean();
    if (!venue) return res.status(404).json({ error: 'Venue not found' });
    res.json({ data: venue });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

// Add available slots to a court
router.post('/:id/courts/:courtId/slots', async (req, res) => {
  try {
    const { id, courtId } = req.params;
    if (!isValidObjectId(id) || !isValidObjectId(courtId)) {
      return res.status(400).json({ error: 'Invalid id(s)' });
    }
    const schema = z.object({
      slots: z.array(z.string().datetime()).min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', issues: parsed.error.flatten() });

    const venue = await VenueModel.findById(id);
    if (!venue) return res.status(404).json({ error: 'Venue not found' });
    // @ts-ignore
    const court: any = venue.courts?.find((c: any) => String(c._id) === courtId);
    if (!court) return res.status(404).json({ error: 'Court not found' });

    const toAdd = parsed.data.slots.map(s => new Date(s));
    const existing: Date[] = (court.availableSlots || []).map((d: Date) => new Date(d));
    const exists = new Set(existing.map(d => d.getTime()));
    toAdd.forEach(d => {
      if (!exists.has(d.getTime())) existing.push(d);
    });
    // sort chronologically
    existing.sort((a, b) => a.getTime() - b.getTime());
    court.availableSlots = existing;
    await venue.save();
    return res.status(200).json({ data: court });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to add slots' });
  }
});

// Update a venue
router.put('/:id', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid venue id' });
    const schema = z.object({
      name: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      address: z.string().min(1).optional(),
      sports: z.array(z.string()).optional(),
      amenities: z.array(z.string()).optional(),
      about: z.string().optional(),
      photos: z.array(z.string()).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', issues: parsed.error.flatten() });
    const updated = await VenueModel.findByIdAndUpdate(
      req.params.id,
      { $set: parsed.data },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Venue not found' });
    res.json({ data: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update venue' });
  }
});

// Add a new court to a venue
router.post('/:id/courts', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid venue id' });
    const schema = z.object({
      name: z.string().min(1),
      sport: z.string().min(1),
      pricePerHour: z.number().min(0),
      operatingHours: z.string().min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', issues: parsed.error.flatten() });

    const venue = await VenueModel.findById(req.params.id);
    if (!venue) return res.status(404).json({ error: 'Venue not found' });

    // @ts-ignore courts exists in schema
    venue.courts.push({ ...parsed.data, availableSlots: [] } as any);
    await venue.save();
    // @ts-ignore
    const created = venue.courts[venue.courts.length - 1];
    return res.status(201).json({ data: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to add court' });
  }
});

export default router;
