/**
 * One-time migration: map old order statuses to new ones.
 * Run from backend folder: node scripts/migrateOrderStatuses.js
 * Requires .env with MONGODB_URI.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const coll = mongoose.connection.db.collection('orders');
  const r1 = await coll.updateMany({ status: 'pending' }, { $set: { status: 'in_progress' } });
  const r2 = await coll.updateMany({ status: 'failed' }, { $set: { status: 'closed' } });
  console.log('Migrated pending -> in_progress:', r1.modifiedCount);
  console.log('Migrated failed -> closed:', r2.modifiedCount);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
