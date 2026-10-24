import db from '../config/db';
import type { Team } from '../types';

class TeamModel {
  static async create({
    name,
    description,
    coach_id,
  }: {
    name: string;
    description?: string | null;
    coach_id?: number | null;
  }): Promise<Team> {
    const query = `
      INSERT INTO teams (name, description, coach_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [name, description ?? null, coach_id ?? null];
    const result = await db.query<Team>(query, values);
    return result.rows[0];
  }

  static async findAll(): Promise<Team[]> {
    const query = `
      SELECT t.*, u.email as coach_email 
      FROM teams t
      LEFT JOIN users u ON t.coach_id = u.id
      ORDER BY t.created_at DESC;
    `;
    const result = await db.query<Team>(query);
    return result.rows;
  }

  static async findById(id: number): Promise<Team | undefined> {
    const query = `
      SELECT t.*, u.email as coach_email 
      FROM teams t
      LEFT JOIN users u ON t.coach_id = u.id
      WHERE t.id = $1;
    `;
    const result = await db.query<Team>(query, [id]);
    return result.rows[0];
  }
}

export default TeamModel;
