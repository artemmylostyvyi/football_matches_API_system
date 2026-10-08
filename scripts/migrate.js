const db = require("../src/config/db");

const createTables = async ()=>{
    try{
        // Create special data types
        db.query(`
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
        db.query(`
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
      END $$;`);
        
        console.log('Migration completed successfully!');
        process.exit(0);
    } 
    catch(error){
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

createTables();