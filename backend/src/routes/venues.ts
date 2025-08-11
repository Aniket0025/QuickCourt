import { Router } from 'express';
import { VenueModel } from '../models/Venue';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';

const router = Router();

// List venues (optional sport filter)
router.get('/', async (req, res) => {
  try {
    const { sport } = req.query as { sport?: string };
    const q: any = {};
    if (sport) q.sports = { $in: [sport] };
    const venues = await VenueModel.find(q).lean();
    res.json({ data: venues });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// Create a venue
router.post('/', async (req, res) => {
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
    const created = await VenueModel.create(parsed.data as any);
    return res.status(201).json({ data: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create venue' });
  }
});

// Get single venue
router.get('/:id', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid venue id' });
    const venue = await VenueModel.findById(req.params.id).lean();
    if (!venue) return res.status(404).json({ error: 'Venue not found' });
    res.json({ data: venue });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch venue' });
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
