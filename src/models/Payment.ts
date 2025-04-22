import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  tx_ref: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: "USD" },
  email: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["pending", "success", "failed"], 
    required: true,
    default: "pending"
  },
  payment_date: { type: Date, default: Date.now },
  callback_response: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create indexes for better performance
paymentSchema.index({ tx_ref: 1 });
paymentSchema.index({ email: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ payment_date: -1 });

export const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema, "payments"); 