import express from 'express';
import * as testController from '../controllers/testController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTestSchema, updateTestSchema } from '../validators/testValidators.js';

const router = express.Router();

router.use(authenticate);

router.get('/template', testController.getCsvTemplate);
router.post('/import', testController.importCsvTests);

router.post('/', validate(createTestSchema), testController.createTest);
router.get('/', testController.getTests);
router.get('/:testId', testController.getTestById);
router.patch('/:testId', validate(updateTestSchema), testController.updateTest);
router.delete('/:testId', testController.deleteTest);

export default router;
