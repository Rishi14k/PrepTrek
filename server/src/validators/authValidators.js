import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    username: z.string().optional(),
    targetExam: z.string().optional(),
    targetExamDate: z.string().optional().nullable(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  username: z.string().optional(),
  displayName: z.string().max(50).optional(),
  targetExam: z.string().optional(),
  targetExamDate: z.string().optional().nullable(),
  dailyStudyGoalSeconds: z.number().min(0).optional(),
  timezone: z.string().optional(),
  themePreference: z.enum(['light', 'dark', 'system']).optional(),
  leaderboardOptIn: z.boolean().optional(),
});
