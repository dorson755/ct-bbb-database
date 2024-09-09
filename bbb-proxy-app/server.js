import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import fetch from 'node-fetch'; // Using dynamic import method if necessary

const app = express();
const PORT = 5000;

app.use(cors());

// BBB API configuration
const BBB_URL = 'https://bbb.cybertech242-online.com/bigbluebutton/api'; // Remove trailing slash
const BBB_SECRET = '6e5qNuCuwbboDlxnEqHNn74XdCil07gDuAqDNLp9y4';

// Function to generate SHA-1 checksum
const generateChecksum = (apiCall, params) => {
  // Concatenate parameters and secret
  const data = `${apiCall}${params}${BBB_SECRET}`;
  return crypto.createHash('sha1').update(data).digest('hex');
};

// Route to proxy the `getRecordings` API call using `meetingID`
app.get('/api/getRecordings', async (req, res) => {
  const { meetingID } = req.query;

  if (!meetingID) {
    return res.status(400).send('Missing meetingID parameter');
  }

  // Prepare the API call parameters and checksum
  const params = `meetingID=${meetingID}`;
  const apiCall = 'getRecordings';
  const checksum = generateChecksum(apiCall, params);

  // Construct the BBB API URL
  const bbbApiUrl = `${BBB_URL}/${apiCall}?${params}&checksum=${checksum}`;

  try {
    const response = await fetch(bbbApiUrl);
    const data = await response.text();
    res.send(data);
    console.log(`Checksum: ${checksum}`);
    console.log('Constructed BBB API URL:', bbbApiUrl);
  } catch (error) {
    console.error('Error fetching recordings from BBB API:', error);
    res.status(500).send('Error fetching recordings from BBB API');
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
