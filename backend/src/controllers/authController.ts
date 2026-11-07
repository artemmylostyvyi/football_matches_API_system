import { type Request, type Response } from 'express';
import authService from '../services/authService';
import { HttpError } from '../utils/HttpError';
import type { LoginBody, RegisterBody } from '../types';

// http request to service register logic
const register = async (
  req: Request<{}, {}, RegisterBody>,
  res: Response,
): Promise<void> => {
  try {
    // destructirize body of http request
    const { email, password, role } = req.body;

    // Checking required fields
    if (!email || !password) {
      res.status(400).json({
        status: 'error',
        message: 'Email та пароль є обов\'язковими полями',
      });
      return;
    }

    // Call service function
    const newUser = await authService.register(email, password, role);

    res.status(201).json({
      status: 'success',
      message: 'Користувача успішно зареєстровано',
      data: { user: newUser },
    });
    return;
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
      return;
    }
    const message = error instanceof Error ? error.message : 'Внутрішня помилка сервера';
    res.status(500).json({
      status: 'error',
      message,
    });
    return;
  }
};

const login = async (
  req: Request<{}, {}, LoginBody>,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Checking required fields
    if (!email || !password) {
      res.status(400).json({
        status: 'error',
        message: 'Email та пароль є обов\'язковими полями',
      });
      return;
    }

    const result = await authService.login(email, password);

    res.status(200).json({
      status: 'success',
      message: 'Успішний вхід у систему',
      data: result,
    });
    return;
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
      return;
    }
    const message = error instanceof Error ? error.message : 'Внутрішня помилка сервера';
    res.status(500).json({
      status: 'error',
      message,
    });
    return;
  }
};

export default {
  register,
  login,
};
