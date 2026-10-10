const db = require('../config/db');

// class to work with every query 
class TournamentModel {

    // create new tournamnet
  static async create({ name, description, start_date, end_date, created_by }) {
    const query = `
      INSERT INTO tournaments (name, description, start_date, end_date, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [name, description, start_date, end_date, created_by];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // find all tournamnets
  static async findAll() {
    const query = `
      SELECT t.*, u.email as creator_email 
      FROM tournaments t
      LEFT JOIN users u ON t.created_by = u.id
      ORDER BY t.created_at DESC;
    `;
    const result = await db.query(query);
    return result.rows;
  }

// find spesific tournament
  static async findById(id) {
    const query = `
      SELECT t.*, u.email as creator_email 
      FROM tournaments t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = $1;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = TournamentModel;