import TeamModel from '../models/teamModel';
import type { Team } from '../types';

class TeamService {
  static async createTeam(teamData: {
    name: string;
    description?: string | null;
    coach_id?: number | null;
  }): Promise<Team> {
    const newTeam = await TeamModel.create(teamData);
    return newTeam;
  }

  static async getAllTeams(): Promise<Team[]> {
    const teams = await TeamModel.findAll();
    return teams;
  }

  static async getTeamById(id: number): Promise<Team> {
    const team = await TeamModel.findById(id);
    if (!team) {
      throw new Error('Команду не знайдено.');
    }
    return team;
  }
}

export default TeamService;
