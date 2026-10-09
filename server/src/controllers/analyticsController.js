import mongoose from 'mongoose';
import Test from '../models/Test.js';
import TestBreakdown from '../models/TestBreakdown.js';
import StudySession from '../models/StudySession.js';
import Subject from '../models/Subject.js';
import Chapter from '../models/Chapter.js';
import SystemSetting from '../models/SystemSetting.js';
import {
  calculateScorePercentage,
  calculateAccuracy,
  calculateAggregateMetrics,
  calculateComparison,
  classifyChapter,
} from '../services/analyticsService.js';
import { generateRecommendations } from '../services/recommendationService.js';

// Helper to calculate date ranges and predecessor ranges
const resolveDateRange = (period, customStart, customEnd) => {
  const now = new Date();
  let currentStart;
  let currentEnd = now;

  switch (period) {
    case '7d':
      currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      currentStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'custom':
      currentStart = customStart ? new Date(customStart) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      currentEnd = customEnd ? new Date(customEnd) : now;
      break;
    case 'all':
    default:
      currentStart = new Date(0); // Beginning of time
      break;
  }

  // Preceding equivalent period
  let prevStart = null;
  let prevEnd = null;

  if (period !== 'all') {
    const durationMs = currentEnd.getTime() - currentStart.getTime();
    prevEnd = new Date(currentStart.getTime());
    prevStart = new Date(prevEnd.getTime() - durationMs);
  }

  return { currentStart, currentEnd, prevStart, prevEnd };
};

