const { Pool } = require('pg'); // Import pool function to create object which has several connections to DB;
require("dotenv").config(); // Making .env data as a global proccess object

const pool = new Pool ({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
}); // Create project with .env data

pool.on('connect', ()=>{
    console.log("Successfully connected to PostgreSQL");
}); // Listening to connect confirming from DB

pool.on('error', ()=>{
    console.error('Unexpected error on idle client', err);
    process.exit(-1); // for stoping node js proccess immeadiately
}); // Listening to error from DB if connection failed


module.exports = {
    query: (text, params) => pool.query(text, params), // function which takes pool object and connect to DB
} // export query function to other modules