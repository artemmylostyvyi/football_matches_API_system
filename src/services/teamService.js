const TeamModel = require('../models/teamModel');

class TeamService {
  static async createTeam(teamData) {
    const newTeam = await TeamModel.create(teamData);
    return newTeam;
  }

  static async getAllTeams() {
    const teams = await TeamModel.findAll();
    return teams;
  }

  static async getTeamById(id) {
    const team = await TeamModel.findById(id);
    if (!team) {
      throw new Error('Команду не знайдено.');
    }
    return team;
  }
}

module.exports = TeamService;