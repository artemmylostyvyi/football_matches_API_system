const db = require("../config/db");

// function which find user by email and return it
const findUserByEmail = async(email)=>{
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await db.query(query, [email]); // sql query, where rows is response from db
    return rows[0];
};

// function which create a new user 
const createUser = async (email, passwordHash, role = 'fan') => {
  const query = `
    INSERT INTO users (email, password_hash, role)
    VALUES ($1, $2, $3)
    RETURNING id, email, role, created_at
  `;
  const { rows } = await db.query(query, [email, passwordHash, role]);
  return rows[0];
};

module.exports = {
  findUserByEmail,
  createUser,
};