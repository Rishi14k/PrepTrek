import express from 'express';
import * as studySessionController from '../controllers/studySessionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/active', studySessionController.getActiveSession);
router.post('/start', studySessionController.startSession);
router.post('/:sessionId/pause', studySessionController.pauseSession);
router.post('/:sessionId/resume', studySessionController.resumeSession);
router.post('/:sessionId/stop', studySessionController.stopSession);
router.post('/:sessionId/discard', studySessionController.discardSession);
router.get('/', studySessionController.getSessions);
router.patch('/:sessionId', studySessionController.updateSession);
router.delete('/:sessionId', studySessionController.deleteSession);

export default router;
