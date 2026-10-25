import { type Request, type Response } from 'express';
import TeamService from '../services/teamService';
import { HttpError } from '../utils/HttpError';
import type { CreateTeamBody } from '../types';

class TeamController {
  static async create(
    req: Request<{}, {}, CreateTeamBody>,
    res: Response,
  ): Promise<void> {
    try {
      const teamData = {
        ...req.body,
        coach_id: req.user!.userId,
      };

      const newTeam = await TeamService.createTeam(teamData);

      res.status(201).json({
        status: 'success',
        data: newTeam,
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
      const teams = await TeamService.getAllTeams();

      res.status(200).json({
        status: 'success',
        results: teams.length,
        data: teams,
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

  static async getById(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const team = await TeamService.getTeamById(id);

      res.status(200).json({
        status: 'success',
        data: team,
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
      res.status(404).json({
        status: 'error',
        message,
      });
      return;
    }
  }
}

export default TeamController;
