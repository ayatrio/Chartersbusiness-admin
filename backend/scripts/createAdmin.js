const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const User = require('../models/Admin');
const { normalizePermissions } = require('../utils/defaultPermissions');

const createAdmin = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@chartersbusiness.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    // 🔍 Check if admin exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('ℹ️ Admin already exists');

      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      existingAdmin.permissions = normalizePermissions(existingAdmin.permissions || {});
      await existingAdmin.save();
      console.log('Ensured admin role and normalized permissions');

    } else {
      // 🆕 Create new admin
      const admin = await User.create({
        email: adminEmail,
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        selectedCourse: 'Digital Growth Engineer', // required field

        role: 'admin',
        isActive: true,

        // 🔥 Give full access
        permissions: {
          profileBranding: {
            linkedin: true,
            website: true,
            youtube: true,
            socialMedia: true,
            credentials: true,
            github: true
          },
          aiInterview: {
            mockInterview: true,
            feedbackAnalysis: true
          }
        }
      });

      console.log('\n✅ Admin created successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', admin.email);
      console.log('🔑 Password:', adminPassword);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();

