import db from '../config/db';
import type { User, SafeUser } from '../types';

// Знаходить користувача по email (повний рядок з БД, включно з password_hash)
// Використовується ТІЛЬКИ для перевірки паролю в authService
export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  const query = 'SELECT * FROM users WHERE email = $1';
  const { rows } = await db.query<User>(query, [email]);
  return rows[0];
};

// Знаходить безпечну форму користувача за id (без password_hash)
export const findById = async (id: number): Promise<SafeUser | undefined> => {
  const query = 'SELECT id, email, role, created_at FROM users WHERE id = $1';
  const { rows } = await db.query<SafeUser>(query, [id]);
  return rows[0];
};

// Створює користувача. RETURNING без password_hash - повертаємо безпечну форму
export const createUser = async (
  email: string,
  passwordHash: string,
  role: User['role'] = 'fan'
): Promise<SafeUser> => {
  const query = `
    INSERT INTO users (email, password_hash, role)
    VALUES ($1, $2, $3)
    RETURNING id, email, role, created_at
  `;
  const { rows } = await db.query<SafeUser>(query, [email, passwordHash, role]);
  return rows[0];
};

export default {
  findUserByEmail,
  findById,
  createUser,
};
