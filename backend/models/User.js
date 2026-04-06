const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AVAILABLE_COURSES = [
  'Certified Management Professional (CMP)',
  'Digital Growth Engineer',
  'Product Growth Engineering'
];

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  selectedCourse: {
    type: String,
    enum: AVAILABLE_COURSES,
    required: [true, 'Please choose one of the offered courses'],
    trim: true
  },
  role: {
    type: String,
    enum: ['candidate', 'admin'],
    default: 'candidate'
  },
  profilePicture: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.toPublicProfile = function() {
  return {
    id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    phone: this.phone,
    selectedCourse: this.selectedCourse,
    profilePicture: this.profilePicture,
    role: this.role,
    isVerified: this.isVerified,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
