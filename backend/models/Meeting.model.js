const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    meetingType: {
      type: String,
      enum: ["instant", "scheduled"],
      required: true,
    },
    hostName: {
      type: String,
      required: [true, "Host name is required"],
      trim: true,
    },
    hostEmail: {
      type: String,
      required: [true, "Host email is required"],
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    guestEmail: {
      type: String,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    meetingLink: {
      type: String,
      required: true,
    },
    calendarEventId: {
      type: String,
    },
    scheduledDate: {
      type: Date,
    },
    scheduledTime: {
      type: String,
    },
    duration: {
      type: Number,
      default: 30, // minutes
    },
    subject: {
      type: String,
      default: "Charters Business Meeting",
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["waiting", "scheduled", "in-progress", "completed", "cancelled"],
      default: "waiting",
    },
    meetingNumber: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true },
);

// Generate meeting number before saving
meetingSchema.pre("save", async function (next) {
  if (!this.meetingNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Meeting").countDocuments();
    this.meetingNumber = `MEET${year}${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

// Index for querying
meetingSchema.index({ status: 1, createdAt: -1 });
meetingSchema.index({ hostEmail: 1 });
meetingSchema.index({ meetingType: 1 });

module.exports = mongoose.model("Meeting", meetingSchema);
