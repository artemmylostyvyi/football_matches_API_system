import TeamModel from '../models/teamModel';
import { HttpError } from '../utils/HttpError';
import { isUniqueViolation } from '../utils/dbErrors';
import type { Team } from '../types';

class TeamService {
  static async createTeam(teamData: {
    name: string;
    description?: string | null;
    coach_id?: number | null;
  }): Promise<Team> {
    const name = teamData.name?.trim();
    if (!name) {
      throw new HttpError('Назва команди є обов\'язковою.', 400);
    }

    try {
      const newTeam = await TeamModel.create({ ...teamData, name });
      return newTeam;
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new HttpError('Команда з такою назвою вже існує.', 409);
      }
      throw error;
    }
  }

  static async getAllTeams(): Promise<Team[]> {
    const teams = await TeamModel.findAll();
    return teams;
  }

  static async getTeamById(id: number): Promise<Team> {
    const team = await TeamModel.findById(id);
    if (!team) {
      throw new HttpError('Команду не знайдено.', 404);
    }
    return team;
  }
}

export default TeamService;
