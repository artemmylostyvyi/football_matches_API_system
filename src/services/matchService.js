const MatchModel = require('../models/matchModel');
const TournamentModel = require('../models/tournamentModel');
const TeamModel = require('../models/teamModel');

class MatchService {
  // Створити новий матч (розклад)
  static async createMatch({ tournament_id, home_team_id, away_team_id, match_date }) {
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

  static async getAllMatches() {
    const matches = await MatchModel.findAll();
    return matches;
  }

  static async getMatchById(id) {
    const match = await MatchModel.findById(id);
    if (!match) {
      throw new Error('Матч не знайдено.');
    }
    return match;
  }

  static async updateMatchResult(id, { home_score, away_score, status }) {
    if (status) {
      const validStatuses = ['scheduled', 'live', 'finished'];
      if (!validStatuses.includes(status)) {
        throw new Error('Неприпустимий статус матчу. Використовуйте: scheduled, live або finished.');
      }
    }

    const match = await MatchModel.findById(id);
    if (!match) {
      throw new Error('Матч не знайдено.');
    }

    const updatedMatch = await MatchModel.updateResult(id, { home_score, away_score, status });
    return updatedMatch;
  }
}

module.exports = MatchService;