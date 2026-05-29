const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const AdminModel = require('./models/Admin');

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  console.log("Connecting to URI:", mongoUri);
  try {
    try {
      await mongoose.connect(mongoUri);
    } catch (err) {
      await mongoose.connect(process.env.MONGODB_URI_DIRECT);
    }
    console.log("Mongoose Connected!");

    const admin = await AdminModel.findOne({ email: /raj\.connects/i }).select('+password');
    if (admin) {
      console.log("Admin details:", {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        selectedCourse: admin.selectedCourse,
        isActive: admin.isActive,
        isVerified: admin.isVerified
      });
    } else {
      console.log("Not found in Admin collection.");
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error("Execution failed:", err);
  }
}

run();
