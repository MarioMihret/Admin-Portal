import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "super-admin"], required: true },
  isActive: { type: Boolean, default: true },
  requirePasswordChange: { type: Boolean, default: true },
  failedLoginAttempts: { type: Number, default: 0 },
  lastPasswordChange: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { 
  timestamps: false // We'll handle timestamps manually to match seed format
});

export const Role = mongoose.models.Role || mongoose.model("Role", roleSchema, "role"); 