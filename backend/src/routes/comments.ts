import { Router } from 'express';
import { z } from 'zod';
import { CommentModel } from '../models/Comment';

const router = Router();

const CreateCommentSchema = z.object({
  name: z.string().min(1).max(100),
  message: z.string().min(1).max(2000),
  topic: z.string().max(200).optional().or(z.literal('')),
});

// POST /api/comments - create a new public comment
router.post('/', async (req, res) => {
  const parsed = CreateCommentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  const { name, message, topic } = parsed.data;
  try {
    const doc = new CommentModel({ name, message, topic: topic || undefined });
    await doc.save();
    return res.status(201).json({ data: doc.toObject() });
  } catch (e) {
    console.error('Failed to create comment', e);
    return res.status(500).json({ error: 'Failed to create comment' });
  }
});

// GET /api/comments - list latest comments (newest first)
router.get('/', async (_req, res) => {
  try {
    const docs = await CommentModel.find({}).sort({ createdAt: -1 }).limit(50).lean().exec();
    return res.json({ data: docs });
  } catch (e) {
    console.error('Failed to list comments', e);
    return res.status(500).json({ error: 'Failed to list comments' });
  }
});

export default router;