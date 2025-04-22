import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "organizer", "admin", "super-admin"], default: "user" },
  isActive: { type: Boolean, default: true },
  requirePasswordChange: { type: Boolean, default: true },
  failedLoginAttempts: { type: Number, default: 0 },
  lastPasswordChange: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  lastLogout: { type: Date },
  loginHistory: [{
    loginTime: { type: Date },
    logoutTime: { type: Date },
    userAgent: { type: String },
    ipAddress: { type: String }
  }]
});

export const User = mongoose.models.User || mongoose.model("User", userSchema, "user"); 