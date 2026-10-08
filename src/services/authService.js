const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

// Register function
const register = async (email, password, role) => {
  
  // Check if this user has already existed in db
  const existingUser = await userModel.findUserByEmail(email);
  if (existingUser) {
    const error = new Error('Користувач з таким email вже існує');
    error.statusCode = 400;
    throw error;
  }

  const saltRounds = 10; // level of hashing (10 - max)
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Call function to create user from userModel
  const newUser = await userModel.createUser(email, passwordHash, role);

  return newUser;
};

// Login function
const login = async (email, password) => {
  
  const user = await userModel.findUserByEmail(email);
  if (!user) {
    const error = new Error('Невірний email або пароль');
    error.statusCode = 401; // Unauthorized
    throw error;
  }

  // Correct check of password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    const error = new Error('Невірний email або пароль');
    error.statusCode = 401; // Unauthorized
    throw error;
  }

  // Create token
  const payload = {
    userId: user.id,
    role: user.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h', // time for token to live
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

module.exports = {
  register,
  login,
};

