const db = require('../config/db');

class TeamModel {
  static async create({ name, description, coach_id }) {
    const query = `
      INSERT INTO teams (name, description, coach_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [name, description, coach_id];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT t.*, u.email as coach_email 
      FROM teams t
      LEFT JOIN users u ON t.coach_id = u.id
      ORDER BY t.created_at DESC;
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT t.*, u.email as coach_email 
      FROM teams t
      LEFT JOIN users u ON t.coach_id = u.id
      WHERE t.id = $1;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = TeamModel;