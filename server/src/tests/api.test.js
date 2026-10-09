import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Chapter from '../models/Chapter.js';
import Test from '../models/Test.js';
import StudySession from '../models/StudySession.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  // Seed sample subject
  const sub = await Subject.create({
    name: 'Quantitative Aptitude',
    slug: 'quantitative-aptitude',
    isActive: true,
  });
  await Chapter.create({
    subjectId: sub._id,
    name: 'Percentage',
    slug: 'percentage',
    isActive: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});

describe('PrepTrack API & Integration Tests', () => {
  let studentCookie;
  let studentId;
  let adminCookie;
  let sampleSubject;
  let sampleChapter;

  test('POST /api/auth/register creates initial admin and logs in', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin Test',
        email: 'admin.test@preptrack.local',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('admin');
    adminCookie = res.headers['set-cookie'];
  });

  test('POST /api/auth/register creates student account', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student One',
        email: 'student.one@preptrack.local',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('student');
    studentId = res.body.user._id;
    studentCookie = res.headers['set-cookie'];
  });

  test('GET /api/tests returns 401 if unauthenticated', async () => {
    const res = await request(app).get('/api/tests');
    expect(res.status).toBe(401);
  });

  test('POST /api/tests rejects invalid math invariants', async () => {
    // Attempted questions (10) != correct (8) + incorrect (1) = 9
    const res = await request(app)
      .post('/api/tests')
      .set('Cookie', studentCookie)
      .send({
        testName: 'Faulty Invariant Test',
        totalQuestions: 20,
        attemptedQuestions: 10,
        correctAnswers: 8,
        incorrectAnswers: 1, // sums to 9, not 10!
        unattemptedQuestions: 10,
        marksObtained: 20,
        maxMarks: 40,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/tests saves valid test and recalculates score %', async () => {
    sampleSubject = await Subject.findOne({ slug: 'quantitative-aptitude' });
    sampleChapter = await Chapter.findOne({ slug: 'percentage' });

    const res = await request(app)
      .post('/api/tests')
      .set('Cookie', studentCookie)
      .send({
        testName: 'Valid Percentage Test',
        subjectId: sampleSubject._id.toString(),
        chapterId: sampleChapter._id.toString(),
        testType: 'chapter',
        totalQuestions: 25,
        attemptedQuestions: 20,
        correctAnswers: 18,
        incorrectAnswers: 2,
        unattemptedQuestions: 5,
        marksObtained: 34,
        maxMarks: 50,
        durationSeconds: 1200,
        notes: 'Good pacing',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.test.testName).toBe('Valid Percentage Test');
  });

  test('Study Timer: starts session and prevents concurrent sessions', async () => {
    const startRes = await request(app)
      .post('/api/study-sessions/start')
      .set('Cookie', studentCookie)
      .send({
        subjectId: sampleSubject._id.toString(),
        chapterId: sampleChapter._id.toString(),
        sessionType: 'standard',
      });

    expect(startRes.status).toBe(201);
    const sessionId = startRes.body.session._id;

    // Trying to start a second session while one is active should fail with 400
    const duplicateRes = await request(app)
      .post('/api/study-sessions/start')
      .set('Cookie', studentCookie)
      .send({ sessionType: 'pomodoro' });

    expect(duplicateRes.status).toBe(400);
    expect(duplicateRes.body.success).toBe(false);

    // Pause session
    const pauseRes = await request(app)
      .post(`/api/study-sessions/${sessionId}/pause`)
      .set('Cookie', studentCookie);
    expect(pauseRes.status).toBe(200);

    // Resume session
    const resumeRes = await request(app)
      .post(`/api/study-sessions/${sessionId}/resume`)
      .set('Cookie', studentCookie);
    expect(resumeRes.status).toBe(200);

    // Stop session
    const stopRes = await request(app)
      .post(`/api/study-sessions/${sessionId}/stop`)
      .set('Cookie', studentCookie)
      .send({ notes: 'Completed revision session' });

    expect(stopRes.status).toBe(200);
    expect(stopRes.body.session.status).toBe('completed');
  });

  test('Admin routes require admin role and deny students', async () => {
    const deniedRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Cookie', studentCookie);
    expect(deniedRes.status).toBe(403);

    const allowedRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Cookie', adminCookie);
    expect(allowedRes.status).toBe(200);
    expect(allowedRes.body.stats).toBeDefined();
  });
});
