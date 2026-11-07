import { type Request, type Response } from 'express';
import MatchService from '../services/matchService';
import { HttpError } from '../utils/HttpError';
import type { CreateMatchBody, UpdateMatchResultBody } from '../types';

class MatchController {
  static async create(
    req: Request<{}, {}, CreateMatchBody>,
    res: Response,
  ): Promise<void> {
    try {
      const { tournament_id, home_team_id, away_team_id, match_date } = req.body;

      const newMatch = await MatchService.createMatch({
        tournament_id,
        home_team_id,
        away_team_id,
        match_date,
      });

      res.status(201).json({
        status: 'success',
        data: newMatch,
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
      const matches = await MatchService.getAllMatches();

      res.status(200).json({
        status: 'success',
        results: matches.length,
        data: matches,
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
      const match = await MatchService.getMatchById(id);

      res.status(200).json({
        status: 'success',
        data: match,
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

  static async updateResult(
    req: Request<{ id: string }, {}, UpdateMatchResultBody>,
    res: Response,
  ): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { home_score, away_score, status } = req.body;

      const updatedMatch = await MatchService.updateMatchResult(id, {
        home_score,
        away_score,
        status,
      });

      res.status(200).json({
        status: 'success',
        data: updatedMatch,
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
        status: 'error', message,
      });
      return;
    }
  }
}

export default MatchController;
