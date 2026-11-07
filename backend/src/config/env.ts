import dotenv from 'dotenv';
dotenv.config();

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Відсутня обов'язкова змінна оточення: ${key}`);
  }
  return value;
}

function getRequiredNumberEnv(key: string): number {
  const value = getRequiredEnv(key);
  const num = Number(value);
  if (Number.isNaN(num)) {
    throw new Error(`Змінна оточення ${key} має бути числом, отримано: ${value}`);
  }
  return num;
}

export const env = {
  port: getRequiredNumberEnv('PORT'),
  jwtSecret: getRequiredEnv('JWT_SECRET'),
  jwtExpiresIn: getRequiredEnv('JWT_EXPIRES_IN'),
  db: {
    user: getRequiredEnv('DB_USER'),
    password: getRequiredEnv('DB_PASSWORD'),
    host: getRequiredEnv('DB_HOST'),
    port: getRequiredNumberEnv('DB_PORT'),
    name: getRequiredEnv('DB_NAME'),
  },
} as const;