export const getOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30d', startDate, endDate } = req.query;

    const { currentStart, currentEnd, prevStart, prevEnd } = resolveDateRange(
      period,
      startDate,
      endDate
    );

    // 1. Fetch tests for current period and preceding period
    const currentTests = await Test.find({
      userId,
      testDate: { $gte: currentStart, $lte: currentEnd },
    }).sort({ testDate: 1 });

    let previousTests = [];
    if (prevStart && prevEnd) {
      previousTests = await Test.find({
        userId,
        testDate: { $gte: prevStart, $lte: prevEnd },
      });
    }

    const currentMetrics = calculateAggregateMetrics(currentTests);
    const previousMetrics = calculateAggregateMetrics(previousTests);

    // 2. Fetch completed study sessions for current and previous period
    const currentSessions = await StudySession.find({
      userId,
      status: 'completed',
      startedAt: { $gte: currentStart, $lte: currentEnd },
    });

    let previousSessions = [];
    if (prevStart && prevEnd) {
      previousSessions = await StudySession.find({
        userId,
        status: 'completed',
        startedAt: { $gte: prevStart, $lte: prevEnd },
      });
    }

    const currentStudySeconds = currentSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    const prevStudySeconds = previousSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

    const currentStudyHours = Number((currentStudySeconds / 3600).toFixed(1));
    const prevStudyHours = Number((prevStudySeconds / 3600).toFixed(1));

    const currentAvgSessionMinutes =
      currentSessions.length > 0
        ? Number((currentStudySeconds / (currentSessions.length * 60)).toFixed(1))
        : 0;
    const prevAvgSessionMinutes =
      previousSessions.length > 0
        ? Number((prevStudySeconds / (previousSessions.length * 60)).toFixed(1))
        : 0;

    // 3. Calculate study streak
    const allCompletedSessions = await StudySession.find({
      userId,
      status: 'completed',
    }).sort({ startedAt: -1 });

    const activeDaysSet = new Set(
      allCompletedSessions.map((s) => new Date(s.startedAt).toISOString().split('T')[0])
    );

    let streak = 0;
    const today = new Date();
    let checkDate = new Date(today);

    // Check today or yesterday as streak start
    const todayStr = checkDate.toISOString().split('T')[0];
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = checkDate.toISOString().split('T')[0];

    let streakActive = activeDaysSet.has(todayStr) || activeDaysSet.has(yesterdayStr);
    if (streakActive) {
      let cur = activeDaysSet.has(todayStr) ? new Date(today) : new Date(checkDate);
      while (true) {
        const curStr = cur.toISOString().split('T')[0];
        if (activeDaysSet.has(curStr)) {
          streak++;
          cur.setDate(cur.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // 4. Calculate comparisons
    const comparisons = {
      tests: calculateComparison(currentMetrics.totalTests, previousMetrics.totalTests),
      questions: calculateComparison(currentMetrics.totalAttempted, previousMetrics.totalAttempted),
      scorePercentage: calculateComparison(
        currentMetrics.weightedScorePercentage,
        previousTests.length > 0 ? previousMetrics.weightedScorePercentage : null
      ),
      accuracy: calculateComparison(
        currentMetrics.overallAccuracy,
        previousTests.length > 0 ? previousMetrics.overallAccuracy : null
      ),
      studyHours: calculateComparison(
        currentStudyHours,
        previousSessions.length > 0 ? prevStudyHours : null
      ),
      avgSessionMinutes: calculateComparison(
        currentAvgSessionMinutes,
        previousSessions.length > 0 ? prevAvgSessionMinutes : null
      ),
    };

    // 5. Recent activity
    const recentTests = await Test.find({ userId })
      .populate('subjectId', 'name color')
      .populate('chapterId', 'name')
      .sort({ testDate: -1 })
      .limit(5);

    const recentSessions = await StudySession.find({ userId, status: 'completed' })
      .populate('subjectId', 'name color')
      .populate('chapterId', 'name')
      .sort({ startedAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      period,
      summary: {
        totalTests: currentMetrics.totalTests,
        totalAttemptedQuestions: currentMetrics.totalAttempted,
        overallScorePercentage: currentMetrics.weightedScorePercentage,
        overallAccuracy: currentMetrics.overallAccuracy,
        totalStudyHours: currentStudyHours,
        avgSessionMinutes: currentAvgSessionMinutes,
        currentStreak: streak,
        attemptRate: currentMetrics.attemptRate,
      },
      comparisons,
      recentActivity: {
        tests: recentTests.map((t) => ({
          ...t.toObject(),
          scorePercentage: calculateScorePercentage(t.marksObtained, t.maxMarks),
          accuracy: calculateAccuracy(t.correctAnswers, t.attemptedQuestions),
        })),
        sessions: recentSessions,
      },
    });
  } catch (error) {
    console.error('Error in getOverview:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate overview analytics.',
    });
  }
};

export const getTrends = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30d', subjectId, testType, startDate, endDate } = req.query;

    const { currentStart, currentEnd } = resolveDateRange(period, startDate, endDate);

    const query = {
      userId,
      testDate: { $gte: currentStart, $lte: currentEnd },
    };

    if (subjectId) query.subjectId = subjectId;
    if (testType) query.testType = testType;

    const tests = await Test.find(query)
      .populate('subjectId', 'name color')
      .populate('chapterId', 'name')
      .sort({ testDate: 1 });

    const timeline = tests.map((t) => {
      const scorePct = calculateScorePercentage(t.marksObtained, t.maxMarks);
      const acc = calculateAccuracy(t.correctAnswers, t.attemptedQuestions);
      return {
        id: t._id,
        testName: t.testName,
        testDate: t.testDate,
        dateFormatted: new Date(t.testDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        scorePercentage: scorePct,
        accuracy: acc,
        marksObtained: t.marksObtained,
        maxMarks: t.maxMarks,
        attemptedQuestions: t.attemptedQuestions,
        totalQuestions: t.totalQuestions,
        subjectName: t.subjectId?.name || 'General',
        chapterName: t.chapterId?.name || null,
        testType: t.testType,
      };
    });

    return res.status(200).json({ success: true, timeline });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch trends.' });
  }
};

export const getSubjectAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30d', startDate, endDate } = req.query;
    const { currentStart, currentEnd } = resolveDateRange(period, startDate, endDate);

    const subjects = await Subject.find({ isActive: true }).sort({ displayOrder: 1 });
    const tests = await Test.find({
      userId,
      testDate: { $gte: currentStart, $lte: currentEnd },
    });

    const sessions = await StudySession.find({
      userId,
      status: 'completed',
      startedAt: { $gte: currentStart, $lte: currentEnd },
    });

    const subjectData = subjects.map((sub) => {
      const subTests = tests.filter(
        (t) => t.subjectId && t.subjectId.toString() === sub._id.toString()
      );
      const subSessions = sessions.filter(
        (s) => s.subjectId && s.subjectId.toString() === sub._id.toString()
      );

      const metrics = calculateAggregateMetrics(subTests);
      const studySeconds = subSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

      return {
        subjectId: sub._id,
        name: sub.name,
        slug: sub.slug,
        color: sub.color,
        testCount: metrics.totalTests,
        totalQuestions: metrics.totalQuestions,
        totalAttempted: metrics.totalAttempted,
        weightedScorePercentage: metrics.weightedScorePercentage,
        averageScorePercentage: metrics.averageScorePercentage,
        accuracy: metrics.overallAccuracy,
        attemptRate: metrics.attemptRate,
        studyHours: Number((studySeconds / 3600).toFixed(1)),
      };
    });

    return res.status(200).json({ success: true, subjects: subjectData });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch subject analytics.' });
  }
};

