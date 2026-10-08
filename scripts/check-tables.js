const db = require('../src/config/db');

const checkTables = async () => {
  try {
    const res = await db.query(`
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
  } catch (err) {
    console.error('Помилка підключення до бази:', err.message);
    process.exit(1);
  }
};

checkTables();