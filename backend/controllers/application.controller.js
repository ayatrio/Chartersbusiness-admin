const Application = require('../models/Application.model.js');
const User = require('../models/Admin.js');
const asyncHandler = require('../utils/asyncHandler.js');
const ApiResponse = require('../utils/ApiResponse.js');
const ApiError = require('../utils/ApiError.js');


// Submit application
exports.submitApplication = asyncHandler(async (req, res) => {
  const { name, email, location, program, countryCode, mobileNo, agreeToTerms, trackingData } = req.body;

  const userId = req.user ? (req.user._id || req.user.id) : null;

  if (!program) {
    throw new ApiError(400, 'Please select a program');
  }

  let user = null;
  let generatedPassword = null;
  let applicationData = {};

  // NEW USER FLOW
  if (!userId) {
    if (!name || !email || !location || !mobileNo) {
      throw new ApiError(400, 'Please provide all required fields');
    }

    if (!agreeToTerms) {
      throw new ApiError(400, 'You must agree to the privacy policy');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ✅ Check for duplicate application by email + program
    const existingApplication = await Application.findOne({
      email: normalizedEmail,
      program: program,
    });

    if (existingApplication) {
      throw new ApiError(400, 'You have already applied for this program');
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (!existingUser.isFirstLogin) {
        throw new ApiError(
          400,
          'An account with this email already exists. Please login to apply.'
        );
      }
      user = existingUser;
    } else {
      generatedPassword = User.generateRandomPassword();

      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: generatedPassword,
        selectedCourse: program || 'Certified Management Professional (CMP)',
        isFirstLogin: true,
        tempPassword: generatedPassword,
      });
    }

    applicationData = {
      userId: user._id,
      name: name.trim(),
      email: normalizedEmail,
      location: location.trim(),
      program,
      countryCode: countryCode || '+91',
      mobileNo,
      agreeToTerms,
    };
  }
  // LOGGED-IN USER FLOW
  else {
    user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // ✅ Check for duplicate application by userId + program
    const existingApplication = await Application.findOne({
      userId: user._id,
      program: program,
    });

    if (existingApplication) {
      throw new ApiError(400, 'You have already applied for this program');
    }

    applicationData = {
      userId: user._id,
      name: user.name,
      email: user.email,
      location: req.body.location || 'Not specified',
      program,
      countryCode: req.body.countryCode || '+91',
      mobileNo: req.body.mobileNo || '0000000000',
      agreeToTerms: true,
    };
  }


  // ✅ CREATE APPLICATION WITH ERROR HANDLING
  try {
    const application = await Application.create(applicationData);

    if (generatedPassword && !req.user) {
      res.status(201).json(
        new ApiResponse(
          201,
          {
            applicationNumber: application.applicationNumber,
            applicationId: application._id,
            email: application.email,
            name: application.name,
            program: application.program,
            generatedPassword,
            isNewUser: true,
          },
          'Application submitted successfully! Please save your login credentials.'
        )
      );
    } else {
      res.status(201).json(
        new ApiResponse(
          201,
          {
            applicationNumber: application.applicationNumber,
            applicationId: application._id,
            program: application.program,
            isNewUser: false,
          },
          'Application submitted successfully!'
        )
      );
    }
  } catch (error) {
    console.error('Application creation error:', error);

    // ✅ Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      if (error.message.includes('applicationNumber')) {
        throw new ApiError(
          500,
          'Application number generation failed. Please try again in a moment.'
        );
      } else if (
        error.message.includes('userId') ||
        error.message.includes('program')
      ) {
        throw new ApiError(400, 'You have already applied for this program');
      }
      throw new ApiError(400, 'Duplicate application detected');
    }

    // Handle application number generation error
    if (error.code === 'APPLICATION_NUMBER_ERROR') {
      throw new ApiError(500, error.message);
    }

    throw error;
  }
});

// Get all applications for a user
exports.getUserApplications = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  const applications = await Application.find({ userId }).sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, applications, 'Applications retrieved successfully'));
});

// Get all applications (admin)
exports.getAllApplications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10, search } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { applicationNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const applications = await Application.find(query)
    .populate('userId', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Application.countDocuments(query);

  res.status(200).json(
    new ApiResponse(200, {
      applications,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count,
      hasMore: page * limit < count,
    })
  );
});

// Get application by ID
exports.getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate(
    'userId',
    'name email avatar'
  );

  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  res
    .status(200)
    .json(new ApiResponse(200, application, 'Application retrieved successfully'));
});

// Get application by application number
exports.getApplicationByNumber = asyncHandler(async (req, res) => {
  const { applicationNumber } = req.params;

  const application = await Application.findOne({ applicationNumber }).populate(
    'userId',
    'name email avatar'
  );

  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  res
    .status(200)
    .json(new ApiResponse(200, application, 'Application retrieved successfully'));
});

// Update application status (admin)
exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (
    !status ||
    !['pending', 'under_review', 'approved', 'rejected'].includes(status)
  ) {
    throw new ApiError(400, 'Invalid status value');
  }

  const application = await Application.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).populate('userId', 'name email avatar');

  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, application, 'Application status updated successfully')
    );
});

// Delete application (admin)
exports.deleteApplication = asyncHandler(async (req, res) => {
  const application = await Application.findByIdAndDelete(req.params.id);

  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, 'Application deleted successfully'));
});

// Get application statistics (admin)
exports.getApplicationStats = asyncHandler(async (req, res) => {
  const stats = await Application.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const total = await Application.countDocuments();

  const formattedStats = {
    total,
    pending: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
  };

  stats.forEach((stat) => {
    formattedStats[stat._id] = stat.count;
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, formattedStats, 'Statistics retrieved successfully')
    );
});
