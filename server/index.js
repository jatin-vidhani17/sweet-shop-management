const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./api/db');

const app = express();

app.use(cors());
app.use(express.json());

// Define the port
const PORT = process.env.PORT || 4000;

// Wrap connection and server start in an async function
const startServer = async () => {
  try {
    await connectDB(); // Wait for MongoDB to connect
    console.log('MongoDB connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running locally on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
};

startServer();
