import express from 'express';
import * as adminController from '../controllers/adminController.js';
import * as subjectController from '../controllers/subjectController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, requireRole('admin'));

router.get('/dashboard', adminController.getAdminDashboard);
router.get('/users', adminController.getStudents);
router.patch('/users/:userId', adminController.updateStudent);
router.patch('/settings', adminController.updateSettings);

// Subject & Chapter Admin routes
router.post('/subjects', subjectController.createSubject);
router.patch('/subjects/:subjectId', subjectController.updateSubject);
router.post('/chapters', subjectController.createChapter);
router.patch('/chapters/:chapterId', subjectController.updateChapter);

export default router;
