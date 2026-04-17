const JobApplication = require('../models/JobApplication.model.js');
const JobPosting = require('../models/JobPosting.model.js');
const InternshipPosting = require('../models/InternshipPosting.model.js');
const User = require('../models/Admin.js');
const asyncHandler = require('../utils/asyncHandler.js');
const ApiResponse = require('../utils/ApiResponse.js');
const ApiError = require('../utils/ApiError.js');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload.util.js');

// Apply for job/internship (Protected - User must be logged in)
exports.applyForPosition = asyncHandler(async (req, res) => {
  const { type, id } = req.params; // type = 'job' or 'internship', id = posting ID

  if (!["job", "internship"].includes(type)) {
    throw new ApiError(400, "Invalid application type");
  }

  const user = await User.findById(req.user._id || req.user.id);

  // Handle resume - new upload or use previous
  let resumeUrl;

  if (req.file) {
    // New resume uploaded - upload to Cloudinary
    try {
      const timestamp = Date.now();
      const sanitizedFilename = req.file.originalname.replace(
        /[^a-zA-Z0-9.]/g,
        "_"
      );
      // Remove .pdf extension from filename, then add it back to ensure it's there
      const baseFilename = sanitizedFilename.replace(/\.pdf$/i, "");
      const publicId = `${req.user._id || req.user.id}/${timestamp}-${baseFilename}.pdf`;

      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: "charters-business/resumes",
        publicId: publicId,
        resourceType: "raw",
      });

      resumeUrl = uploadResult.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new ApiError(500, "Failed to upload resume. Please try again.");
    }
  } else {
    // No new resume - check for previous resume
    const lastApplication = await JobApplication.findOne({ user: req.user._id || req.user.id })
      .sort("-createdAt")
      .select("resumeUrl")
      .lean();

    if (lastApplication && lastApplication.resumeUrl) {
      // Use previous resume
      resumeUrl = lastApplication.resumeUrl;
    } else if (user.lastResumeUrl) {
      // Use resume from user profile
      resumeUrl = user.lastResumeUrl;
    } else {
      throw new ApiError(400, "Please upload your resume (PDF only)");
    }
  }

  // Check if posting exists
  let posting;
  if (type === "job") {
    posting = await JobPosting.findById(id);
  } else {
    posting = await InternshipPosting.findById(id);
  }

  if (!posting || !posting.isActive) {
    throw new ApiError(
      404,
      `${type === "job" ? "Job" : "Internship"} not found or inactive`
    );
  }

  // Check if already applied
  const existingApplication = await JobApplication.findOne({
    user: req.user._id || req.user.id,
    ...(type === "job" ? { jobPosting: id } : { internshipPosting: id }),
  });

  if (existingApplication) {
    throw new ApiError(400, "You have already applied for this position");
  }

  // Create application
  const application = await JobApplication.create({
    user: req.user._id || req.user.id,
    applicationType: type,
    ...(type === "job" ? { jobPosting: id } : { internshipPosting: id }),
    resumeUrl,
  });

  // Update user's last resume info (only if new file uploaded)
  if (req.file) {
    user.lastResumeUrl = resumeUrl;
    user.lastResumeUploadedAt = new Date();
    await user.save();
  }

  // Increment applications count on posting
  if (type === "job") {
    await JobPosting.findByIdAndUpdate(id, { $inc: { applicationsCount: 1 } });
  } else {
    await InternshipPosting.findByIdAndUpdate(id, {
      $inc: { applicationsCount: 1 },
    });
  }

  // Populate the application before sending response
  await application.populate([
    { path: "user", select: "name email" },
    {
      path: type === "job" ? "jobPosting" : "internshipPosting",
      select: "title company location",
    },
  ]);

  res
    .status(201)
    .json(
      new ApiResponse(201, application, "Application submitted successfully!")
    );
});

// Get user's applications (Protected)
exports.getMyApplications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = { user: req.user._id || req.user.id };

  if (status) {
    query.status = status;
  }

  const [applications, count] = await Promise.all([
    JobApplication.find(query)
      .populate("jobPosting", "title company location salary jobType")
      .populate(
        "internshipPosting",
        "title company location stipend internshipType"
      )
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean(),
    JobApplication.countDocuments(query),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        applications,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
        },
      },
      "Applications retrieved successfully"
    )
  );
});

