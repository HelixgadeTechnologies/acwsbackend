import { IUser } from '../interfaces/user.interface';

// Augment Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};
