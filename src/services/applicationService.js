const ApplicationModel = require('../models/applicationModel');
const TournamentModel = require('../models/tournamentModel');
const TeamModel = require('../models/teamModel');

class ApplicationService {

  static async createApplication({ tournament_id, team_id }) {

    const tournament = await TournamentModel.findById(tournament_id);
    if (!tournament) {
      throw new Error('Турнір не знайдено.');
    }
    const team = await TeamModel.findById(team_id);
    if (!team) {
      throw new Error('Команду не знайдено.');
    }

    try {
      const newApplication = await ApplicationModel.create({ tournament_id, team_id });
      return newApplication;
    } catch (error) {
      // 23505 — code for dublicates
      if (error.code === '23505') {
        throw new Error('Ця команда вже подала заявку на участь у цьому турнірі.');
      }
      throw error;
    }
  }

  static async getAllApplications() {
    const applications = await ApplicationModel.findAll();
    return applications;
  }

  static async updateApplicationStatus(id, status) {
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new Error('Неприпустимий статус заявки. Використовуйте: pending, approved або rejected.');
    }

    const application = await ApplicationModel.findById(id);
    if (!application) {
      throw new Error('Заявку не знайдено.');
    }

    const updatedApplication = await ApplicationModel.updateStatus(id, status);
    return updatedApplication;
  }
}

module.exports = ApplicationService;