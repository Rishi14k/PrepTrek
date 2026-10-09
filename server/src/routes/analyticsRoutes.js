import express from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/overview', analyticsController.getOverview);
router.get('/trends', analyticsController.getTrends);
router.get('/subjects', analyticsController.getSubjectAnalytics);
router.get('/chapters', analyticsController.getChapterAnalytics);
router.get('/chapters/:chapterId', analyticsController.getChapterDetail);
router.get('/insights', analyticsController.getInsights);

export default router;
