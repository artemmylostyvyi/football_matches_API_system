import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel';
import { env } from '../config/env';
import { HttpError } from '../utils/HttpError';
import type { SafeUser, UserRole } from '../types';

// Register function
const register = async (email: string, password: string, role?: UserRole): Promise<SafeUser> => {
  // Check if this user has already existed in db
  const existingUser = await userModel.findUserByEmail(email);
  if (existingUser) {
    throw new HttpError('Користувач з таким email вже існує', 400);
  }

  const saltRounds = 10; // level of hashing (10 - max)
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Call function to create user from userModel
  const newUser = await userModel.createUser(email, passwordHash, role);
  return newUser;
};

// Login function
const login = async (
  email: string,
  password: string
): Promise<{ user: SafeUser; token: string }> => {
  const user = await userModel.findUserByEmail(email);
  if (!user) {
    throw new HttpError('Невірний email або пароль', 401);
  }

  // Correct check of password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new HttpError('Невірний email або пароль', 401);
  }

  // Create token
  const payload = {
    userId: user.id,
    role: user.role,
  };

  const token = jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as any,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

export default {
  register,
  login,
};
