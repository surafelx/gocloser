import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the Payment interface
export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  // Stripe fields (kept for backward compatibility)
  stripeCustomerId?: string;
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  // Whop fields
  whopUserId?: string;
  whopMembershipId?: string;
  whopPaymentId?: string;
  // Common fields
  amount: number;
  currency: string;
  status: 'paid' | 'unpaid' | 'no_payment_required' | 'failed';
  description: string;
  planId: string;
  planName: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  invoiceUrl: string;
  receiptUrl: string;
  createdAt: Date;
}

// Create the Payment schema
const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Stripe fields (kept for backward compatibility)
    stripeCustomerId: {
      type: String,
      required: false,
    },
    stripeInvoiceId: {
      type: String,
      required: false,
      sparse: true,
      unique: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: false,
    },
    // Whop fields
    whopUserId: {
      type: String,
      required: false,
    },
    whopMembershipId: {
      type: String,
      required: false,
    },
    whopPaymentId: {
      type: String,
      required: false,
      sparse: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'usd',
    },
    status: {
      type: String,
      required: true,
      enum: ['paid', 'unpaid', 'no_payment_required', 'failed'],
    },
    description: {
      type: String,
      required: true,
    },
    planId: {
      type: String,
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    billingPeriodStart: {
      type: Date,
      required: true,
    },
    billingPeriodEnd: {
      type: Date,
      required: true,
    },
    invoiceUrl: {
      type: String,
    },
    receiptUrl: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// Create and export the Payment model
let Payment: Model<IPayment>;

try {
  // Try to get the existing model to prevent OverwriteModelError
  Payment = mongoose.model<IPayment>('Payment');
} catch (error) {
  // Model doesn't exist yet, so create it
  Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
}

export default Payment;
