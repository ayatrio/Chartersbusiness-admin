const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    program: {
      type: String,
      required: [true, 'Program selection is required'],
    },
    countryCode: {
      type: String,
      required: true,
      default: '+91',
    },
    mobileNo: {
      type: String,
      required: [true, 'Mobile number is required'],
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number'],
    },
    agreeToTerms: {
      type: Boolean,
      required: [true, 'You must agree to terms'],
      validate: {
        validator: function (v) {
          return v === true;
        },
        message: 'You must agree to the privacy policy',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending',
    },
    applicationNumber: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

// ✅ FIXED: Generate unique application number with retry logic
applicationSchema.pre('save', async function (next) {
  if (!this.applicationNumber) {
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      try {
        const year = new Date().getFullYear();

        // ✅ Find the LAST application number for this year (not count)
        const lastApplication = await mongoose
          .model('Application')
          .findOne({
            applicationNumber: new RegExp(`^UCB${year}`),
          })
          .sort({ applicationNumber: -1 })
          .select('applicationNumber')
          .lean();

        let nextNumber = 1;

        if (lastApplication && lastApplication.applicationNumber) {
          // Extract number from last application
          const lastNumber = parseInt(
            lastApplication.applicationNumber.replace(`UCB${year}`, '')
          );
          nextNumber = lastNumber + 1;
        }

        // Generate new application number
        const paddedNumber = nextNumber.toString().padStart(6, '0');
        this.applicationNumber = `UCB${year}${paddedNumber}`;

        // ✅ Check if this number already exists
        const existing = await mongoose
          .model('Application')
          .findOne({ applicationNumber: this.applicationNumber });

        if (!existing) {
          isUnique = true;
        } else {
          attempts++;
          // Small delay to prevent race condition
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.error('Error generating application number:', error);
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    if (!isUnique) {
      const error = new Error(
        'Failed to generate unique application number. Please try again.'
      );
      error.code = 'APPLICATION_NUMBER_ERROR';
      throw error;
    }
  }

  next();
});

// ✅ Add compound unique index for userId + program
applicationSchema.index({ userId: 1, program: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
