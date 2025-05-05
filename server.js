import 'dotenv/config';
import express from 'express';
import NodeCache from 'node-cache';
import Joi from 'joi';
import crypto from 'crypto';
import cors from 'cors';
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;

// Swagger setup
const swaggerDocs = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10
    });
    console.log('MongoDB connected');

    const adminExists = await User.exists({ username: 'admin' });
    console.log('Seeding admin with password:', process.env.ADMIN_INITIAL_PASSWORD);

    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: process.env.ADMIN_INITIAL_PASSWORD,
        role: 'admin'
      });
      console.log('Default admin user created');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
connectDB();

// Cache setup
const moodleCache = new NodeCache({ stdTTL: 300 });

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select('-password');
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

// BBB Utilities
const generateChecksum = (apiCall, params) => {
  const queryString = new URLSearchParams(params).toString();
  return crypto.createHash('sha1')
    .update(`${apiCall}${queryString}${process.env.BBB_SECRET}`)
    .digest('hex');
};

// Validation Schemas
const studentSearchSchema = Joi.object({
  email: Joi.string().email().optional(),
  fullName: Joi.string().min(3).optional()
}).or('email', 'fullName');

const enrollmentSchema = Joi.object({
  userId: Joi.number().required(),
  courseId: Joi.number().required(),
  roleId: Joi.number().required()
});

