const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
// Handle ES Module default export in CommonJS require
const UserModelRaw = require('../models/User.model');
const UserModel = UserModelRaw.default || UserModelRaw;

const ProfileBranding = require('../models/ProfileBranding');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// @desc    Normalize user data for frontend consistency
const normalizeUserData = (user) => {
  if (!user) return null;

  // If it's already a public profile or normalized object, return as is
  if (user.isNormalized) return user;

  const userObj = user.toObject ? user.toObject() : user;
  
  // Handle name splitting for regular User model
  let firstName = userObj.firstName || '';
  let lastName = userObj.lastName || '';
  if (!firstName && userObj.name) {
    const parts = userObj.name.trim().split(/\s+/);
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }

  return {
    id: userObj._id,
    email: userObj.email,
    firstName,
    lastName,
    phone: userObj.phone || userObj.phoneNumber || '',
    role: userObj.role || 'user',
    isActive: userObj.isActive || (userObj.status === 'active'),
    permissions: userObj.permissions || {},
    selectedCourse: userObj.selectedCourse || userObj.courseInterestedIn || '',
    createdAt: userObj.createdAt,
    lastLogin: userObj.lastLogin,
    isNormalized: true
  };
};

// 🔐 Generate JWT Token (UPDATED WITH VERSIONING)
const generateToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
      permissionsVersion: admin.permissionsVersion || 0
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m' // short-lived token for security
    }
  );
};

// @desc    Register new admin
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, selectedCourse } = req.body;

    if (!selectedCourse) {
      return res.status(400).json({
        success: false,
        message: 'Please choose one of the available courses'
      });
    }

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email'
      });
    }

    // Create admin
    const admin = await Admin.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      selectedCourse
    });

    // Create empty profile branding record
    await ProfileBranding.create({
      userId: admin._id
    });

    // Generate token
    const token = generateToken(admin);

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      token,
      user: normalizeUserData(admin)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find admin (include password)
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordMatch = await admin.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // 🔒 Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled. Contact admin.'
      });
    }

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save();

    // Generate token
    const token = generateToken(admin);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: normalizeUserData(admin)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in admin
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    // req.user comes from middleware (already validated)
    const admin = req.user;

    res.status(200).json({
      success: true,
      user: normalizeUserData(admin)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update admin profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, selectedCourse } = req.body;

    const admin = await Admin.findById(req.user._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (phone) admin.phone = phone;
    if (selectedCourse) admin.selectedCourse = selectedCourse;

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: normalizeUserData(admin)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.user._id).select('+password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate redirection code for SSO (Admin -> Main)
// @route   POST /api/auth/redirect-code
// @access  Private
exports.redirectCode = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const email = req.user.email;

    // Generate a short-lived token (1 minute) for SSO redirection
    const code = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '1m' }
    );

    res.status(200).json(new ApiResponse(
      200,
      { code },
      "Redirect code generated successfully"
    ));
  } catch (error) {
    next(error);
  }
};



// @desc    Exchange redirection code for a valid session token (Port 5000)
// @route   POST /api/auth/exchange-code
// @access  Public
exports.exchangeCode = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide code'
      });
    }

    const decodedToken = jwt.verify(code, process.env.JWT_SECRET);
    const { email, userId, id } = decodedToken;
    const searchId = userId || id;

    // 1. Search in Admin collection
    let admin = null;
    if (searchId) admin = await Admin.findById(searchId);
    if (!admin && email) admin = await Admin.findOne({ email });
    
    let isFoundInAdmin = true;

    // 2. Search in User collection if not found in Admin
    if (!admin) {
      if (searchId) admin = await UserModel.findById(searchId);
      if (!admin && email) admin = await UserModel.findOne({ email });
      isFoundInAdmin = false;
    }

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'No account found with the email provided in the redirection code.'
      });
    }

    const token = generateToken(admin);

    res.status(200).json(new ApiResponse(
      200,
      {
        token,
        user: normalizeUserData(admin)
      },
      "Code exchanged successfully"
    ));
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired exchange code'
      });
    }
    next(error);
  }
};
