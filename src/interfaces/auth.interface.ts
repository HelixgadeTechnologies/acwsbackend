import { IUser } from './user.interface';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: IUser;
  token: string;
}

export interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}
