import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import fetch from 'node-fetch'; // Using dynamic import method if necessary

const app = express();
const PORT = 5000;

app.use(cors()); // Enable CORS for all routes

// BBB API configuration
const BBB_URL = 'https://bbb.cybertech242-online.com/bigbluebutton/api'; // Base URL without trailing slash
const BBB_SECRET = '6e5qNuCuwbboDlxnEqHNn74XdCil07gDuAqDNLp9y4';

// Function to generate SHA-1 checksum
const generateChecksum = (apiCall, params) => {
  const queryString = new URLSearchParams(params).toString();
  const stringToHash = `${apiCall}${queryString}${BBB_SECRET}`;
  return crypto.createHash('sha1').update(stringToHash).digest('hex');
};

// Route to proxy the `getRecordings` API call, with or without `meetingID`
app.get('/api/getRecordings', async (req, res) => {
  const { meetingID } = req.query;

  const apiCall = 'getRecordings';
  const params = {};

  // Add `meetingID` to params only if it exists
  if (meetingID) {
    params['meetingID'] = meetingID;
  }

  // Generate the checksum based on the params
  const checksum = generateChecksum(apiCall, params);
  const queryString = new URLSearchParams(params).toString();
  const bbbApiUrl = `${BBB_URL}/${apiCall}?${queryString}&checksum=${checksum}`;

  // Log the constructed BBB API URL
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

// Route to proxy the `getMeetings` API call
app.get('/api/getMeetings', async (req, res) => {
  const apiCall = 'getMeetings';
  const params = {}; // No parameters needed for getMeetings API call
  const checksum = generateChecksum(apiCall, params);

  const bbbApiUrl = `${BBB_URL}/${apiCall}?checksum=${checksum}`;
  console.log('Constructed BBB API URL for getMeetings:', bbbApiUrl); // For debugging

  try {
    const response = await fetch(bbbApiUrl);
    const data = await response.text();
    res.send(data); // Send the XML response back to the frontend
  } catch (error) {
    console.error('Error fetching meetings from BBB API:', error);
    res.status(500).send('Error fetching meetings from BBB API');
  }
});

// Route to proxy the `join` API call
app.get('/api/joinMeeting', async (req, res) => {
  const { fullName, meetingID, role } = req.query;

  // Ensure required parameters are provided
  if (!fullName || !meetingID || !role) {
    return res.status(400).send('Missing required parameters: fullName, meetingID, or role');
  }

  const apiCall = 'join';
  const params = {
    fullName,
    meetingID,
    role,
    excludeFromDashboard: 'true', // Always exclude from the dashboard
    redirect: 'true' // Ensures the user is redirected to the BBB client
  };

  // Generate the checksum based on the params
  const checksum = generateChecksum(apiCall, params);
  const queryString = new URLSearchParams(params).toString();
  const bbbApiUrl = `${BBB_URL}/${apiCall}?${queryString}&checksum=${checksum}`;

  // Log the constructed BBB API URL
  console.log('Constructed BBB Join API URL:', bbbApiUrl);

  try {
    res.send({ url: bbbApiUrl }); // Send the join URL back to the frontend
  } catch (error) {
    console.error('Error generating join URL for BBB:', error);
    res.status(500).send('Error generating join URL');
  }
});



// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
