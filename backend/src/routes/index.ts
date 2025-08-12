import { Router } from 'express';
import venuesRouter from './venues';
import bookingsRouter from './bookings';
import authRouter from './auth';
import adminRouter from './admin';
import feedbackRouter from './feedback';
import ownerRouter from './owner';
import mlRouter from './ml';
import userRouter from './user';
import commentsRouter from './comments';


const router = Router();

router.use('/venues', venuesRouter);
router.use('/bookings', bookingsRouter);
router.use('/auth', authRouter);
router.use('/admin', adminRouter);
router.use('/feedback', feedbackRouter);
router.use('/owner', ownerRouter);
router.use('/ml', mlRouter);
router.use('/user', userRouter);
router.use('/comments', commentsRouter);


export default router;
