const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    applicationType: {
      type: String,
      enum: ['job', 'internship'],
      required: true,
      index: true,
    },
    // Reference to either JobPosting or InternshipPosting
    jobPosting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPosting',
      index: true,
    },
    internshipPosting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InternshipPosting',
      index: true,
    },
    // Resume file path
    resumeUrl: {
      type: String,
      required: [true, 'Resume is required'],
    },
    // Application status
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'shortlisted', 'rejected', 'accepted'],
      default: 'pending',
      index: true,
    },
    // Unique application number
    applicationNumber: {
      type: String,
      unique: true,
      index: true,
    },
    // Metadata
    appliedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries (Performance optimization)
jobApplicationSchema.index({ user: 1, createdAt: -1 });
jobApplicationSchema.index({ user: 1, status: 1 });
jobApplicationSchema.index({ status: 1, createdAt: -1 });
jobApplicationSchema.index({ jobPosting: 1, status: 1 });
jobApplicationSchema.index({ internshipPosting: 1, status: 1 });

// Prevent duplicate applications for same job/internship
jobApplicationSchema.index(
  { user: 1, jobPosting: 1 },
  { 
    unique: true, 
    partialFilterExpression: { jobPosting: { $exists: true } },
    background: true 
  }
);

jobApplicationSchema.index(
  { user: 1, internshipPosting: 1 },
  { 
    unique: true, 
    partialFilterExpression: { internshipPosting: { $exists: true } },
    background: true 
  }
);

// Generate unique application number
jobApplicationSchema.pre('save', async function (next) {
  if (!this.applicationNumber) {
    const count = await mongoose.model('JobApplication').countDocuments();
    const prefix = this.applicationType === 'job' ? 'JOB' : 'INT';
    const year = new Date().getFullYear();
    this.applicationNumber = `${prefix}${year}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

module.exports = JobApplication;
