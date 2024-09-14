import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import fetch from 'node-fetch';
import mongoose from 'mongoose'; // Import Mongoose
import path from 'path'; // Added to serve static files
import { fileURLToPath } from 'url'; // For ES modules compatibility with __dirname


const app = express();
const PORT = process.env.PORT || 5000; // Use process.env.PORT for Heroku

// Use the directory name (needed for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON bodies

// BBB API configuration
const BBB_URL = process.env.BBB_URL || 'https://bbb.cybertech242-online.com/bigbluebutton/api'; // Use environment variables for security
const BBB_SECRET = process.env.BBB_SECRET || '6e5qNuCuwbboDlxnEqHNn74XdCil07gDuAqDNLp9y4'; // Use environment variables for security

// MongoDB connection URI
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://dwi3209:Ngc4414flux!@ct-dashboard-schedule.2a9ts.mongodb.net/?retryWrites=true&w=majority&appName=ct-dashboard-schedule';

// Connect to MongoDB using Mongoose
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((error) => console.error('MongoDB connection error:', error));

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

// API route to get meetings
app.get('/api/getMeetings', async (req, res) => {
  const apiCall = 'getMeetings';
  const params = {};
  const checksum = generateChecksum(apiCall, params);

  const bbbApiUrl = `${BBB_URL}/${apiCall}?checksum=${checksum}`;
  console.log('Constructed BBB API URL for getMeetings:', bbbApiUrl);

  try {
    const response = await fetch(bbbApiUrl);
    const data = await response.text();
    res.send(data);
  } catch (error) {
    console.error('Error fetching meetings from BBB API:', error);
    res.status(500).send('Error fetching meetings from BBB API');
  }
});

// API route to join a meeting
app.get('/api/joinMeeting', async (req, res) => {
  const { fullName, meetingID, role } = req.query;

  if (!fullName || !meetingID || !role) {
    return res.status(400).send('Missing required parameters: fullName, meetingID, or role');
  }

  const apiCall = 'join';
  const params = {
    fullName,
    meetingID,
    role,
    excludeFromDashboard: 'true',
    redirect: 'true'
  };

  const checksum = generateChecksum(apiCall, params);
  const queryString = new URLSearchParams(params).toString();
  const bbbApiUrl = `${BBB_URL}/${apiCall}?${queryString}&checksum=${checksum}`;

  console.log('Constructed BBB Join API URL:', bbbApiUrl);

  try {
    res.send({ url: bbbApiUrl });
  } catch (error) {
    console.error('Error generating join URL for BBB:', error);
    res.status(500).send('Error generating join URL');
  }
});

// API route to delete recordings
app.get('/api/deleteRecordings', async (req, res) => {
  const { recordID } = req.query;

  if (!recordID) {
    return res.status(400).send('Missing recordID parameter');
  }

  const apiCall = 'deleteRecordings';
  const params = { recordID };
  const checksum = generateChecksum(apiCall, params);
  const queryString = new URLSearchParams(params).toString();
  const bbbApiUrl = `${BBB_URL}/${apiCall}?${queryString}&checksum=${checksum}`;

  console.log('Constructed BBB Delete API URL:', bbbApiUrl);

  try {
    const response = await fetch(bbbApiUrl);
    if (response.ok) {
      res.send('Recordings deleted successfully');
    } else {
      res.status(response.status).send('Error deleting recordings');
    }
  } catch (error) {
    console.error('Error deleting recordings from BBB API:', error);
    res.status(500).send('Error deleting recordings from BBB API');
  }
});

// API route to save a course
app.post('/api/saveCourse', async (req, res) => {
  try {
    const { name, startHour, endHour, days, bbbContextName } = req.body;

    // Validate input
    if (!name || !startHour || !endHour || !days || !bbbContextName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Create a new course
    const newCourse = new Course({ name, startHour, endHour, days, bbbContextName });
    await newCourse.save();

    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error saving course:', error);
    res.status(500).json({ error: 'Error saving course' });
  }
});

// API route to get all courses
app.get('/api/getCourses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Error fetching courses' });
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
