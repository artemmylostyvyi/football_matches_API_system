import db from '../config/db';
import type { Tournament } from '../types';

class TournamentModel {
  static async create({
    name,
    description,
    start_date,
    end_date,
    created_by,
  }: {
    name: string;
    description?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    created_by?: number | null;
  }): Promise<Tournament> {
    const query = `
      INSERT INTO tournaments (name, description, start_date, end_date, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [name, description ?? null, start_date ?? null, end_date ?? null, created_by ?? null];
    const result = await db.query<Tournament>(query, values);
    return result.rows[0];
  }

  static async findAll(): Promise<Tournament[]> {
    const query = `
      SELECT t.*, u.email as creator_email 
      FROM tournaments t
      LEFT JOIN users u ON t.created_by = u.id
      ORDER BY t.created_at DESC;
    `;
    const result = await db.query<Tournament>(query);
    return result.rows;
  }

  static async findById(id: number): Promise<Tournament | undefined> {
    const query = `
      SELECT t.*, u.email as creator_email 
      FROM tournaments t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = $1;
    `;
    const result = await db.query<Tournament>(query, [id]);
    return result.rows[0];
  }
}

export default TournamentModel;
