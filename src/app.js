const express = require("express"); // import express function for create app
const cors = require("cors"); // import middleware function
const db = require("./config/db");
require("dotenv").config();

// Routes
const tournamentRoutes = require('./routes/tournamentRoutes');
const authRoutes = require('./routes/authRoutes');


const app = express(); // create server object
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // lets frontend an access to backend
app.use(express.json()); // for convertion body in http method, JSON to JS object 


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tournaments', tournamentRoutes);

// Health check db connection
app.get("/api/health", async (req, res)=>{
  try{
    const result = await db.query('SELECT NOW()');
    res.json({
      status: 'ok',
      message: 'Server and Database are running!',
      dbTime: result.rows[0].now,
    });
  } 
  catch(error){
    console.log(error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); // running server