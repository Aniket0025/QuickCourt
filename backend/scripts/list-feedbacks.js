// Read-only script to list feedbacks from MongoDB Atlas
// Usage:
//   node scripts/list-feedbacks.js              # list all
//   USER_ID=<ObjectId> node scripts/list-feedbacks.js   # filter by userId
// Requires: backend/.env with MONGO_URI

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
  const filter = {};
  const { USER_ID } = process.env;
  if (USER_ID) {
    try {
      filter.userId = new mongoose.Types.ObjectId(USER_ID);
    } catch (e) {
      console.error('Invalid USER_ID; must be a valid ObjectId');
      process.exit(1);
    }
  }

  const docs = await db.collection('feedbacks')
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  if (!docs.length) {
    console.log('No feedbacks found' + (USER_ID ? ` for USER_ID=${USER_ID}` : ''));
  } else {
    console.log(JSON.stringify(docs, null, 2));
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