export const getChapterAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { subjectId, sortBy = 'score', sortOrder = 'desc' } = req.query;

    const config = (await SystemSetting.findOne({ key: 'global_config' })) || {};
    const chaptersFilter = { isActive: true };
    if (subjectId) chaptersFilter.subjectId = subjectId;

    const chapters = await Chapter.find(chaptersFilter).populate('subjectId', 'name color slug');
    const tests = await Test.find({ userId }).sort({ testDate: 1 });
    const sessions = await StudySession.find({ userId, status: 'completed' });

    const chapterStats = chapters.map((chap) => {
      const chapTests = tests.filter(
        (t) => t.chapterId && t.chapterId.toString() === chap._id.toString()
      );
      const chapSessions = sessions.filter(
        (s) => s.chapterId && s.chapterId.toString() === chap._id.toString()
      );

      const metrics = calculateAggregateMetrics(chapTests);
      const studySeconds = chapSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

      // Trend calculation: compare first half tests vs second half tests
      let trend = 'stable';
      let scoreDrop = 0;
      if (chapTests.length >= 2) {
        const mid = Math.floor(chapTests.length / 2);
        const firstHalf = chapTests.slice(0, mid);
        const secondHalf = chapTests.slice(mid);

        const firstScore = calculateAggregateMetrics(firstHalf).weightedScorePercentage;
        const secondScore = calculateAggregateMetrics(secondHalf).weightedScorePercentage;

        if (secondScore - firstScore >= 5) {
          trend = 'improving';
        } else if (firstScore - secondScore >= 5) {
          trend = 'declining';
          scoreDrop = Number((firstScore - secondScore).toFixed(1));
        }
      }

      const lastTest = chapTests.length > 0 ? chapTests[chapTests.length - 1] : null;
      const lastPracticedDate = lastTest ? lastTest.testDate : null;

      const classification = classifyChapter(
        {
          testCount: metrics.totalTests,
          totalAttempted: metrics.totalAttempted,
          weightedScorePercentage: metrics.weightedScorePercentage,
        },
        config
      );

      return {
        chapterId: chap._id,
        chapterName: chap.name,
        subjectId: chap.subjectId?._id,
        subjectName: chap.subjectId?.name || 'General',
        subjectColor: chap.subjectId?.color || 'indigo',
        testCount: metrics.totalTests,
        totalQuestions: metrics.totalQuestions,
        totalAttempted: metrics.totalAttempted,
        weightedScorePercentage: metrics.weightedScorePercentage,
        averageScorePercentage: metrics.averageScorePercentage,
        accuracy: metrics.overallAccuracy,
        attemptRate: metrics.attemptRate,
        trend,
        scoreDrop,
        lastPracticedDate,
        studyHours: Number((studySeconds / 3600).toFixed(1)),
        classification: classification.classification,
        classificationLabel: classification.label,
        classificationBadge: classification.badgeClass,
        classificationReason: classification.reason,
      };
    });

    // Sort chapters
    chapterStats.sort((a, b) => {
      let valA = a.weightedScorePercentage;
      let valB = b.weightedScorePercentage;

      if (sortBy === 'accuracy') {
        valA = a.accuracy ?? -1;
        valB = b.accuracy ?? -1;
      } else if (sortBy === 'tests') {
        valA = a.testCount;
        valB = b.testCount;
      } else if (sortBy === 'neglected') {
        valA = a.lastPracticedDate ? new Date(a.lastPracticedDate).getTime() : 0;
        valB = b.lastPracticedDate ? new Date(b.lastPracticedDate).getTime() : 0;
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return res.status(200).json({ success: true, chapters: chapterStats });
  } catch (error) {
    console.error('Error in getChapterAnalytics:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch chapter analytics.' });
  }
};

