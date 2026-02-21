import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import db from './db';

import authRoutes from './modules/auth/auth.routes';
import studentRoutes from './modules/student/student.routes';
import teacherRoutes from './modules/teacher/teacher.routes';
import classRoutes from './modules/class/class.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import examRoutes from './modules/exam/exam.routes';
import noticeRoutes from './modules/notice/notice.routes';
import grievanceRoutes from './modules/grievance/grievance.routes';
import resourceRoutes from './modules/resource/resource.routes';
import feedbackRoutes from './modules/feedback/feedback.routes';
import adminRoutes from './modules/admin/admin.routes';
import scoutRoutes from './modules/scout/scout.routes';
import libraryRoutes from './modules/library/library.routes';
import assignmentRoutes from './modules/assignment/assignment.routes';
import submissionRoutes from './modules/submission/submission.routes';
import moduleRouter from './modules'; // Using index.ts
import { globalErrorHandler } from './middleware/error.middleware';

const app = express();

// Security Middleware
app.use(helmet());
app.use(hpp());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api', moduleRouter);

// Basic// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use(globalErrorHandler);

export { app, db };
