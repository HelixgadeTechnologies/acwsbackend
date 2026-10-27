import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IAdmin } from '../interfaces/admin.interface';

const adminSchema = new Schema<IAdmin>(
  {
    name: {
      type: String,
      required: [true, 'Admin name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Admin email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin', 'curator'],
      default: 'admin',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
adminSchema.pre<IAdmin>('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const rounds = parseInt(process.env.BCRYPT_ROUNDS as string, 10) || 12;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

// Compare password instance method
adminSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Omit password from toJSON representation
adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const Admin: Model<IAdmin> = mongoose.model<IAdmin>('Admin', adminSchema);

export default Admin;
