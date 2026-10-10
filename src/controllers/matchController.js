const MatchService = require('../services/matchService');

class MatchController {
  static async create(req, res) {
    try {
      const { tournament_id, home_team_id, away_team_id, match_date } = req.body;

      const newMatch = await MatchService.createMatch({
        tournament_id,
        home_team_id,
        away_team_id,
        match_date,
      });

      return res.status(201).json({
        status: 'success',
        data: newMatch,
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
      const matches = await MatchService.getAllMatches();

      return res.status(200).json({
        status: 'success',
        results: matches.length,
        data: matches,
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
      const { id } = req.params;
      const match = await MatchService.getMatchById(id);

      return res.status(200).json({
        status: 'success',
        data: match,
      });
    } catch (error) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  // Оновити рахунок та статус матчу (тільки адмін)
  static async updateResult(req, res) {
    try {
      const { id } = req.params;
      const { home_score, away_score, status } = req.body;

      const updatedMatch = await MatchService.updateMatchResult(id, {
        home_score,
        away_score,
        status,
      });

      return res.status(200).json({
        status: 'success',
        data: updatedMatch,
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }
}

module.exports = MatchController;