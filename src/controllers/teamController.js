const TeamService = require('../services/teamService');

class TeamController {
  static async create(req, res) {
    try {
      const teamData = {
        ...req.body,
        coach_id: req.user.id,
      };

      const newTeam = await TeamService.createTeam(teamData);
      
      return res.status(201).json({
        status: 'success',
        data: newTeam,
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  static async getAll(req, res) {
    try {
      const teams = await TeamService.getAllTeams();
      
      return res.status(200).json({
        status: 'success',
        results: teams.length,
        data: teams,
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  static async getById(req, res) {
    try {
      const team = await TeamService.getTeamById(req.params.id);
      
      return res.status(200).json({
        status: 'success',
        data: team,
      });
    } catch (error) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      });
    }
  }
}

module.exports = TeamController;