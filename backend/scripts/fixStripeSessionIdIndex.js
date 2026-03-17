/**
 * One-time fix: drop the old stripeSessionId unique index that was not sparse.
 * Multiple PayPal orders have stripeSessionId = null, causing E11000 duplicate key.
 * After running this, Mongoose will recreate the index as sparse on next connection.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const coll = mongoose.connection.db.collection('orders');
  try {
    await coll.dropIndex('stripeSessionId_1');
    console.log('Dropped index stripeSessionId_1');
  } catch (e) {
    if (e.code === 27 || e.codeName === 'IndexNotFound') {
      console.log('Index stripeSessionId_1 did not exist (already fixed)');
    } else {
      throw e;
    }
  }
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
