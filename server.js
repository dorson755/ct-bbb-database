import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';  // Added to serve static files
import { fileURLToPath } from 'url'; // For ES modules compatibility with __dirname
import mongoose from 'mongoose'; // Import mongoose for MongoDB

const app = express();
const PORT = process.env.PORT || 5000;  // Use process.env.PORT for Heroku

// Use the directory name (needed for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// Define a schema and model for courses
const courseSchema = new mongoose.Schema({
  name: String,
  startTime: String,
  endTime: String,
  days: [String],
  bbbContextName: String,
});

const Course = mongoose.model('Course', courseSchema);

// API route to save courses
app.post('/api/courses', async (req, res) => {
  try {
    const newCourse = new Course(req.body);
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error saving course:', error);
    res.status(500).send('Error saving course');
  }
});

// API route to get saved courses
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).send('Error fetching courses');
  }
});

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
