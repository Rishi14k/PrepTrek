import express from 'express';
import * as leaderboardController from '../controllers/leaderboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', leaderboardController.getLeaderboard);
router.patch('/preferences', leaderboardController.updateLeaderboardPreferences);

export default router;