export const getChapterDetail = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chapterId } = req.params;

    const chapter = await Chapter.findById(chapterId).populate('subjectId');
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter not found.' });
    }

    const tests = await Test.find({ userId, chapterId }).sort({ testDate: 1 });
    const sessions = await StudySession.find({ userId, chapterId, status: 'completed' });

    const metrics = calculateAggregateMetrics(tests);
    const studySeconds = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

    const history = tests.map((t) => ({
      _id: t._id,
      testName: t.testName,
      testDate: t.testDate,
      scorePercentage: calculateScorePercentage(t.marksObtained, t.maxMarks),
      accuracy: calculateAccuracy(t.correctAnswers, t.attemptedQuestions),
      attemptRate: calculateScorePercentage(t.attemptedQuestions, t.totalQuestions),
      marksObtained: t.marksObtained,
      maxMarks: t.maxMarks,
      attemptedQuestions: t.attemptedQuestions,
      correctAnswers: t.correctAnswers,
      incorrectAnswers: t.incorrectAnswers,
      durationSeconds: t.durationSeconds,
    }));

    const config = (await SystemSetting.findOne({ key: 'global_config' })) || {};
    const classification = classifyChapter(
      {
        testCount: metrics.totalTests,
        totalAttempted: metrics.totalAttempted,
        weightedScorePercentage: metrics.weightedScorePercentage,
      },
      config
    );

    return res.status(200).json({
      success: true,
      chapter: {
        _id: chapter._id,
        name: chapter.name,
        subject: chapter.subjectId,
        metrics: {
          ...metrics,
          studyHours: Number((studySeconds / 3600).toFixed(1)),
          classification,
        },
        history,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch chapter detail.' });
  }
};

export const getInsights = async (req, res) => {
  try {
    const userId = req.user._id;
    const config = (await SystemSetting.findOne({ key: 'global_config' })) || {};

    const chapters = await Chapter.find({ isActive: true }).populate('subjectId');
    const tests = await Test.find({ userId }).sort({ testDate: 1 });
    const studySessions = await StudySession.find({ userId, status: 'completed' });

    // Build chapter stats
    const chapterStats = chapters.map((chap) => {
      const chapTests = tests.filter(
        (t) => t.chapterId && t.chapterId.toString() === chap._id.toString()
      );
      const metrics = calculateAggregateMetrics(chapTests);

      let trend = 'stable';
      let scoreDrop = 0;
      if (chapTests.length >= 2) {
        const mid = Math.floor(chapTests.length / 2);
        const firstHalf = chapTests.slice(0, mid);
        const secondHalf = chapTests.slice(mid);
        const s1 = calculateAggregateMetrics(firstHalf).weightedScorePercentage;
        const s2 = calculateAggregateMetrics(secondHalf).weightedScorePercentage;
        if (s2 - s1 >= 5) trend = 'improving';
        else if (s1 - s2 >= 5) {
          trend = 'declining';
          scoreDrop = Number((s1 - s2).toFixed(1));
        }
      }

      const lastTest = chapTests.length > 0 ? chapTests[chapTests.length - 1] : null;

      return {
        chapterId: chap._id,
        chapterName: chap.name,
        subjectId: chap.subjectId?._id,
        subjectName: chap.subjectId?.name || 'General',
        testCount: metrics.totalTests,
        totalAttempted: metrics.totalAttempted,
        totalQuestions: metrics.totalQuestions,
        weightedScorePercentage: metrics.weightedScorePercentage,
        accuracy: metrics.overallAccuracy,
        attemptRate: metrics.attemptRate,
        lastPracticedDate: lastTest ? lastTest.testDate : null,
        trend,
        scoreDrop,
      };
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySessions = studySessions.filter((s) => new Date(s.startedAt) >= today);
    const todayDurationSeconds = todaySessions.reduce((a, b) => a + (b.durationSeconds || 0), 0);

    const recommendations = generateRecommendations({
      chapterStats,
      config,
      studyStats: {
        todayDurationSeconds,
        dailyGoalSeconds: req.user.dailyStudyGoalSeconds || 7200,
        currentStreak: 1,
      },
    });

    return res.status(200).json({
      success: true,
      recommendations: recommendations.slice(0, 10), // Top 10 recommendations
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate recommendations.' });
  }
};
