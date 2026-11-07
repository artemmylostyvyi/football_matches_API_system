import MatchModel from '../models/matchModel';
import TournamentModel from '../models/tournamentModel';
import TeamModel from '../models/teamModel';
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
      throw new Error('Команда не може грати сама проти себе.');
    }

    // Перевірка існування турніру
    const tournament = await TournamentModel.findById(tournament_id);
    if (!tournament) {
      throw new Error('Турнір не знайдено.');
    }

    // Перевірка домашньої команди
    const homeTeam = await TeamModel.findById(home_team_id);
    if (!homeTeam) {
      throw new Error('Домашню команду не знайдено.');
    }

    // Перевірка виїзної команди
    const awayTeam = await TeamModel.findById(away_team_id);
    if (!awayTeam) {
      throw new Error('Виїзну команду не знайдено.');
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
      throw new Error('Матч не знайдено.');
    }
    return match;
  }

  static async updateMatchResult(
    id: number,
    { home_score, away_score, status }: { home_score?: number; away_score?: number; status?: MatchStatus }
  ): Promise<Match> {
    if (status) {
      const validStatuses: MatchStatus[] = ['scheduled', 'in_progress', 'finished'];
      if (!validStatuses.includes(status)) {
        throw new Error('Неприпустимий статус матчу. Використовуйте: scheduled, in_progress або finished.');
      }
    }

    const match = await MatchModel.findById(id);
    if (!match) {
      throw new Error('Матч не знайдено.');
    }

    const updatedMatch = await MatchModel.updateResult(id, { home_score, away_score, status });
    if (!updatedMatch) {
      throw new Error('Не вдалося оновити результат матчу.');
    }
    return updatedMatch;
  }
}

export default MatchService;
