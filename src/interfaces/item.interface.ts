import { Document, Types } from 'mongoose';
import { IUser } from './user.interface';

export interface IItem extends Document {
  title: string;
  description: string;
  price: number;
  inStock: boolean;
  owner: Types.ObjectId | IUser['_id'];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemInput {
  title: string;
  description?: string;
  price: number;
  inStock?: boolean;
}

export interface UpdateItemInput {
  title?: string;
  description?: string;
  price?: number;
  inStock?: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedItems {
  items: IItem[];
  total: number;
  page: number;
  pages: number;
}
