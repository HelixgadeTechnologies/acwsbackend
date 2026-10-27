import { Document, Types } from 'mongoose';

export type AdminRole = 'admin' | 'superadmin' | 'curator';

export interface IAdmin extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: AdminRole;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface AdminLoginInput {
  email: string;
  password?: string;
}

export interface AdminAuthResult {
  user: {
    _id: string;
    name: string;
    email: string;
    role: AdminRole;
  };
  token: string;
}
