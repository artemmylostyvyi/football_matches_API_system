import db from '../src/config/db';

const checkTables = async (): Promise<void> => {
  try {
    const res = await db.query<{ table_name: string }>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);

    console.log('--- З’ЄДНАННЯ УСПІШНЕ ---');
    console.log('Поточні таблиці в базі даних:');
    if (res.rows.length === 0) {
      console.log('База порожня! Жодної таблиці не знайдено.');
    } else {
      res.rows.forEach((row) => console.log(` - ${row.table_name}`));
    }
    process.exit(0);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Помилка підключення до бази:', message);
    process.exit(1);
  }
};

checkTables();
