import MatchModel from '../models/matchModel';
import TournamentModel from '../models/tournamentModel';
import TeamModel from '../models/teamModel';
import { HttpError } from '../utils/HttpError';
import type { Match, MatchStatus } from '../types';

class MatchService {
  // Створити новий матч (розклад)
  static async createMatch({
    tournament_id,
    home_team_id,
    away_team_id,
    match_date,
  }: {
    tournament_id: number;
    home_team_id: number;
    away_team_id: number;
    match_date?: string | null;
  }): Promise<Match> {
    if (home_team_id === away_team_id) {
      throw new HttpError('Команда не може грати сама проти себе.', 400);
    }

    // Перевірка існування турніру
    const tournament = await TournamentModel.findById(tournament_id);
    if (!tournament) {
      throw new HttpError('Турнір не знайдено.', 404);
    }

    // Перевірка домашньої команди
    const homeTeam = await TeamModel.findById(home_team_id);
    if (!homeTeam) {
      throw new HttpError('Домашню команду не знайдено.', 404);
    }

    // Перевірка виїзної команди
    const awayTeam = await TeamModel.findById(away_team_id);
    if (!awayTeam) {
      throw new HttpError('Виїзну команду не знайдено.', 404);
    }

    const newMatch = await MatchModel.create({
      tournament_id,
      home_team_id,
      away_team_id,
      match_date,
    });

    return newMatch;
  }

  static async getAllMatches(): Promise<Match[]> {
    const matches = await MatchModel.findAll();
    return matches;
  }

  static async getMatchById(id: number): Promise<Match> {
    const match = await MatchModel.findById(id);
    if (!match) {
      throw new HttpError('Матч не знайдено.', 404);
    }
    return match;
  }

  static async updateMatchResult(
    id: number,
    { home_score, away_score, status }: { home_score?: number; away_score?: number; status?: MatchStatus }
  ): Promise<Match> {
    if (home_score !== undefined && (!Number.isInteger(home_score) || home_score < 0)) {
      throw new HttpError('Рахунок має бути цілим невід\'ємним числом.', 400);
    }
    if (away_score !== undefined && (!Number.isInteger(away_score) || away_score < 0)) {
      throw new HttpError('Рахунок має бути цілим невід\'ємним числом.', 400);
    }

    if (status) {
      const validStatuses: MatchStatus[] = ['scheduled', 'in_progress', 'finished'];
      if (!validStatuses.includes(status)) {
        throw new HttpError('Неприпустимий статус матчу. Використовуйте: scheduled, in_progress або finished.', 400);
      }
    }

    const match = await MatchModel.findById(id);
    if (!match) {
      throw new HttpError('Матч не знайдено.', 404);
    }

    const updatedMatch = await MatchModel.updateResult(id, { home_score, away_score, status });
    if (!updatedMatch) {
      throw new HttpError('Не вдалося оновити результат матчу.', 500);
    }
    return updatedMatch;
  }
}

export default MatchService;
