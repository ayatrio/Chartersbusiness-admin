const Application = require('../models/Application.model.js');
const Admin = require('../models/Admin.js');
const UserModelRaw = require('../models/User.model');
const UserModel = UserModelRaw.default || UserModelRaw;

const asyncHandler = require('../utils/asyncHandler.js');
const ApiResponse = require('../utils/ApiResponse.js');
const ApiError = require('../utils/ApiError.js');
const {
  uploadAdmissionDocument,
} = require('../utils/cloudinaryUpload.util');
const findUserById = async (id) => {
  const user = await UserModel.findById(id);
  return user || Admin.findById(id);
};


// ── POST /applications ────────────────────────────────────────
exports.submitApplication = asyncHandler(async (req, res) => {
  const {
    name, email, location, program,
    countryCode, mobileNo, agreeToTerms,
  } = req.body;

  const userId = req.user._id || req.user.id;

  if (!program) throw new ApiError(400, 'Please select a program');

  const user = await findUserById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  // ── Resume existing draft ─────────────────────────────────────
  const existing = await Application.findOne({ userId: user._id, program });
  if (existing) {
    // Always sync latest personal details on resume
    await Application.findByIdAndUpdate(existing._id, {
      name:        name?.trim()        || existing.name,
      location:    location?.trim()    || existing.location,
      countryCode: countryCode         || existing.countryCode,
      mobileNo:    mobileNo            || existing.mobileNo,
      $addToSet:   { completedSteps: 'personal' },
    });

    return res.status(200).json(
      new ApiResponse(200, {
        applicationNumber: existing.applicationNumber,
        applicationId:     existing._id,
        program:           existing.program,
        isNewUser:         false,
        resumed:           true,
      }, 'Resuming your existing application.')
    );
  }

  // ── Create fresh draft ────────────────────────────────────────
  const application = await Application.create({
    userId:         user._id,
    name:           name?.trim()  || user.name,
    email:          user.email,
    location:       location?.trim() || 'Not specified',
    program,
    countryCode:    countryCode  || '+91',
    mobileNo:       mobileNo     || '0000000000',
    agreeToTerms:   true,
    completedSteps: ['personal'],   // ✅ mark personal done immediately
    currentStep:    'academics',    // ✅ advance to next step
  });

  return res.status(201).json(
    new ApiResponse(201, {
      applicationNumber: application.applicationNumber,
      applicationId:     application._id,
      program:           application.program,
      isNewUser:         false,
    }, 'Application draft created!')
  );
});


// ── PUT /applications/:id/personal ───────────────────────────
exports.updatePersonal = asyncHandler(async (req, res) => {
  const { name, location, program, countryCode, mobileNo } = req.body;

  const update = {
    currentStep: 'academics',
    $addToSet: { completedSteps: 'personal' },
  };

  if (name)        update.name        = name.trim();
  if (location)    update.location    = location.trim();
  if (program)     update.program     = program;
  if (countryCode) update.countryCode = countryCode;
  if (mobileNo)    update.mobileNo    = mobileNo;

  const application = await Application.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id || req.user.id },
    update,
    { new: true, runValidators: true }
  );

  if (!application) throw new ApiError(404, 'Application not found');

  res.status(200).json(new ApiResponse(200, {
    applicationId:     application._id,
    applicationNumber: application.applicationNumber,
  }, 'Personal details updated'));
});


// ── PUT /applications/:id/academics ──────────────────────────
exports.updateAcademics = asyncHandler(async (req, res) => {
  const {
    highestQualification, institution, graduationYear,
    fieldOfStudy, gpa, workExperience,
  } = req.body;

  if (!highestQualification || !institution || !graduationYear) {
    throw new ApiError(400, 'Please fill all required academic fields');
  }

  const application = await Application.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id || req.user.id },
    {
      academics: {
        highestQualification, institution, graduationYear,
        fieldOfStudy, gpa, workExperience,
      },
      currentStep: 'documents',
      $addToSet: { completedSteps: 'academics' },
    },
    { new: true, runValidators: true }
  );

  if (!application) throw new ApiError(404, 'Application not found');

  res.status(200).json(new ApiResponse(200, application, 'Academic details saved'));
});


// ── PUT /applications/:id/documents ──────────────────────────
// const {
//   uploadAdmissionDocument,
// } = require('../utils/cloudinary');


