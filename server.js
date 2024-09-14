import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';  // Added to serve static files
import { fileURLToPath } from 'url'; // For ES modules compatibility with __dirname
import mongoose from 'mongoose';  // Added mongoose for MongoDB connection

const app = express();
const PORT = process.env.PORT || 5000;  // Use process.env.PORT for Heroku

// Use the directory name (needed for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors()); // Enable CORS for all routes

// MongoDB connection
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://dwi3209:Ngc4414flux!@ct-dashboard-schedule.2a9ts.mongodb.net/?retryWrites=true&w=majority&appName=ct-dashboard-schedule';  // Add your MongoDB URI here

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// BBB API configuration
const BBB_URL = process.env.BBB_URL || 'https://bbb.cybertech242-online.com/bigbluebutton/api'; // Use environment variables for security
const BBB_SECRET = process.env.BBB_SECRET || '6e5qNuCuwbboDlxnEqHNn74XdCil07gDuAqDNLp9y4'; // Use environment variables for security

// Function to generate SHA-1 checksum
const generateChecksum = (apiCall, params) => {
  const queryString = new URLSearchParams(params).toString();
  const stringToHash = `${apiCall}${queryString}${BBB_SECRET}`;
  return crypto.createHash('sha1').update(stringToHash).digest('hex');
};

// API route to get recordings
app.get('/api/getRecordings', async (req, res) => {
  const { meetingID } = req.query;
  const apiCall = 'getRecordings';
  const params = {};

  if (meetingID) {
    params['meetingID'] = meetingID;
  }

  const checksum = generateChecksum(apiCall, params);
  const queryString = new URLSearchParams(params).toString();
  const bbbApiUrl = `${BBB_URL}/${apiCall}?${queryString}&checksum=${checksum}`;

  console.log('Constructed BBB API URL:', bbbApiUrl);

  try {
    const response = await fetch(bbbApiUrl);
    const data = await response.text();
    res.send(data);
  } catch (error) {
    console.error('Error fetching recordings from BBB API:', error);
    res.status(500).send('Error fetching recordings from BBB API');
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Catch-all route to serve React frontend for any unhandled routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
