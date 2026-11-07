import TournamentModel from '../models/tournamentModel';
import { HttpError } from '../utils/HttpError';
import type { Tournament } from '../types';

class TournamentService {
  static async createTournament(tournamentData: {
    name: string;
    description?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    created_by?: number | null;
  }): Promise<Tournament> {
    const name = tournamentData.name?.trim();
    if (!name) {
      throw new HttpError('Назва турніру є обов\'язковою.', 400);
    }

    // Перевірка коректності дат
    if (tournamentData.start_date && tournamentData.end_date) {
      if (new Date(tournamentData.start_date) > new Date(tournamentData.end_date)) {
        throw new HttpError('Дата початку не може бути пізнішою за дату закінчення.', 400);
      }
    }

    const newTournament = await TournamentModel.create({ ...tournamentData, name });
    return newTournament;
  }

  static async getAllTournaments(): Promise<Tournament[]> {
    const tournaments = await TournamentModel.findAll();
    return tournaments;
  }

  static async getTournamentById(id: number): Promise<Tournament> {
    const tournament = await TournamentModel.findById(id);
    if (!tournament) {
      throw new HttpError('Турнір не знайдено.', 404);
    }
    return tournament;
  }
}

export default TournamentService;
