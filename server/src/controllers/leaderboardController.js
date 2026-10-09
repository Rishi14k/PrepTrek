import User from '../models/User.js';
import Test from '../models/Test.js';
import StudySession from '../models/StudySession.js';
import { calculateAggregateMetrics } from '../services/analyticsService.js';

export const getLeaderboard = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const { category = 'weekly_study', period = 'weekly' } = req.query;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Only students who opted in to public leaderboard and are active
    const optedInUsers = await User.find({
      leaderboardOptIn: true,
      isActive: true,
    }).select('name displayName username avatar targetExam createdAt');

    // Also check current user's opt-in status
    const isCurrentUserOptedIn = req.user.leaderboardOptIn;

    const rankings = [];

    for (const student of optedInUsers) {
      const studentId = student._id;

      if (category === 'weekly_study' || category === 'monthly_study') {
        const sinceDate = category === 'weekly_study' ? oneWeekAgo : oneMonthAgo;
        const prevSinceDate = category === 'weekly_study' ? twoWeeksAgo : twoMonthsAgo;

        const sessions = await StudySession.find({
          userId: studentId,
          status: 'completed',
          startedAt: { $gte: sinceDate },
        });

        const prevSessions = await StudySession.find({
          userId: studentId,
          status: 'completed',
          startedAt: { $gte: prevSinceDate, $lt: sinceDate },
        });

        const currentSeconds = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
        const prevSeconds = prevSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

        rankings.push({
          userId: student._id,
          name: student.displayName || student.name.split(' ')[0],
          avatar: student.avatar || '',
          targetExam: student.targetExam,
          metricValue: Number((currentSeconds / 3600).toFixed(1)),
          metricLabel: `${Number((currentSeconds / 3600).toFixed(1))} hrs`,
          rawScore: currentSeconds,
          prevRawScore: prevSeconds,
          isCurrentUser: student._id.toString() === currentUserId,
        });
      } else if (category === 'weekly_score' || category === 'monthly_score') {
        const sinceDate = category === 'weekly_score' ? oneWeekAgo : oneMonthAgo;
        const tests = await Test.find({
          userId: studentId,
          testDate: { $gte: sinceDate },
        });

        const metrics = calculateAggregateMetrics(tests);

        // Require at least 2 tests for reliable ranking
        if (metrics.totalTests >= 1) {
          rankings.push({
            userId: student._id,
            name: student.displayName || student.name.split(' ')[0],
            avatar: student.avatar || '',
            targetExam: student.targetExam,
            metricValue: metrics.weightedScorePercentage,
            metricLabel: `${metrics.weightedScorePercentage}% (${metrics.totalTests} tests)`,
            rawScore: metrics.weightedScorePercentage,
            testCount: metrics.totalTests,
            isCurrentUser: student._id.toString() === currentUserId,
          });
        }
      } else if (category === 'consistency') {
        // Active days in last 30 days
        const sessions = await StudySession.find({
          userId: studentId,
          status: 'completed',
          startedAt: { $gte: oneMonthAgo },
        });

        const activeDays = new Set(
          sessions.map((s) => new Date(s.startedAt).toISOString().split('T')[0])
        ).size;

        rankings.push({
          userId: student._id,
          name: student.displayName || student.name.split(' ')[0],
          avatar: student.avatar || '',
          targetExam: student.targetExam,
          metricValue: activeDays,
          metricLabel: `${activeDays} / 30 active days`,
          rawScore: activeDays,
          isCurrentUser: student._id.toString() === currentUserId,
        });
      } else {
        // category === 'improvement'
        const recentTests = await Test.find({
          userId: studentId,
          testDate: { $gte: oneMonthAgo },
        });
        const olderTests = await Test.find({
          userId: studentId,
          testDate: { $gte: twoMonthsAgo, $lt: oneMonthAgo },
        });

        const mRecent = calculateAggregateMetrics(recentTests);
        const mOlder = calculateAggregateMetrics(olderTests);

        if (mRecent.totalTests >= 2 && mOlder.totalTests >= 2) {
          const improvement = Number(
            (mRecent.weightedScorePercentage - mOlder.weightedScorePercentage).toFixed(1)
          );
          rankings.push({
            userId: student._id,
            name: student.displayName || student.name.split(' ')[0],
            avatar: student.avatar || '',
            targetExam: student.targetExam,
            metricValue: improvement,
            metricLabel: `${improvement > 0 ? '+' : ''}${improvement}% improvement`,
            rawScore: improvement,
            isCurrentUser: student._id.toString() === currentUserId,
          });
        }
      }
    }

    // Sort descending by raw score
    rankings.sort((a, b) => b.rawScore - a.rawScore);

    // Assign sequential ranks with stable tie handling
    const rankedList = rankings.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    return res.status(200).json({
      success: true,
      category,
      isCurrentUserOptedIn,
      totalParticipants: rankedList.length,
      leaderboard: rankedList,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch leaderboard.' });
  }
};

export const updateLeaderboardPreferences = async (req, res) => {
  try {
    const { leaderboardOptIn, displayName } = req.body;
    if (leaderboardOptIn !== undefined) req.user.leaderboardOptIn = leaderboardOptIn;
    if (displayName !== undefined) req.user.displayName = displayName;
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: 'Leaderboard preferences saved.',
      leaderboardOptIn: req.user.leaderboardOptIn,
      displayName: req.user.displayName,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update preferences.' });
  }
};