// ── PUT /applications/:id/documents ──────────────────────────
exports.updateDocuments = asyncHandler(async (req, res) => {
  const files = req.files || {};

  // Required documents
  if (
    !files.photoId?.[0] ||
    !files.marksheet?.[0] ||
    !files.photo?.[0]
  ) {
    throw new ApiError(
      400,
      'Please upload all required documents'
    );
  }

  const userId = req.user._id || req.user.id;

  // ==========================================
  // Upload Required Documents
  // ==========================================

  const [
    photoIdUpload,
    marksheetUpload,
    photoUpload,
  ] = await Promise.all([
    uploadAdmissionDocument(
      files.photoId[0].buffer,
      'photoId',
      userId
    ),

    uploadAdmissionDocument(
      files.marksheet[0].buffer,
      'marksheet',
      userId
    ),

    uploadAdmissionDocument(
      files.photo[0].buffer,
      'photo',
      userId
    ),
  ]);


  let workProofUpload = null;

  if (files.workProof?.[0]) {
    workProofUpload = await uploadAdmissionDocument(
      files.workProof[0].buffer,
      'workProof',
      userId
    );
  }


  const documents = {
    photoId: {
      url: photoIdUpload.url,
      publicId: photoIdUpload.publicId,
    },

    marksheet: {
      url: marksheetUpload.url,
      publicId: marksheetUpload.publicId,
    },

    photo: {
      url: photoUpload.url,
      publicId: photoUpload.publicId,
    },

    workProof: workProofUpload
      ? {
          url: workProofUpload.url,
          publicId: workProofUpload.publicId,
        }
      : null,
  };

  const application = await Application.findOneAndUpdate(
    {
      _id: req.params.id,
      userId,
    },
    {
      documents,
      currentStep: 'payment',

      $addToSet: {
        completedSteps: 'documents',
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

 
  res.status(200).json(
    new ApiResponse(
      200,
      application,
      'Documents uploaded successfully'
    )
  );
});

// ── PUT /applications/:id/payment ────────────────────────────
exports.updatePayment = asyncHandler(async (req, res) => {
  const { method, transactionId, amount } = req.body;

  if (!method || !transactionId) {
    throw new ApiError(400, 'Payment method and transaction ID are required');
  }

  const application = await Application.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id || req.user.id },
    {
      payment: {
        status: 'paid',
        method,
        transactionId,
        amount: amount || 1999,
        paidAt: new Date(),
      },
      status:      'pending',
      currentStep: 'submitted',
      $addToSet: { completedSteps: 'payment' },
    },
    { new: true }
  );

  if (!application) throw new ApiError(404, 'Application not found');

  res.status(200).json(new ApiResponse(200, application, 'Payment recorded. Application submitted!'));
});


// ── GET /applications/user ────────────────────────────────────
exports.getUserApplications = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const applications = await Application.find({ userId }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, applications, 'Applications retrieved successfully'));
});


// ── GET /applications (admin) ─────────────────────────────────
exports.getAllApplications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10, search } = req.query;
  const query = {};

  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name:              { $regex: search, $options: 'i' } },
      { email:             { $regex: search, $options: 'i' } },
      { applicationNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const [applications, count] = await Promise.all([
    Application.find(query)
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit),
    Application.countDocuments(query),
  ]);

  res.status(200).json(new ApiResponse(200, {
    applications,
    totalPages:  Math.ceil(count / limit),
    currentPage: parseInt(page),
    total:       count,
    hasMore:     page * limit < count,
  }));
});


// ── GET /applications/:id ─────────────────────────────────────
exports.getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('userId', 'name email avatar');
  if (!application) throw new ApiError(404, 'Application not found');
  res.status(200).json(new ApiResponse(200, application, 'Application retrieved successfully'));
});


// ── GET /applications/number/:applicationNumber ───────────────
exports.getApplicationByNumber = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    applicationNumber: req.params.applicationNumber,
  }).populate('userId', 'name email avatar');
  if (!application) throw new ApiError(404, 'Application not found');
  res.status(200).json(new ApiResponse(200, application, 'Application retrieved successfully'));
});


// ── PUT /applications/:id/status (admin) ──────────────────────
exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const VALID = ['pending', 'under_review', 'approved', 'rejected'];
  if (!status || !VALID.includes(status)) throw new ApiError(400, 'Invalid status value');

  const application = await Application.findByIdAndUpdate(
    req.params.id, { status }, { new: true, runValidators: true }
  ).populate('userId', 'name email avatar');

  if (!application) throw new ApiError(404, 'Application not found');
  res.status(200).json(new ApiResponse(200, application, 'Application status updated successfully'));
});


// ── DELETE /applications/:id (admin) ──────────────────────────
exports.deleteApplication = asyncHandler(async (req, res) => {
  const application = await Application.findByIdAndDelete(req.params.id);
  if (!application) throw new ApiError(404, 'Application not found');
  res.status(200).json(new ApiResponse(200, null, 'Application deleted successfully'));
});


// ── GET /applications/stats (admin) ──────────────────────────
exports.getApplicationStats = asyncHandler(async (req, res) => {
  const [stats, total] = await Promise.all([
    Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Application.countDocuments(),
  ]);

  const formattedStats = { total, pending: 0, under_review: 0, approved: 0, rejected: 0 };
  stats.forEach(s => { formattedStats[s._id] = s.count; });

  res.status(200).json(new ApiResponse(200, formattedStats, 'Statistics retrieved successfully'));
});