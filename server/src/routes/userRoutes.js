import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/authValidators.js';

const router = express.Router();

router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateProfileSchema), userController.updateMe);
router.get('/me/preferences', userController.getPreferences);
router.patch('/me/preferences', userController.updatePreferences);
router.post('/me/export', userController.exportUserData);
router.delete('/me', userController.deleteAccount);

export default router;
