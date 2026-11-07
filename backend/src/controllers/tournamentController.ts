import { type Request, type Response } from 'express';
import TournamentService from '../services/tournamentService';
import { HttpError } from '../utils/HttpError';
import type { CreateTournamentBody } from '../types';

class TournamentController {
  static async create(
    req: Request<{}, {}, CreateTournamentBody>,
    res: Response,
  ): Promise<void> {
    try {
      const tournamentData = {
        ...req.body,
        created_by: req.user!.userId,
      };

      const newTournament = await TournamentService.createTournament(tournamentData);

      res.status(201).json({
        status: 'success',
        data: newTournament,
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
      const tournaments = await TournamentService.getAllTournaments();

      res.status(200).json({
        status: 'success',
        results: tournaments.length,
        data: tournaments,
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
      const tournament = await TournamentService.getTournamentById(id);

      res.status(200).json({
        status: 'success',
        data: tournament,
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

export default TournamentController;
