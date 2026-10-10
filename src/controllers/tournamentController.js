const TournamentService = require('../services/tournamentService');

class TournamentController {
  static async create(req, res) {
    try {
      const tournamentData = {
        ...req.body,
        created_by: req.user.id,
      };

      const newTournament = await TournamentService.createTournament(tournamentData);
      
      return res.status(201).json({
        status: 'success',
        data: newTournament,
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
      const tournaments = await TournamentService.getAllTournaments();
      
      return res.status(200).json({
        status: 'success',
        results: tournaments.length,
        data: tournaments,
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
      const tournament = await TournamentService.getTournamentById(req.params.id);
      
      return res.status(200).json({
        status: 'success',
        data: tournament,
      });
    } catch (error) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      });
    }
  }
}

module.exports = TournamentController;