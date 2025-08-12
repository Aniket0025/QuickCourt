import mongoose, { Schema, Document, Model } from 'mongoose';

export interface CommentDoc extends Document {
  name: string;
  message: string;
  topic?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<CommentDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    topic: { type: String, trim: true, maxlength: 200 },
  },
  { timestamps: true }
);

// Explicit model typing avoids union overload issues in consumers
export const CommentModel: Model<CommentDoc> =
  (mongoose.models.Comment as Model<CommentDoc> | undefined) ||
  mongoose.model<CommentDoc>('Comment', CommentSchema);
