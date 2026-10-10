const TournamentModel = require('../models/tournamentModel');

class TournamentService {
  static async createTournament(tournamentData) {
    // check the correct data time
    if (tournamentData.start_date && tournamentData.end_date) {
      if (new Date(tournamentData.start_date) > new Date(tournamentData.end_date)) {
        throw new Error('Дата початку не може бути пізнішою за дату закінчення.');
      }
    }

    const newTournament = await TournamentModel.create(tournamentData);
    return newTournament;
  }

  static async getAllTournaments() {
    const tournaments = await TournamentModel.findAll();
    return tournaments;
  }
  static async getTournamentById(id) {
    const tournament = await TournamentModel.findById(id);
    if (!tournament) {
      throw new Error('Турнір не знайдено.');
    }
    return tournament;
  }
}

module.exports = TournamentService;