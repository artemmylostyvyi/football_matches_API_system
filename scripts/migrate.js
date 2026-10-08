const db = require("../src/config/db");

const createTables = async ()=>{
    try{
        // Create special data types
      await db.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'coach', 'fan');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE match_status AS ENUM ('scheduled', 'in_progress', 'finished');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
            `);
        // Create tables
      await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role user_role DEFAULT 'fan',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tournaments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
          `);
        
        console.log('Migration completed successfully!');
        process.exit(0);
    } 
    catch(error){
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

createTables();