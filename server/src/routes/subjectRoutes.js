import express from 'express';
import * as subjectController from '../controllers/subjectController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public / Authenticated read routes
router.get('/', subjectController.getSubjects);
router.get('/:subjectId/chapters', subjectController.getChaptersBySubject);

export default router;
