import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Subject from '../src/models/Subject.js';
import Chapter from '../src/models/Chapter.js';
import Test from '../src/models/Test.js';
import StudySession from '../src/models/StudySession.js';
import StudyTask from '../src/models/StudyTask.js';
import { connectDB, closeDB } from '../src/config/db.js';
import { seedSubjectsAndChapters } from './seedSubjects.js';

dotenv.config();

export const seedDemoData = async () => {
  await seedSubjectsAndChapters();

  const demoEmail = 'student.demo@preptrack.local';
  const demoPassword = 'DemoStudent2026!';

  // Clean prior demo records if any
  const priorDemoUser = await User.findOne({ email: demoEmail });
  if (priorDemoUser) {
    await Promise.all([
      Test.deleteMany({ userId: priorDemoUser._id }),
      StudySession.deleteMany({ userId: priorDemoUser._id }),
      StudyTask.deleteMany({ userId: priorDemoUser._id }),
      User.findByIdAndDelete(priorDemoUser._id),
    ]);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(demoPassword, salt);

  const demoUser = await User.create({
    name: 'Aarav Sharma (Demo Student)',
    email: demoEmail,
    passwordHash,
    role: 'student',
    username: 'aarav_demo',
    displayName: 'AaravS',
    targetExam: 'CAT / MBA Entrance',
    targetExamDate: new Date('2026-11-28'),
    dailyStudyGoalSeconds: 7200, // 2 hours
    leaderboardOptIn: true,
    isActive: true,
  });

  console.log(`Demo Student account created:`);
  console.log(`Email: ${demoEmail}`);
  console.log(`Password: ${demoPassword}`);

  // Fetch subjects and chapters
  const quant = await Subject.findOne({ slug: 'quantitative-aptitude' });
  const logical = await Subject.findOne({ slug: 'logical-reasonering' });
  const english = await Subject.findOne({ slug: 'english-language' });
  const cs = await Subject.findOne({ slug: 'computer-science' });

  const quantChapters = await Chapter.find({ subjectId: quant._id });
  const logicalChapters = await Chapter.find({ subjectId: logical._id });
  const englishChapters = await Chapter.find({ subjectId: english._id });

  const now = new Date();
  const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Insert realistic test records
  const sampleTests = [
    // Strong chapter: Percentage
    {
      userId: demoUser._id,
      testName: 'Percentage Diagnostic 1',
      testDate: daysAgo(20),
      testType: 'chapter',
      subjectId: quant._id,
      chapterId: quantChapters.find((c) => c.name === 'Percentage')?._id,
      totalQuestions: 25,
      attemptedQuestions: 22,
      correctAnswers: 20,
      incorrectAnswers: 2,
      unattemptedQuestions: 3,
      marksObtained: 38,
      maxMarks: 50,
      durationSeconds: 1500,
      notes: 'Strong calculation speed on fraction-to-percentage conversions.',
    },
    {
      userId: demoUser._id,
      testName: 'Percentage Advanced Test',
      testDate: daysAgo(5),
      testType: 'chapter',
      subjectId: quant._id,
      chapterId: quantChapters.find((c) => c.name === 'Percentage')?._id,
      totalQuestions: 25,
      attemptedQuestions: 24,
      correctAnswers: 22,
      incorrectAnswers: 2,
      unattemptedQuestions: 1,
      marksObtained: 42,
      maxMarks: 50,
      durationSeconds: 1600,
      notes: 'Maintained accuracy on successive percentage change problems.',
    },

    // Weak chapter: Mixture and Alligation
    {
      userId: demoUser._id,
      testName: 'Mixture & Alligation Practice',
      testDate: daysAgo(16),
      testType: 'chapter',
      subjectId: quant._id,
      chapterId: quantChapters.find((c) => c.name === 'Mixture and Alligation')?._id,
      totalQuestions: 20,
      attemptedQuestions: 18,
      correctAnswers: 8,
      incorrectAnswers: 10,
      unattemptedQuestions: 2,
      marksObtained: 14,
      maxMarks: 40,
      durationSeconds: 1400,
      notes: 'Struggled with replacement ratio formula.',
    },
    {
      userId: demoUser._id,
      testName: 'Mixture & Alligation Review Set',
      testDate: daysAgo(3),
      testType: 'chapter',
      subjectId: quant._id,
      chapterId: quantChapters.find((c) => c.name === 'Mixture and Alligation')?._id,
      totalQuestions: 20,
      attemptedQuestions: 16,
      correctAnswers: 7,
      incorrectAnswers: 9,
      unattemptedQuestions: 4,
      marksObtained: 12,
      maxMarks: 40,
      durationSeconds: 1350,
      notes: 'Negative marking severely affected the net score.',
    },

    // Declining chapter: Seating Arrangement
    {
      userId: demoUser._id,
      testName: 'Seating Arrangement Base Test',
      testDate: daysAgo(25),
      testType: 'chapter',
      subjectId: logical._id,
      chapterId: logicalChapters.find((c) => c.name === 'Seating Arrangement')?._id,
      totalQuestions: 20,
      attemptedQuestions: 20,
      correctAnswers: 18,
      incorrectAnswers: 2,
      unattemptedQuestions: 0,
      marksObtained: 34,
      maxMarks: 40,
      durationSeconds: 1800,
      notes: 'High accuracy on circular arrangements.',
    },
    {
      userId: demoUser._id,
      testName: 'Seating Arrangement Hard Puzzles',
      testDate: daysAgo(2),
      testType: 'chapter',
      subjectId: logical._id,
      chapterId: logicalChapters.find((c) => c.name === 'Seating Arrangement')?._id,
      totalQuestions: 20,
      attemptedQuestions: 16,
      correctAnswers: 10,
      incorrectAnswers: 6,
      unattemptedQuestions: 4,
      marksObtained: 20,
      maxMarks: 40,
      durationSeconds: 1900,
      notes: 'Got stuck on two-row facing inward/outward variations.',
    },

    // English: Reading Comprehension
    {
      userId: demoUser._id,
      testName: 'RC Sectional Practice 1',
      testDate: daysAgo(12),
      testType: 'chapter',
      subjectId: english._id,
      chapterId: englishChapters.find((c) => c.name === 'Reading Comprehension')?._id,
      totalQuestions: 20,
      attemptedQuestions: 17,
      correctAnswers: 14,
      incorrectAnswers: 3,
      unattemptedQuestions: 3,
      marksObtained: 25,
      maxMarks: 30,
      durationSeconds: 1600,
      notes: 'Philosophy passage was tricky, inferred questions well.',
    },

    // Full Mock Test
    {
      userId: demoUser._id,
      testName: 'National Open Mock Exam 01',
      testDate: daysAgo(7),
      testType: 'full_mock',
      totalQuestions: 66,
      attemptedQuestions: 54,
      correctAnswers: 44,
      incorrectAnswers: 10,
      unattemptedQuestions: 12,
      marksObtained: 122,
      maxMarks: 198,
      durationSeconds: 7200,
      notes: 'First complete 2-hour full mock. Time management needs improvement in Quants.',
    },
  ];

  await Test.insertMany(sampleTests);
  console.log(` Inserted ${sampleTests.length} realistic test records for demo student.`);

  // Insert study sessions across the past 7 days to give active streaks & charts
  const sampleSessions = [
    {
      userId: demoUser._id,
      subjectId: quant._id,
      startedAt: daysAgo(6),
      endedAt: new Date(daysAgo(6).getTime() + 4500 * 1000),
      durationSeconds: 4500, // 75 mins
      status: 'completed',
      sessionType: 'standard',
      notes: 'Quant arithmetic formulas practice',
    },
    {
      userId: demoUser._id,
      subjectId: logical._id,
      startedAt: daysAgo(5),
      endedAt: new Date(daysAgo(5).getTime() + 5400 * 1000),
      durationSeconds: 5400, // 90 mins
      status: 'completed',
      sessionType: 'pomodoro',
      notes: '3 Pomodoro rounds solving puzzle sets',
    },
    {
      userId: demoUser._id,
      subjectId: english._id,
      startedAt: daysAgo(4),
      endedAt: new Date(daysAgo(4).getTime() + 3600 * 1000),
      durationSeconds: 3600, // 60 mins
      status: 'completed',
      sessionType: 'standard',
      notes: 'Editorial vocabulary and RC practice',
    },
    {
      userId: demoUser._id,
      subjectId: quant._id,
      startedAt: daysAgo(3),
      endedAt: new Date(daysAgo(3).getTime() + 6000 * 1000),
      durationSeconds: 6000, // 100 mins
      status: 'completed',
      sessionType: 'standard',
      notes: 'Mixture and Alligation revision',
    },
    {
      userId: demoUser._id,
      subjectId: logical._id,
      startedAt: daysAgo(2),
      endedAt: new Date(daysAgo(2).getTime() + 4800 * 1000),
      durationSeconds: 4800, // 80 mins
      status: 'completed',
      sessionType: 'pomodoro',
      notes: 'Seating arrangements & syllogisms',
    },
    {
      userId: demoUser._id,
      subjectId: english._id,
      startedAt: daysAgo(1),
      endedAt: new Date(daysAgo(1).getTime() + 5400 * 1000),
      durationSeconds: 5400, // 90 mins
      status: 'completed',
      sessionType: 'standard',
      notes: 'Grammar rules and sentence error revision',
    },
    {
      userId: demoUser._id,
      subjectId: quant._id,
      startedAt: new Date(now.getTime() - 4000 * 1000),
      endedAt: now,
      durationSeconds: 4000,
      status: 'completed',
      sessionType: 'standard',
      notes: 'Today session: High focus on speed drills',
    },
  ];

  await StudySession.insertMany(sampleSessions);
  console.log(` Inserted ${sampleSessions.length} completed study sessions for demo student.`);

  // Insert study planner tasks
  await StudyTask.insertMany([
    {
      userId: demoUser._id,
      subjectId: quant._id,
      chapterId: quantChapters.find((c) => c.name === 'Mixture and Alligation')?._id,
      title: 'Targeted Practice: 20 Questions on Replacement Formula',
      description: 'Convert recommendation: Review foundational concepts and solve 20 questions.',
      priority: 'high',
      dueDate: daysAgo(-2), // 2 days in the future
      estimatedDurationSeconds: 3600,
      status: 'pending',
      linkedRecommendationType: 'low_score_accuracy',
    },
    {
      userId: demoUser._id,
      subjectId: logical._id,
      chapterId: logicalChapters.find((c) => c.name === 'Seating Arrangement')?._id,
      title: 'Analyze Incorrect Questions in Seating Arrangement',
      description: 'Identify where the diagramming error occurred in the hard mock.',
      priority: 'high',
      dueDate: daysAgo(-1),
      estimatedDurationSeconds: 2700,
      status: 'in_progress',
      linkedRecommendationType: 'declining_score',
    },
  ]);

  // Seed 2 mock community students for leaderboard competition
  const peer1 = await User.findOneAndUpdate(
    { email: 'rohit.peer@preptrack.local' },
    {
      name: 'Rohit Verma',
      email: 'rohit.peer@preptrack.local',
      passwordHash,
      role: 'student',
      displayName: 'RohitV',
      targetExam: 'CAT / MBA Entrance',
      dailyStudyGoalSeconds: 7200,
      leaderboardOptIn: true,
      isActive: true,
    },
    { upsert: true, new: true }
  );

  const peer2 = await User.findOneAndUpdate(
    { email: 'priya.peer@preptrack.local' },
    {
      name: 'Priya Iyer',
      email: 'priya.peer@preptrack.local',
      passwordHash,
      role: 'student',
      displayName: 'PriyaI',
      targetExam: 'GATE CS',
      dailyStudyGoalSeconds: 10800,
      leaderboardOptIn: true,
      isActive: true,
    },
    { upsert: true, new: true }
  );

  // Add peer sessions & tests for active leaderboard
  await StudySession.deleteMany({ userId: { $in: [peer1._id, peer2._id] } });
  await Test.deleteMany({ userId: { $in: [peer1._id, peer2._id] } });

  await StudySession.insertMany([
    {
      userId: peer1._id,
      startedAt: daysAgo(3),
      endedAt: new Date(daysAgo(3).getTime() + 25000 * 1000),
      durationSeconds: 25000,
      status: 'completed',
    },
    {
      userId: peer2._id,
      startedAt: daysAgo(2),
      endedAt: new Date(daysAgo(2).getTime() + 32000 * 1000),
      durationSeconds: 32000,
      status: 'completed',
    },
  ]);

  await Test.insertMany([
    {
      userId: peer1._id,
      testName: 'Quant Comprehensive',
      testDate: daysAgo(3),
      testType: 'sectional',
      totalQuestions: 30,
      attemptedQuestions: 28,
      correctAnswers: 24,
      incorrectAnswers: 4,
      unattemptedQuestions: 2,
      marksObtained: 44,
      maxMarks: 60,
      durationSeconds: 2400,
    },
    {
      userId: peer2._id,
      testName: 'CS Fundamentals Mock',
      testDate: daysAgo(2),
      testType: 'sectional',
      totalQuestions: 30,
      attemptedQuestions: 29,
      correctAnswers: 27,
      incorrectAnswers: 2,
      unattemptedQuestions: 1,
      marksObtained: 52,
      maxMarks: 60,
      durationSeconds: 2300,
    },
  ]);

  console.log('Seeded demo student, sample test records, and peer leaderboard participants.');
};

if (process.argv[1]?.endsWith('seedDemoData.js')) {
  (async () => {
    await connectDB();
    await seedDemoData();
    await closeDB();
    process.exit(0);
  })();
}
