import db from '../config/db';
import type { Match } from '../types';

class MatchModel {
  static async create({
    tournament_id,
    home_team_id,
    away_team_id,
    match_date,
  }: {
    tournament_id: number;
    home_team_id: number;
    away_team_id: number;
    match_date?: string | null;
  }): Promise<Match> {
    const query = `
      INSERT INTO matches (tournament_id, home_team_id, away_team_id, match_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [tournament_id, home_team_id, away_team_id, match_date ?? null];
    const result = await db.query<Match>(query, values);
    return result.rows[0];
  }

  static async findAll(): Promise<Match[]> {
    const query = `
      SELECT 
        m.*,
        t.name AS tournament_name,
        ht.name AS home_team_name,
        at.name AS away_team_name
      FROM matches m
      JOIN tournaments t ON m.tournament_id = t.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      ORDER BY m.match_date ASC;
    `;
    const result = await db.query<Match>(query);
    return result.rows;
  }

  static async findById(id: number): Promise<Match | undefined> {
    const query = `
      SELECT 
        m.*,
        t.name AS tournament_name,
        ht.name AS home_team_name,
        at.name AS away_team_name
      FROM matches m
      JOIN tournaments t ON m.tournament_id = t.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.id = $1;
    `;
    const result = await db.query<Match>(query, [id]);
    return result.rows[0];
  }

  static async updateResult(
    id: number,
    { home_score, away_score, status }: { home_score?: number; away_score?: number; status?: Match['status'] }
  ): Promise<Match | undefined> {
    const query = `
      UPDATE matches 
      SET home_score = COALESCE($1, home_score),
          away_score = COALESCE($2, away_score),
          status = COALESCE($3, status)
      WHERE id = $4
      RETURNING *;
    `;
    const values = [home_score ?? null, away_score ?? null, status ?? null, id];
    const result = await db.query<Match>(query, values);
    return result.rows[0];
  }
}

export default MatchModel;
