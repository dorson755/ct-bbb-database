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
import YAML from 'yamljs'; // Required for Swagger YAML loading

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
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// MongoDB connection
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  minPoolSize: 2,
  ssl: true,
  authSource: 'admin'
};

// Updated MongoDB connection (remove deprecated options)
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000, // 5 second timeout
})
.then(() => console.log('MongoDB connected'))
.catch(error => console.error('MongoDB connection error:', error));

// Cache setup
const moodleCache = new NodeCache({ stdTTL: 300 });

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

// Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// API Endpoints
/**
 * @swagger
 * /api/getRecordings:
 *   get:
 *     tags: [BBB API]
 *     summary: Get BBB recordings
 *     parameters:
 *       - in: query
 *         name: meetingID
 *         schema:
 *           type: string
 *         description: BBB meeting ID
 *     responses:
 *       200:
 *         description: Recordings data
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
    
    res.set('Content-Type', 'application/xml');
    res.send(await response.text());
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/searchStudents:
 *   get:
 *     tags: [Moodle Integration]
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
 *         description: List of matching students
 *         content:
 *           application/json:
 *             example:
 *               - id: 123
 *                 fullname: "John Doe"
 *                 email: "john@example.com"
 *       400:
 *         description: Invalid parameters
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
 *     tags: [Moodle Integration]
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
 * tags:
 *   - name: System
 *     description: Server monitoring endpoints
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [System]
 *     summary: Server health status
 *     description: Returns current server status and database connectivity
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: UP
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 nodeVersion:
 *                   type: string
 *                   example: v18.12.1
 *                 dbStatus:
 *                   type: string
 *                   example: connected
 *                 uptime:
 *                   type: number
 *                   format: float
 *                   example: 123.45
 *                 memoryUsage:
 *                   type: object
 *                   properties:
 *                     rss:
 *                       type: integer
 *                     heapTotal:
 *                       type: integer
 *                     heapUsed:
 *                       type: integer
 *                     external:
 *                       type: integer
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
  immutable: true
}));

app.use(errorHandler);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Server startup
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
}).on('error', error => {
  console.error('Server startup failed:', error);
  process.exit(1);
});