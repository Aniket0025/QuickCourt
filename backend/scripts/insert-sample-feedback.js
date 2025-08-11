// Inserts a sample feedback document into MongoDB (Feedback collection)
// Usage examples:
//   node scripts/insert-sample-feedback.js                                  # picks any existing booking/user
//   USER_ID=<oid> BOOKING_ID=<oid> MESSAGE="Great!" RATING=5 node scripts/insert-sample-feedback.js
// Notes: This is a helper for local/dev/testing. It writes one document.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI not set in backend/.env');
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection;

  let { USER_ID, BOOKING_ID, MESSAGE, RATING } = process.env;
  MESSAGE = MESSAGE || 'Sample feedback from script';
  const ratingNum = RATING ? Number(RATING) : undefined;

  // Try to pick an existing booking if not provided
  if (!USER_ID || !BOOKING_ID) {
    const anyBooking = await db.collection('bookings').findOne({}, { projection: { userId: 1 } });
    if (anyBooking) {
      USER_ID = USER_ID || String(anyBooking.userId);
      BOOKING_ID = BOOKING_ID || String(anyBooking._id);
      console.log('Using existing booking:', BOOKING_ID, 'user:', USER_ID);
    }
  }

  // Fallback: random ObjectIds if none present
  if (!USER_ID) USER_ID = new mongoose.Types.ObjectId().toString();
  if (!BOOKING_ID) BOOKING_ID = new mongoose.Types.ObjectId().toString();

  const doc = {
    userId: new mongoose.Types.ObjectId(USER_ID),
    bookingId: new mongoose.Types.ObjectId(BOOKING_ID),
    message: MESSAGE,
    ...(Number.isFinite(ratingNum) ? { rating: ratingNum } : {}),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const res = await db.collection('feedbacks').insertOne(doc);
    console.log('Inserted feedback with _id:', res.insertedId);
  } catch (e) {
    console.error('Insert failed:', e.message);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
