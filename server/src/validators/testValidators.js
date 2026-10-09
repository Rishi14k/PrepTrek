import { z } from 'zod';

export const testBreakdownItemBaseSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  chapterId: z.string().optional().nullable(),
  totalQuestions: z.number().int().min(1, 'Total questions must be at least 1'),
  attemptedQuestions: z.number().int().min(0, 'Attempted questions cannot be negative'),
  correctAnswers: z.number().int().min(0, 'Correct answers cannot be negative'),
  incorrectAnswers: z.number().int().min(0, 'Incorrect answers cannot be negative'),
  unattemptedQuestions: z.number().int().min(0, 'Unattempted questions cannot be negative'),
  marksObtained: z.number(),
  maxMarks: z.number().min(1, 'Max marks must be greater than 0'),
  durationSeconds: z.number().min(0).default(0),
});

export const testBreakdownItemSchema = testBreakdownItemBaseSchema
  .refine((data) => data.attemptedQuestions === data.correctAnswers + data.incorrectAnswers, {
    message: 'Attempted questions must equal correct answers + incorrect answers',
    path: ['attemptedQuestions'],
  })
  .refine((data) => data.totalQuestions === data.attemptedQuestions + data.unattemptedQuestions, {
    message: 'Total questions must equal attempted questions + unattempted questions',
    path: ['totalQuestions'],
  })
  .refine((data) => data.correctAnswers <= data.attemptedQuestions, {
    message: 'Correct answers cannot exceed attempted questions',
    path: ['correctAnswers'],
  })
  .refine((data) => data.marksObtained <= data.maxMarks, {
    message: 'Marks obtained cannot exceed maximum marks',
    path: ['marksObtained'],
  });

export const createTestBaseSchema = z.object({
  testName: z.string().min(2, 'Test name must be at least 2 characters').max(120),
  testDate: z.string().or(z.date()).optional(),
  testType: z.enum(['chapter', 'sectional', 'full_mock', 'previous_year']).default('chapter'),
  subjectId: z.string().optional().nullable(),
  chapterId: z.string().optional().nullable(),
  totalQuestions: z.number().int().min(1, 'Total questions must be at least 1'),
  attemptedQuestions: z.number().int().min(0, 'Attempted questions cannot be negative'),
  correctAnswers: z.number().int().min(0, 'Correct answers cannot be negative'),
  incorrectAnswers: z.number().int().min(0, 'Incorrect answers cannot be negative'),
  unattemptedQuestions: z.number().int().min(0, 'Unattempted questions cannot be negative'),
  marksObtained: z.number(),
  maxMarks: z.number().min(1, 'Maximum marks must be greater than 0'),
  durationSeconds: z.number().min(0).default(0),
  notes: z.string().max(1000).optional().default(''),
  breakdowns: z.array(testBreakdownItemSchema).optional().default([]),
});

export const createTestSchema = createTestBaseSchema
  .refine((data) => data.attemptedQuestions === data.correctAnswers + data.incorrectAnswers, {
    message: 'Attempted questions must equal correct answers + incorrect answers',
    path: ['attemptedQuestions'],
  })
  .refine((data) => data.totalQuestions === data.attemptedQuestions + data.unattemptedQuestions, {
    message: 'Total questions must equal attempted questions + unattempted questions',
    path: ['totalQuestions'],
  })
  .refine((data) => data.correctAnswers <= data.attemptedQuestions, {
    message: 'Correct answers cannot exceed attempted questions',
    path: ['correctAnswers'],
  })
  .refine((data) => data.marksObtained <= data.maxMarks, {
    message: 'Marks obtained cannot exceed maximum possible marks',
    path: ['marksObtained'],
  });

export const updateTestSchema = createTestBaseSchema.partial();
