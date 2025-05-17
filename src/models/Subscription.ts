import mongoose, { Schema, Document, models, Model } from 'mongoose';

// Interface for the structure of metadata.paymentInitResponse.data
interface IPaymentInitResponseData {
  checkout_url: string;
}

// Interface for the structure of metadata.paymentInitResponse
interface IPaymentInitResponse {
  message: string;
  status: string;
  data: IPaymentInitResponseData;
}

// Interface for the structure of metadata (if it can contain more than just paymentInitResponse)
export interface ISubscriptionMetadata {
  paymentInitResponse?: IPaymentInitResponse; // Make it optional if not always present
  // Add other potential metadata fields here
}

// Interface for the structure of verificationResponse.data
interface IVerificationResponseData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string | null;
  currency?: string;
  amount?: number;
  charge?: number;
  mode?: string;
  method?: string;
  type?: string;
  status?: string;
  reference?: string;
  tx_ref?: string;
  customization?: {
    title?: string | null;
    description?: string | null;
    logo?: string | null;
  };
  meta?: any | null; // Adjust 'any' to a more specific type if known
  created_at?: string; // or Date
  updated_at?: string; // or Date
}

// Interface for the structure of verificationResponse
export interface IVerificationResponse {
  message: string;
  status: string;
  data: IVerificationResponseData | null; // Data can be null if verification fails or not present
}


export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId | string; 
  planId: string; 
  status: string; 
  paymentStatus: string; 
  startDate: Date; // Should be Date from Mongoose
  endDate: Date;   // Should be Date from Mongoose
  expiryDate?: Date; // Optional Date from Mongoose
  amount: number;
  currency: string;
  transactionRef?: string;
  metadata?: ISubscriptionMetadata;
  verificationResponse?: IVerificationResponse;
  createdAt?: Date; // Added by timestamps: true, will be Date
  updatedAt?: Date; // Added by timestamps: true, will be Date
}

const SubscriptionSchema: Schema<ISubscription> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Placeholder 'User'
  planId: { type: String, required: true },
  status: { type: String, required: true },
  paymentStatus: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  expiryDate: { type: Date },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  transactionRef: { type: String },
  metadata: { type: Schema.Types.Mixed }, 
  verificationResponse: { type: Schema.Types.Mixed },
}, {
  timestamps: true, 
  collection: 'subscriptions' 
});

export const Subscription = (models.Subscription as Model<ISubscription, {}, {}, {}>) ||
 mongoose.model<ISubscription>('Subscription', SubscriptionSchema); 