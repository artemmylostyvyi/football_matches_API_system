import db from '../config/db';
import type { Application } from '../types';

class ApplicationModel {
  static async create({
    tournament_id,
    team_id,
  }: {
    tournament_id: number;
    team_id: number;
  }): Promise<Application> {
    const query = `
      INSERT INTO applications (tournament_id, team_id)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const values = [tournament_id, team_id];
    const result = await db.query<Application>(query, values);
    return result.rows[0];
  }

  static async findAll(): Promise<Application[]> {
    const query = `
      SELECT 
        a.*, 
        t.name AS tournament_name, 
        tm.name AS team_name, 
        u.email AS coach_email
      FROM applications a
      JOIN tournaments t ON a.tournament_id = t.id
      JOIN teams tm ON a.team_id = tm.id
      LEFT JOIN users u ON tm.coach_id = u.id
      ORDER BY a.created_at DESC;
    `;
    const result = await db.query<Application>(query);
    return result.rows;
  }

  static async updateStatus(id: number, status: Application['status']): Promise<Application | undefined> {
    const query = `
      UPDATE applications 
      SET status = $1 
      WHERE id = $2 
      RETURNING *;
    `;
    const result = await db.query<Application>(query, [status, id]);
    return result.rows[0];
  }

  static async findById(id: number): Promise<Application | undefined> {
    const query = `
      SELECT * FROM applications WHERE id = $1;
    `;
    const result = await db.query<Application>(query, [id]);
    return result.rows[0];
  }
}

export default ApplicationModel;
