const express = require('express');
const fetch = require('node-fetch'); // For making HTTP requests
const crypto = require('crypto');    // For generating the SHA-1 checksum
const cors = require('cors');        // To handle CORS with the frontend

const app = express();
const PORT = 5000;

app.use(cors()); // Enable CORS for all routes

// BBB API configuration
const BBB_URL = 'https://bbb.cybertech242-online.com/bigbluebutton/api/';
const BBB_SECRET = '6e5qNuCuwbboDlxnEqHNn74XdCil07gDuAqDNLp9y4';

// Function to generate SHA-1 checksum
const generateChecksum = (apiCall) => {
  return crypto.createHash('sha1').update(apiCall + BBB_SECRET).digest('hex');
};

// Route to proxy the `getMeetings` API call using `bbb-context-id`
app.get('/api/getMeetings', async (req, res) => {
    const apiCall = 'getMeetings';

    // Generate checksum
    const checksum = generateChecksum(apiCall);

    // Construct BBB API URL with checksum
    const bbbApiUrl = `${BBB_URL}${apiCall}?checksum=${checksum}`;

    try {
        const response = await fetch(bbbApiUrl);
        const data = await response.text();
        res.send(data);  // Send BBB response back to frontend
    } catch (error) {
        res.status(500).send('Error fetching meetings from BBB API');
    }
});

// Route to proxy the `joinMeeting` API call using `bbb-context-id`
app.get('/api/joinMeeting', async (req, res) => {
    const { bbbContextId, fullName, password } = req.query;

    const apiCall = `join?fullName=${fullName}&bbb-context-id=${bbbContextId}&password=${password}`;
    const checksum = generateChecksum(apiCall);

    const bbbApiUrl = `${BBB_URL}${apiCall}&checksum=${checksum}`;

    try {
        const response = await fetch(bbbApiUrl);
        res.redirect(response.url);  // Redirect to the BBB meeting
    } catch (error) {
        res.status(500).send('Error joining meeting');
    }
});

// Route to proxy the `endMeeting` API call using `bbb-context-id`
app.get('/api/endMeeting', async (req, res) => {
    const { bbbContextId, password } = req.query;

    const apiCall = `end?bbb-context-id=${bbbContextId}&password=${password}`;
    const checksum = generateChecksum(apiCall);

    const bbbApiUrl = `${BBB_URL}${apiCall}&checksum=${checksum}`;

    try {
        const response = await fetch(bbbApiUrl);
        const data = await response.text();
        res.send(data);  // Send the result back to the frontend
    } catch (error) {
        res.status(500).send('Error ending meeting');
    }
});

// Route to proxy the `getRecordings` API call using `bbb-context-id`
app.get('/api/getRecordings', async (req, res) => {
    const { bbbContextId } = req.query;

    const apiCall = `getRecordings?bbb-context-id=${bbbContextId}`;
    const checksum = generateChecksum(apiCall);

    const bbbApiUrl = `${BBB_URL}${apiCall}&checksum=${checksum}`;

    try {
        const response = await fetch(bbbApiUrl);
        const data = await response.text();
        res.send(data);  // Send the recordings data back to the frontend
    } catch (error) {
        res.status(500).send('Error fetching recordings');
    }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
