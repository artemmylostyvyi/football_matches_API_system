import ApplicationModel from '../models/applicationModel';
import TournamentModel from '../models/tournamentModel';
import TeamModel from '../models/teamModel';
import type { Application, ApplicationStatus } from '../types';

class ApplicationService {
  static async createApplication({ tournament_id, team_id }: { tournament_id: number; team_id: number }): Promise<Application> {
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
    } catch (error: unknown) {
      // 23505 — code for duplicates (Postgres unique constraint violation)
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === '23505') {
        throw new Error('Ця команда вже подала заявку на участь у цьому турнірі.');
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
      throw new Error('Неприпустимий статус заявки. Використовуйте: pending, approved або rejected.');
    }

    const application = await ApplicationModel.findById(id);
    if (!application) {
      throw new Error('Заявку не знайдено.');
    }

    const updatedApplication = await ApplicationModel.updateStatus(id, status);
    if (!updatedApplication) {
      throw new Error('Не вдалося оновити заявку.');
    }
    return updatedApplication;
  }
}

export default ApplicationService;
