import express from 'express';
import * as studyTaskController from '../controllers/studyTaskController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', studyTaskController.getTasks);
router.post('/', studyTaskController.createTask);
router.patch('/:taskId', studyTaskController.updateTask);
router.delete('/:taskId', studyTaskController.deleteTask);

export default router;
