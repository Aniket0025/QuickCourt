import { Schema, model, InferSchemaType } from 'mongoose';

const courtSchema = new Schema({
  name: { type: String, required: true },
  sport: { type: String, required: true },
  pricePerHour: { type: Number, required: true },
  operatingHours: { type: String, required: true },
  availableSlots: [{ type: Date }]
}, { _id: true });

const reviewSchema = new Schema({
  user: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  date: { type: Date, required: true }
}, { _id: false });

const venueSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  ownerId: { type: String, required: true },
  sports: [{ type: String, required: true }],
  amenities: [{ type: String, required: true }],
  about: { type: String },
  photos: [{ type: String }],
  reviews: [reviewSchema],
  courts: [courtSchema]
}, { timestamps: true });

export type Venue = InferSchemaType<typeof venueSchema> & { _id: string };
export const VenueModel = model('Venue', venueSchema);
