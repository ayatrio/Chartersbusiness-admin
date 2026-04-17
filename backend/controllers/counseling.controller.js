const Counseling = require('../models/Counseling.model.js');
const User = require('../models/Admin.js');
const asyncHandler = require('../utils/asyncHandler.js');
const ApiResponse = require('../utils/ApiResponse.js');
const ApiError = require('../utils/ApiError.js');


// Submit counseling request
exports.submitCounseling = asyncHandler(async (req, res) => {
  const { name, email, program, counselingDate, counselingTime, agreeToTerms, trackingData } = req.body;

  // Check if user is logged in
  const userId = req.user ? (req.user._id || req.user.id) : null;

  // Validation
  if (!program || !counselingDate || !counselingTime) {
    throw new ApiError(400, 'Please provide program, counseling date and time');
  }

  let user = null;
  let generatedPassword = null;
  let counselingData = {};

  // NEW USER FLOW (Not logged in)
  if (!userId) {
    if (!name || !email) {
      throw new ApiError(400, 'Please provide name and email');
    }

    if (!agreeToTerms) {
      throw new ApiError(400, 'You must agree to the privacy policy');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

    if (existingUser) {
      // User exists - check if password already changed
      if (!existingUser.isFirstLogin) {
        throw new ApiError(400, 'An account with this email already exists. Please login to book counseling.');
      }
      
      // User exists but hasn't changed password - use existing user
      user = existingUser;
    } else {
      // Create new user
      generatedPassword = User.generateRandomPassword();

      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: generatedPassword,
        selectedCourse: program || 'Certified Management Professional (CMP)',
        isFirstLogin: true,
        tempPassword: generatedPassword,
      });
    }

    counselingData = {
      userId: user._id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      program,
      counselingDate: new Date(counselingDate),
      counselingTime,
      agreeToTerms,
    };
  } 
  // EXISTING USER FLOW (Logged in)
  else {
    user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    counselingData = {
      userId: user._id,
      name: user.name,
      email: user.email,
      program,
      counselingDate: new Date(counselingDate),
      counselingTime,
      agreeToTerms: true,
    };
  }


  // Create counseling entry
  const counseling = await Counseling.create(counselingData);

  // Response based on user type
  if (generatedPassword && !req.user) {
    // New user - send password
    res.status(201).json(
      new ApiResponse(
        201,
        {
          counselingNumber: counseling.counselingNumber,
          counselingId: counseling._id,
          email: counseling.email,
          name: counseling.name,
          program: counseling.program,
          generatedPassword,
          isNewUser: true,
        },
        'Counseling scheduled successfully! Please save your login credentials.'
      )
    );
  } else {
    // Existing user
    res.status(201).json(
      new ApiResponse(
        201,
        {
          counselingNumber: counseling.counselingNumber,
          counselingId: counseling._id,
          program: counseling.program,
          isNewUser: false,
        },
        'Counseling scheduled successfully!'
      )
    );
  }
});

// Get all counselings for a user
exports.getUserCounselings = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  const counselings = await Counseling.find({ userId })
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, counselings, 'Counselings retrieved successfully')
  );
});

// Get counseling by ID
exports.getCounselingById = asyncHandler(async (req, res) => {
  const counseling = await Counseling.findById(req.params.id).populate(
    'userId',
    'name email avatar'
  );

  if (!counseling) {
    throw new ApiError(404, 'Counseling not found');
  }

  res.status(200).json(
    new ApiResponse(200, counseling, 'Counseling retrieved successfully')
  );
});

// Get all counselings (admin)
exports.getAllCounselings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10, search } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { counselingNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const counselings = await Counseling.find(query)
    .populate('userId', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Counseling.countDocuments(query);

  res.status(200).json(
    new ApiResponse(200, {
      counselings,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count,
      hasMore: page * limit < count,
    })
  );
});

// Update counseling status (admin)
exports.updateCounselingStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  if (!status || !['scheduled', 'completed', 'cancelled'].includes(status)) {
    throw new ApiError(400, 'Invalid status value');
  }

  const updateData = { status };
  if (notes) updateData.notes = notes;

  const counseling = await Counseling.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('userId', 'name email avatar');

  if (!counseling) {
    throw new ApiError(404, 'Counseling not found');
  }

  res.status(200).json(
    new ApiResponse(200, counseling, 'Counseling status updated successfully')
  );
});

// Delete counseling (admin)
exports.deleteCounseling = asyncHandler(async (req, res) => {
  const counseling = await Counseling.findByIdAndDelete(req.params.id);

  if (!counseling) {
    throw new ApiError(404, 'Counseling not found');
  }

  res.status(200).json(new ApiResponse(200, null, 'Counseling deleted successfully'));
});

// Get counseling statistics (admin)
exports.getCounselingStats = asyncHandler(async (req, res) => {
  const stats = await Counseling.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const total = await Counseling.countDocuments();

  const formattedStats = {
    total,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
  };

  stats.forEach((stat) => {
    formattedStats[stat._id] = stat.count;
  });

  res.status(200).json(
    new ApiResponse(200, formattedStats, 'Statistics retrieved successfully')
  );
});
