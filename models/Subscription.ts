import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the Subscription interface
export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  planId: string;
  planName: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  tokenLimit: number;
  tokensUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

// Create the Subscription schema
const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
    },
    stripeSubscriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    stripePriceId: {
      type: String,
      required: true,
    },
    planId: {
      type: String,
      required: true,
      enum: ['starter', 'professional', 'team', 'free'],
    },
    planName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid'],
      default: 'active',
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    tokenLimit: {
      type: Number,
      required: true,
      default: 100000, // Default token limit
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the Subscription model
let Subscription: Model<ISubscription>;

try {
  // Try to get the existing model to prevent OverwriteModelError
  Subscription = mongoose.model<ISubscription>('Subscription');
} catch (error) {
  // Model doesn't exist yet, so create it
  Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
}

export default Subscription;
