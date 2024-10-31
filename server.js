import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import fetch from 'node-fetch';
import mongoose from 'mongoose'; // Import Mongoose
import path from 'path'; // Added to serve static files
import { fileURLToPath } from 'url'; // For ES modules compatibility with __dirname
import Course from './models/Course.js'; // Import Course model


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
const MOODLE_TOKEN = process.env.MOODLE_TOKEN || '11d9797670d74f22f8e4aa8483fab962';
const MOODLE_URL = process.env.MOODLE_URL || 'https://www.cybertech242-online.com';

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

//The code below refer to Moodle features

// API route to search students
app.get('/api/searchStudents', async (req, res) => {
  const { email, fullName } = req.query;

  if (!email && !fullName) {
    return res.status(400).json({ error: 'At least one search parameter is required' });
  }

  const token = '11d9797670d74f22f8e4aa8483fab962'; // Replace with your actual token

  let url = `https://cybertech242-online.com/webservice/rest/server.php?wstoken=${token}&wsfunction=core_user_get_users&moodlewsrestformat=json`;
  
  if (email) {
    url += `&criteria[0][key]=email&criteria[0][value]=${encodeURIComponent(email)}`;
  } else if (fullName) {
    url += `&criteria[0][key]=fullname&criteria[0][value]=${encodeURIComponent(fullName)}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.users && data.users.length > 0) {
      res.status(200).json(data.users);
    } else {
      res.status(404).json({ message: 'No users found' });
    }
  } catch (error) {
    console.error('Error fetching student data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API route to enroll a student in a course
app.post('/api/enrollStudent', async (req, res) => {
  const { userId, courseId } = req.body;

  if (!userId || !courseId) {
    return res.status(400).json({ error: 'userId and courseId are required' });
  }

  const token = '11d9797670d74f22f8e4aa8483fab962'; // Replace with your actual token
  const url = `https://cybertech242-online.com/webservice/rest/server.php?wstoken=${token}&wsfunction=core_enrol_manual_enrol_users&moodlewsrestformat=json`;

  const enrollments = [
    {
      roleid: 5, // 5 is typically the role ID for "student"
      userid: userId,
      courseid: courseId,
    },
  ];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        enrolments: JSON.stringify(enrollments),
      }),
    });

    const data = await response.json();

    if (data && !data.exception) {
      res.status(200).json({ message: 'Student successfully enrolled!' });
    } else {
      res.status(500).json({ error: data.message || 'Error enrolling student' });
    }
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Route to get courses for a specific student by user ID
app.get('/api/getStudentCourses', async (req, res) => {
  const { userId } = req.query; // Get the userId from the query parameters

  // If userId is not provided, return an error
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }

  try {
    // Construct the Moodle API URL
    const moodleUrl = `https://cybertech242-online.com/webservice/rest/server.php?wstoken=11d9797670d74f22f8e4aa8483fab962&wsfunction=core_enrol_get_users_courses&moodlewsrestformat=json&userid=${userId}`;

    // Fetch the data from Moodle
    const response = await fetch(moodleUrl);
    const courses = await response.json();

    // Check if the response is valid JSON or if it contains an error
    if (response.ok) {
      // Return the courses to the frontend
      res.json(courses);
    } else {
      throw new Error('Failed to fetch courses from Moodle');
    }
  } catch (error) {
    console.error('Error fetching student courses:', error);
    res.status(500).json({ error: 'An error occurred while fetching student courses' });
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
