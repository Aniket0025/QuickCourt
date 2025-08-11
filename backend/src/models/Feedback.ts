import mongoose, { Schema, Types } from 'mongoose';

export interface FeedbackDoc extends mongoose.Document {
  userId: Types.ObjectId;
  bookingId: Types.ObjectId;
  message: string;
  rating?: number; // optional separate from booking rating
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<FeedbackDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    rating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

// Prevent duplicate feedback per user per booking
FeedbackSchema.index({ userId: 1, bookingId: 1 }, { unique: true });

export const FeedbackModel = mongoose.models.Feedback || mongoose.model<FeedbackDoc>('Feedback', FeedbackSchema);