// Get single application by ID (User or Admin)
exports.getApplicationById = asyncHandler(async (req, res) => {
  const application = await JobApplication.findById(req.params.id)
    .populate("user", "name email avatar")
    .populate("jobPosting", "title company location salary experience")
    .populate("internshipPosting", "title company location stipend duration");

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  // Check if user owns this application or is admin
  if (
    application.user._id.toString() !== (req.user._id || req.user.id) &&
    !["admin", "recruiter"].includes(req.user.role)
  ) {
    throw new ApiError(403, "You are not authorized to view this application");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, application, "Application retrieved successfully")
    );
});

// Get all applications (Admin/Recruiter only)
exports.getAllApplications = asyncHandler(async (req, res) => {
  const { type, status, page = 1, limit = 10, search } = req.query;

  const query = {};

  if (type) {
    query.applicationType = type;
  }

  if (status) {
    query.status = status;
  }

  if (search) {
    // Search by application number or user email
    const users = await User.find({
      $or: [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ],
    }).select("_id");

    const userIds = users.map((u) => u._id);

    query.$or = [
      { applicationNumber: { $regex: search, $options: "i" } },
      { user: { $in: userIds } },
    ];
  }

  const [applications, count] = await Promise.all([
    JobApplication.find(query)
      .populate("user", "name email avatar")
      .populate("jobPosting", "title company location")
      .populate("internshipPosting", "title company location")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean(),
    JobApplication.countDocuments(query),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        applications,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
        },
      },
      "All applications retrieved successfully"
    )
  );
});

// Update application status (Admin/Recruiter only)
exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (
    !status ||
    !["pending", "reviewing", "shortlisted", "rejected", "accepted"].includes(
      status
    )
  ) {
    throw new ApiError(400, "Invalid status value");
  }

  const application = await JobApplication.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  )
    .populate("user", "name email")
    .populate("jobPosting", "title company")
    .populate("internshipPosting", "title company");

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        application,
        "Application status updated successfully"
      )
    );
});

// Get application statistics (Admin)
exports.getApplicationStats = asyncHandler(async (req, res) => {
  const stats = await JobApplication.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    {
      $facet: {
        byStatus: [{ $group: { _id: "$_id", count: { $sum: "$count" } } }],
        byType: [
          // This part needs the original records, so aggregate byType separately if needed
          // Simulating for now
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);

  // Redoing the actual complex facet for correctness
  const result = await JobApplication.aggregate([
    {
      $facet: {
        byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        byType: [{ $group: { _id: "$applicationType", count: { $sum: 1 } } }],
        total: [{ $count: "count" }],
      },
    },
  ]);

  const formattedStats = {
    total: result[0].total[0]?.count || 0,
    byStatus: {},
    byType: {},
  };

  result[0].byStatus.forEach((item) => {
    formattedStats.byStatus[item._id] = item.count;
  });

  result[0].byType.forEach((item) => {
    formattedStats.byType[item._id] = item.count;
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        formattedStats,
        "Application statistics retrieved successfully"
      )
    );
});

// Delete application (Admin only)
exports.deleteApplication = asyncHandler(async (req, res) => {
  const application = await JobApplication.findByIdAndDelete(req.params.id);

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "Application deleted successfully"));
});

exports.getAllApplicationsForAdmin = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const { id } = req.params; // Get job ID from URL path parameter

    const query = {};

    if (id) {
      query.jobPosting = id;
    } else {
      throw new ApiError(400, "Job ID is required");
    }

    if (status) {
      query.status = status;
    }

    if (type) {
      query.applicationType = type;
    }

    const [applications, count] = await Promise.all([
      JobApplication.find(query)
        .populate("user", "name email")
        .populate("jobPosting", "title company")
        .populate("internshipPosting", "title company")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean(),
      JobApplication.countDocuments(query),
    ]);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          applications,
          "Applications retrieved successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Failed to retrieve applications");
  }
});
