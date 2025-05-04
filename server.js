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
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: await bcrypt.hash(
          process.env.ADMIN_INITIAL_PASSWORD, 
          10
        ),
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

/**
 * @swagger
 * /api/getRecordings:
 *   get:
 *     tags: [BBB]
 *     summary: Get BBB recordings
 *     parameters:
 *       - in: query
 *         name: meetingID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recordings data
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *       500:
 *         description: BBB API error
 */
app.get('/api/getRecordings', apiLimiter, async (req, res, next) => {
  try {
    const { meetingID } = req.query;
    const params = meetingID ? { meetingID } : {};
    const checksum = generateChecksum('getRecordings', params);
    
    const bbbUrl = new URL(`${process.env.BBB_URL}/getRecordings`);
    Object.entries(params).forEach(([key, val]) => bbbUrl.searchParams.set(key, val));
    bbbUrl.searchParams.set('checksum', checksum);

    const response = await fetch(bbbUrl);
    if (!response.ok) throw new Error(`BBB API Error: ${response.statusText}`);
    
    res.set('Content-Type', 'application/xml').send(await response.text());
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/searchStudents:
 *   get:
 *     tags: [Moodle]
 *     summary: Search Moodle students
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *       - in: query
 *         name: fullName
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   fullname:
 *                     type: string
 *                   email:
 *                     type: string
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
app.get('/api/searchStudents', apiLimiter, async (req, res, next) => {
  try {
    const { error } = studentSearchSchema.validate(req.query);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const cacheKey = `students:${JSON.stringify(req.query)}`;
    const cached = moodleCache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = new URL(`${process.env.MOODLE_URL}/webservice/rest/server.php`);
    url.searchParams.append('wstoken', process.env.MOODLE_TOKEN);
    url.searchParams.append('wsfunction', 'core_user_get_users');
    url.searchParams.append('moodlewsrestformat', 'json');

    if (req.query.email) {
      url.searchParams.append('criteria[0][key]', 'email');
      url.searchParams.append('criteria[0][value]', req.query.email);
    } else {
      url.searchParams.append('criteria[0][key]', 'fullname');
      url.searchParams.append('criteria[0][value]', req.query.fullName);
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Moodle API Error: ${response.statusText}`);
    
    const data = await response.json();
    moodleCache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    next(error);
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