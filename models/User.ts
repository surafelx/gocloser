import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the User interface
export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  googleId?: string;
  profilePicture?: string;
  stripeCustomerId?: string;
  hasActiveSubscription: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Create the User schema
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    profilePicture: {
      type: String,
    },
    stripeCustomerId: {
      type: String,
      sparse: true,
      unique: true,
    },
    hasActiveSubscription: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password') || !this.password) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Create and export the User model
let User: Model<IUser>;

try {
  // Try to get the existing model to prevent OverwriteModelError
  User = mongoose.model<IUser>('User');
} catch (error) {
  // Model doesn't exist yet, so create it
  User = mongoose.model<IUser>('User', UserSchema);
}

export default User;
