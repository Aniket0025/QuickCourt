import { Schema, model, InferSchemaType, Types } from 'mongoose';

const bookingSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  venueId: { type: Types.ObjectId, ref: 'Venue', required: true },
  courtId: { type: String, required: true },
  courtName: { type: String, required: true },
  sport: { type: String, required: true },
  dateTime: { type: Date, required: true },
  durationHours: { type: Number, min: 1, max: 12, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled', 'completed', 'pending'], default: 'confirmed' },
  rating: { type: Number, min: 1, max: 5 }
}, { timestamps: true });

export type Booking = InferSchemaType<typeof bookingSchema> & { _id: string };
export const BookingModel = model('Booking', bookingSchema);
