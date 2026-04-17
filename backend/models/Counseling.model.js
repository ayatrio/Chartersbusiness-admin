const mongoose = require('mongoose');

const counselingSchema = new mongoose.Schema(
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
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    program: {
      type: String,
      required: [true, 'Program selection is required'],
    },
    counselingDate: {
      type: Date,
      required: [true, 'Please select a counseling date'],
    },
    counselingTime: {
      type: String,
      required: [true, 'Please select a counseling time'],
      enum: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'],
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
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    counselingNumber: {
      type: String,
      unique: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Generate counseling number before saving
counselingSchema.pre('save', async function (next) {
  if (!this.counselingNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Counseling').countDocuments();
    this.counselingNumber = `COUN${year}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Counseling', counselingSchema);
