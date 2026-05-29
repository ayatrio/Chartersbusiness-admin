const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoUri = process.env.MONGODB_URI;
const oldId = '6a08bb0c89df08c60f917cba'; // Admin record ID
const newId = '6a12046354f4024ab0500b25'; // User record ID

async function run() {
  console.log("Connecting to database:", mongoUri);
  try {
    try {
      await mongoose.connect(mongoUri);
    } catch (err) {
      await mongoose.connect(process.env.MONGODB_URI_DIRECT);
    }
    console.log("Connected successfully!");

    const db = mongoose.connection.db;

    // 1. Delete duplicate candidate in admins collection
    console.log(`Deleting duplicate admin record for Raj (ID: ${oldId})...`);
    const deleteAdminResult = await db.collection('admins').deleteOne({
      _id: new mongoose.Types.ObjectId(oldId)
    });
    console.log(`Deleted admin count: ${deleteAdminResult.deletedCount}`);

    // 2. Update applications collection
    console.log(`Updating applications from ${oldId} to ${newId}...`);
    const updateAppResult = await db.collection('applications').updateMany(
      { userId: new mongoose.Types.ObjectId(oldId) },
      { $set: { userId: new mongoose.Types.ObjectId(newId) } }
    );
    console.log(`Updated applications count: ${updateAppResult.modifiedCount}`);

    // 3. Update candidateaccesses collection
    console.log(`Updating candidateaccesses from ${oldId} to ${newId}...`);
    const updateAccessResult = await db.collection('candidateaccesses').updateMany(
      { chartersUserId: oldId },
      { $set: { chartersUserId: newId, userCategory: 'candidate' } }
    );
    console.log(`Updated candidateaccesses count: ${updateAccessResult.modifiedCount}`);

    // 4. Update profilebrandings collection
    console.log(`Updating profilebrandings from ${oldId} to ${newId}...`);
    const updateProfileResult = await db.collection('profilebrandings').updateMany(
      { userId: new mongoose.Types.ObjectId(oldId) },
      { $set: { userId: new mongoose.Types.ObjectId(newId) } }
    );
    console.log(`Updated profilebrandings count: ${updateProfileResult.modifiedCount}`);

    console.log("\nMigration completed successfully!");
    await mongoose.connection.close();
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

run();
