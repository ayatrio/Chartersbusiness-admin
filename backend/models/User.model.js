import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
      index: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    // Track if this is first login (temp password)
    isFirstLogin: {
      type: Boolean,
      default: true,
    },

    // Store temporary password (plain text for showing to user)
    tempPassword: {
      type: String,
      default: null,
      select: false,
    },

    avatar: {
      type: String,
      default: null,
    },

    // Roles
    role: {
      type: String,
      enum: ["user", "admin", "recruiter"],
      default: "user",
      index: true,
    },

    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },

    // Resume management
    lastResumeUrl: {
      type: String,
      default: null,
    },
    lastResumeUploadedAt: {
      type: Date,
      default: null,
    },

    // Legacy compatibility flag. New logic should rely on `status`.
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "disabled", "blocked"],
      default: "active",
      index: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    courseInterestedIn: {
      type: String,
      trim: true,
      default: null,
    },

    // Viewer scoring + tracking
    viewerScore: {
      type: Number,
      default: 0,
      index: true,
    },

    viewerMetrics: {
      visitCount: { type: Number, default: 0 },
      pagesNavigated: { type: Number, default: 0 },
      uniquePagePaths: { type: [String], default: [] },
      uniquePageTitles: { type: [String], default: [] },
      chatInteractions: { type: Number, default: 0 },
      loggedIn: { type: Boolean, default: false },
      deviceId: { type: String, default: null },
      sessionId: { type: String, default: null },
      lastMergedAt: { type: Date, default: null },
    },

    trustedDevices: [
      {
        tokenHash: { type: String, required: true },
        deviceName: { type: String, default: "Unknown Device" },
        createdAt: { type: Date, default: Date.now },
        lastUsed: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Compound indexes for common queries
userSchema.index({ email: 1, status: 1 });
userSchema.index({ phoneNumber: 1, status: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ viewerScore: -1, "viewerMetrics.lastMergedAt": -1 });

// Keep legacy isActive and new status in sync during migration.
userSchema.pre("validate", function (next) {
  if (this.isModified("status")) {
    this.isActive = this.status === "active";
    return next();
  }

  if (this.isModified("isActive")) {
    this.status = this.isActive ? "active" : "disabled";
  }

  next();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "30d" }
  );
};

userSchema.methods.isAccountActive = function () {
  if (this.status) {
    return this.status === "active";
  }

  return Boolean(this.isActive);
};

// Generate random password
userSchema.statics.generateRandomPassword = function () {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

export default mongoose.model("User", userSchema);
