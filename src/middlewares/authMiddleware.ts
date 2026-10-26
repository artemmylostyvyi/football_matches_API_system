import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/HttpError';
import type { JwtPayload } from '../types';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        status: 'error',
        message: 'Доступ заборонено. Токен відсутній.',
      });
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      res.status(500).json({
        status: 'error',
        message: 'JWT_SECRET не налаштовано',
      });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;

    next();
  } catch (error: unknown) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({
        status: 'error',
        message: 'Недійсний або прострочений токен.',
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(403).json({
        status: 'error',
        message: 'Недійсний або прострочений токен.',
      });
      return;
    }

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

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          status: 'error',
          message: 'У вас немає прав для виконання цієї дії.',
        });
        return;
      }

      next();
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
};

export default {
  authenticateToken,
  authorizeRoles,
};
