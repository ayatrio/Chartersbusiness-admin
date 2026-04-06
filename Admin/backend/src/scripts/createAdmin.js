import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import connectDB from '../config/database.js';

dotenv.config();

const createAdmin = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    const adminEmail = 'admin@chartersbusiness.com';
    const adminPassword = 'Admin@123'; // Change this to a secure password!

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.name);
      console.log('🎭 Role:', existingAdmin.role);
      
      // Update role to admin if not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        existingAdmin.isActive = true;
        await existingAdmin.save();
        console.log('✅ User role updated to admin!');
      } else {
        console.log('✅ User is already an admin!');
      }
    } else {
      // Create new admin user
      const admin = await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isFirstLogin: false,
        isActive: true,
      });

      console.log('\n✅ Admin user created successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:   ', admin.email);
      console.log('🔑 Password:', adminPassword);
      console.log('🎭 Role:    ', admin.role);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n💡 Use these credentials to login at /login');
    }

    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