// ====================== API Endpoints with Swagger Docs ====================== //

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 role:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
app.post('/api/auth/login', apiLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user info
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json(req.user);
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.get('/api/users', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a user (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
app.delete('/api/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**********************/
/* API routes for BBB */
/**********************/

/**
 * @swagger
 * /api/getRecordings:
 *   get:
 *     summary: Retrieve recordings from BigBlueButton (BBB)
 *     description: Fetches meeting recordings from the BigBlueButton server using the provided meetingID. If no meetingID is provided, it may fetch all recordings depending on server settings.
 *     parameters:
 *       - in: query
 *         name: meetingID
 *         schema:
 *           type: string
 *         required: false
 *         description: The ID of the meeting to retrieve recordings for
 *     responses:
 *       200:
 *         description: XML response with meeting recordings
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *       500:
 *         description: Internal server error while fetching recordings
 */

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


/**
 * @swagger
 * /api/getMeetings:
 *   get:
 *     summary: Retrieve all active BigBlueButton (BBB) meetings
 *     description: Calls the BBB API to get a list of all currently running meetings.
 *     responses:
 *       200:
 *         description: Successfully retrieved list of active meetings
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *               description: XML response from BBB with meeting details
 *       500:
 *         description: Internal server error while fetching meetings
 */

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


/**
 * @swagger
 * /api/joinMeeting:
 *   get:
 *     summary: Generate join URL for a BigBlueButton (BBB) meeting
 *     description: Returns a join URL for a BBB meeting for a user based on their full name, meeting ID, and role.
 *     parameters:
 *       - in: query
 *         name: fullName
 *         schema:
 *           type: string
 *         required: true
 *         description: Full name of the user joining the meeting
 *       - in: query
 *         name: meetingID
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the meeting to join
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         required: true
 *         description: The role of the user (e.g., moderator, viewer)
 *     responses:
 *       200:
 *         description: Successfully generated BBB join URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: The generated join URL
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Internal server error while generating join URL
 */

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


/**
 * @swagger
 * /api/deleteRecordings:
 *   get:
 *     summary: Delete one or more BigBlueButton (BBB) recordings
 *     description: Sends a request to the BBB API to delete recordings using a given recordID.
 *     parameters:
 *       - in: query
 *         name: recordID
 *         required: true
 *         description: Comma-separated list of recording IDs to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recordings deleted successfully
 *       400:
 *         description: Missing recordID parameter
 *       500:
 *         description: Error deleting recordings from BBB API
 */

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



/************************************/
/* API Routes for Student functions */
/************************************/

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


// Search courses by course name
app.get('/api/searchCourses', async (req, res) => {
  const { courseName } = req.query;

  if (!courseName) {
    return res.status(400).json({ error: 'Course name is required' });
  }

  try {
    // Construct the URL for the Moodle API request
    const url = `https://cybertech242-online.com/webservice/rest/server.php?wstoken=11d9797670d74f22f8e4aa8483fab962&wsfunction=core_course_get_courses&moodlewsrestformat=json`;

    // Debug log: Show the generated URL in the server logs
    console.log('Generated Moodle API URL:', url);

    // Fetch all courses from Moodle
    const response = await fetch(url);
    const data = await response.json();

    // Debug log: Show the fetched data or error in the logs
    console.log('Response from Moodle API:', data);

    if (!Array.isArray(data)) {
      console.error('Unexpected API response:', data);
      return res.status(500).json({ error: 'Invalid response from Moodle' });
    }

    // Filter courses based on the search query
    const filteredCourses = data.filter((course) =>
      course.fullname.toLowerCase().includes(courseName.toLowerCase())
    );

    // Debug log: Show the filtered courses
    console.log('Filtered Courses:', filteredCourses);

    // Send back the filtered courses
    res.json(filteredCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to retrieve courses' });
  }
});


// API route to enroll students in courses
app.post('/api/enrollStudent', async (req, res) => {
  const { userId, courseId, roleId } = req.body;
  const token = '4e212f3770c28ce6a34a057d6f684ca1'; // Replace with your token

  try {
    // Construct the URL
    const url = `https://cybertech242-online.com/webservice/rest/server.php?wstoken=${token}&wsfunction=enrol_manual_enrol_users&moodlewsrestformat=json`;

    // Construct the body of the POST request
    const body = new URLSearchParams({
      'enrolments[0][roleid]': roleId,
      'enrolments[0][userid]': userId,
      'enrolments[0][courseid]': courseId
    }).toString();

    // Log the URL and body for debugging purposes
    console.log('Moodle Enrollment URL:', url);
    console.log('Request Body:', body);

    // Make the request to Moodle
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    const data = await response.json();

    if (response.ok) {
      res.json({ success: true, message: 'Enrollment successful', data });
    } else {
      res.status(400).json({ success: false, message: data.message });
    }
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// API route to unenroll a student from a course
app.post('/api/unenrollStudent', async (req, res) => {
  const { userId, courseId } = req.body;

  const url = `https://cybertech242-online.com/webservice/rest/server.php?wstoken=4e212f3770c28ce6a34a057d6f684ca1&wsfunction=enrol_manual_unenrol_users&moodlewsrestformat=json`;

  try {
      const response = await fetch(url, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
              'enrolments[0][userid]': userId,
              'enrolments[0][courseid]': courseId,
          }),
      });

      const data = await response.json();
      if (!response.ok) {
          throw new Error(data.message || 'Failed to unenroll');
      }
      res.status(200).json(data);
  } catch (error) {
      console.error('Error unenrolling student:', error);
      res.status(500).json({ error: 'Failed to unenroll student' });
  }
});






/**
 * @swagger
 * /api/enrollStudent:
 *   post:
 *     tags: [Moodle]
 *     summary: Enroll student in course
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               courseId:
 *                 type: integer
 *               roleId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Enrollment successful
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
app.post('/api/enrollStudent', apiLimiter, async (req, res, next) => {
  try {
    const { error } = enrollmentSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const url = new URL(`${process.env.MOODLE_URL}/webservice/rest/server.php`);
    url.searchParams.append('wstoken', process.env.MOODLE_TOKEN);
    url.searchParams.append('wsfunction', 'enrol_manual_enrol_users');
    url.searchParams.append('moodlewsrestformat', 'json');

    const body = new URLSearchParams({
      'enrolments[0][roleid]': req.body.roleId,
      'enrolments[0][userid]': req.body.userId,
      'enrolments[0][courseid]': req.body.courseId
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Enrollment failed');
    }

    res.json({ success: true, message: 'Enrollment successful' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [System]
 *     summary: System health check
 *     responses:
 *       200:
 *         description: Health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 nodeVersion:
 *                   type: string
 *                 dbStatus:
 *                   type: string
 *                 uptime:
 *                   type: number
 *                 memoryUsage:
 *                   type: object
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

// Static files and error handling
app.use(express.static(path.join(__dirname, 'client/build'), {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
}).on('error', error => {
  console.error('Server startup failed:', error);
  process.exit(1);
});