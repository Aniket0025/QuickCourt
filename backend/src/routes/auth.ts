import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User';
import { signToken } from '../utils/jwt';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { generateOtp, hashOtp, compareOtp, otpExpiry } from '../utils/otp';
import { sendOtpEmail } from '../utils/mailer';

const router = Router();

const SignupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['user', 'facility_owner', 'admin']).optional()
});

// POST /api/auth/signup/request-otp
router.post('/signup/request-otp', async (req, res) => {
  const parsed = SignupOtpRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    const issues = parsed.error.flatten();
    return res.status(400).json({ error: 'Invalid input', issues });
  }

  const { name, email, password, role } = parsed.data;
  try {
    let user = await UserModel.findOne({ email });
    if (user && user.isVerified) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    if (!user) {
      user = await UserModel.create({ name, email, passwordHash, role: role || 'user', isVerified: false });
    } else {
      user.name = name;
      user.passwordHash = passwordHash;
      if (role) user.role = role;
    }

    const otp = generateOtp(6);
    user.otpCode = await hashOtp(otp);
    user.otpExpiresAt = otpExpiry(10);
    await user.save();

    await sendOtpEmail(email, otp, 'signup');
    return res.json({ message: 'OTP sent to email for signup verification' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to send signup OTP' });
  }
});

// POST /api/auth/forgot-password
const ForgotSchema = z.object({ email: z.string().email() });
router.post('/forgot-password', async (req, res) => {
  const parsed = ForgotSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid email' });
  const { email } = parsed.data;
  try {
    // No-op implementation: don't reveal whether the email exists
    // In a real app, generate a token and email the user here.
    return res.json({ message: 'If an account exists, a reset link has been sent' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /api/auth/signup/verify-otp
router.post('/signup/verify-otp', async (req, res) => {
  const parsed = OtpVerifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

  const { email, otp } = parsed.data;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.otpCode || !user.otpExpiresAt) return res.status(400).json({ error: 'No OTP requested' });
    if (user.otpExpiresAt.getTime() < Date.now()) return res.status(400).json({ error: 'OTP expired' });

    const ok = await compareOtp(otp, user.otpCode);
    if (!ok) return res.status(400).json({ error: 'Invalid OTP' });

    user.isVerified = true;
    user.otpCode = undefined as any;
    user.otpExpiresAt = undefined as any;
    await user.save();

    const token = signToken({ userId: String(user._id), role: user.role as any });
    return res.json({
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
      token
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to verify signup OTP' });
  }
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const SignupOtpRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['user', 'facility_owner', 'admin']).optional()
});

const OtpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().min(4).max(8)
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const parsed = SignupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

  const { name, email, password, role } = parsed.data;
  try {
    const existing = await UserModel.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ name, email, passwordHash, role: role || 'user', isVerified: true });

    const token = signToken({ userId: String(user._id), role: user.role as any });
    return res.status(201).json({
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
      token
    });
  } catch (e: any) {
    if (e?.code === 11000) return res.status(409).json({ error: 'Email already registered' });
    console.error(e);
    return res.status(500).json({ error: 'Failed to sign up' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

  const { email, password } = parsed.data;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ userId: String(user._id), role: user.role as any });
    return res.json({
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
      token
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const u = await UserModel.findById(req.user!.userId).lean();
    if (!u) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: { _id: u._id, name: u.name, email: u.email, role: u.role, isVerified: u.isVerified } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to load profile' });
  }
});

export default router;
