import ApplicationModel from '../models/applicationModel';
import TournamentModel from '../models/tournamentModel';
import TeamModel from '../models/teamModel';
import { HttpError } from '../utils/HttpError';
import { isUniqueViolation } from '../utils/dbErrors';
import type { Application, ApplicationStatus } from '../types';

class ApplicationService {
  static async createApplication({ tournament_id, team_id }: { tournament_id: number; team_id: number }): Promise<Application> {
    const tournament = await TournamentModel.findById(tournament_id);
    if (!tournament) {
      throw new HttpError('Турнір не знайдено.', 404);
    }
    const team = await TeamModel.findById(team_id);
    if (!team) {
      throw new HttpError('Команду не знайдено.', 404);
    }

    try {
      const newApplication = await ApplicationModel.create({ tournament_id, team_id });
      return newApplication;
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new HttpError('Ця команда вже подала заявку на участь у цьому турнірі.', 409);
      }
      throw error;
    }
  }

  static async getAllApplications(): Promise<Application[]> {
    const applications = await ApplicationModel.findAll();
    return applications;
  }

  static async updateApplicationStatus(id: number, status: ApplicationStatus): Promise<Application> {
    const validStatuses: ApplicationStatus[] = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new HttpError('Неприпустимий статус заявки. Використовуйте: pending, approved або rejected.', 400);
    }

    const application = await ApplicationModel.findById(id);
    if (!application) {
      throw new HttpError('Заявку не знайдено.', 404);
    }

    const updatedApplication = await ApplicationModel.updateStatus(id, status);
    if (!updatedApplication) {
      throw new HttpError('Не вдалося оновити заявку.', 500);
    }
    return updatedApplication;
  }
}

export default ApplicationService;
