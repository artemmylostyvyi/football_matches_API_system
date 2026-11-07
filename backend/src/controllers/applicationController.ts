import { type Request, type Response } from 'express';
import ApplicationService from '../services/applicationService';
import { HttpError } from '../utils/HttpError';
import type { CreateApplicationBody, UpdateApplicationStatusBody } from '../types';

class ApplicationController {
  static async create(
    req: Request<{}, {}, CreateApplicationBody>,
    res: Response,
  ): Promise<void> {
    try {
      const { tournament_id, team_id } = req.body;

      const newApplication = await ApplicationService.createApplication({
        tournament_id,
        team_id,
      });

      res.status(201).json({
        status: 'success',
        data: newApplication,
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
      res.status(400).json({
        status: 'error',
        message,
      });
      return;
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const applications = await ApplicationService.getAllApplications();

      res.status(200).json({
        status: 'success',
        results: applications.length,
        data: applications,
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
  }

  static async updateStatus(
    req: Request<{ id: string }, {}, UpdateApplicationStatusBody>,
    res: Response,
  ): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;

      const updatedApplication = await ApplicationService.updateApplicationStatus(id, status);

      res.status(200).json({
        status: 'success',
        data: updatedApplication,
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
      res.status(400).json({
        status: 'error',
        message,
      });
      return;
    }
  }
}

export default ApplicationController;
