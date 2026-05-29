const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const UserModelRaw = require('./models/User.model');
const UserModel = UserModelRaw.default || UserModelRaw;
const ApplicationModel = require('./models/Application.model');

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

    const email = 'raj.connects@gmail.com';
    const user = await UserModel.findOne({ email });

    if (user) {
      console.log("User in users collection:", {
        id: user._id,
        email: user.email,
        role: user.role
      });

      // Find applications by userId
      const apps = await ApplicationModel.find({ userId: user._id });
      console.log(`Found ${apps.length} applications in User collection matching user ID:`);
      apps.forEach(app => {
        console.log({
          id: app._id,
          applicationNumber: app.applicationNumber,
          status: app.status,
          program: app.program
        });
      });
    } else {
      console.log("User not found in users collection.");
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error("Execution failed:", err);
  }
}

run();
