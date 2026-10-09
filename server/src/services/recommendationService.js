/**
 * Rule-Based Recommendation Engine for PrepTrack
 * Translates student performance data into concrete, actionable study recommendations.
 */

export const generateRecommendations = ({
  chapterStats = [],
  subjectStats = [],
  aggregateMetrics = {},
  studyStats = {},
  config = {},
}) => {
  const recommendations = [];
  const neglectedDaysThreshold = config.neglectedDaysThreshold || 14;
  const now = new Date();

  // 1. Analyze chapter-specific conditions
  chapterStats.forEach((chap) => {
    const {
      chapterId,
      chapterName,
      subjectId,
      subjectName,
      testCount,
      totalAttempted,
      totalQuestions,
      weightedScorePercentage,
      accuracy,
      attemptRate,
      lastPracticedDate,
      trend, // 'improving', 'declining', 'stable'
      scoreDrop,
    } = chap;

    // Rule 1: Declining Performance
    if (trend === 'declining' && scoreDrop >= 8 && testCount >= 2) {
      recommendations.push({
        id: `declining_${chapterId}`,
        priority: 'high',
        category: 'declining_score',
        subjectId,
        subjectName,
        chapterId,
        chapterName,
        title: `Address Performance Drop in ${chapterName}`,
        observedEvidence: `Recent test score fell by ${scoreDrop}% compared to previous sessions.`,
        whyItMatters: `A sharp downward trend indicates conceptual confusion in advanced sub-topics or test fatigue.`,
        nextAction: `Review recent incorrect questions in ${chapterName}, re-solve errors without looking at solutions, then take a 15-question mini-test.`,
        suggestedDurationMinutes: 45,
        targetQuestions: 15,
      });
    }

    // Rule 2: Low Score & Low Accuracy (Severe bottleneck)
    else if (
      testCount >= 2 &&
      weightedScorePercentage < 55 &&
      accuracy !== null &&
      accuracy < 60
    ) {
      recommendations.push({
        id: `low_score_acc_${chapterId}`,
        priority: 'high',
        category: 'low_score_accuracy',
        subjectId,
        subjectName,
        chapterId,
        chapterName,
        title: `Foundational Revision: ${chapterName}`,
        observedEvidence: `Score is ${weightedScorePercentage}% with ${accuracy}% accuracy across ${totalAttempted} attempted questions.`,
        whyItMatters: `Low accuracy with low score points to conceptual gaps rather than speed constraints.`,
        nextAction: `Read chapter theory, study 10 solved illustrations, then solve 20 basic-to-moderate level questions before attempting timed mock tests.`,
        suggestedDurationMinutes: 60,
        targetQuestions: 20,
      });
    }

    // Rule 3: High Accuracy but Low Attempt Rate (Speed bottleneck)
    else if (
      testCount >= 2 &&
      accuracy !== null &&
      accuracy >= 85 &&
      attemptRate < 60
    ) {
      recommendations.push({
        id: `speed_needed_${chapterId}`,
        priority: 'medium',
        category: 'speed_bottleneck',
        subjectId,
        subjectName,
        chapterId,
        chapterName,
        title: `Build Speed in ${chapterName}`,
        observedEvidence: `Superb accuracy (${accuracy}%), but attempt rate is only ${attemptRate}%.`,
        whyItMatters: `You know the concepts well but spend too much time per question, leaving marks on the table.`,
        nextAction: `Practice timed sectional sets with a timer limit of 75 seconds per question to build recognition speed.`,
        suggestedDurationMinutes: 45,
        targetQuestions: 25,
      });
    }

    // Rule 4: Low Accuracy despite high attempt rate (Guesswork / careless errors)
    else if (
      testCount >= 2 &&
      attemptRate >= 75 &&
      accuracy !== null &&
      accuracy < 65
    ) {
      recommendations.push({
        id: `negative_marking_${chapterId}`,
        priority: 'high',
        category: 'negative_marking_risk',
        subjectId,
        subjectName,
        chapterId,
        chapterName,
        title: `Eliminate Careless Errors in ${chapterName}`,
        observedEvidence: `High attempt rate (${attemptRate}%) but low accuracy (${accuracy}%).`,
        whyItMatters: `Attempting questions without sufficient certainty incurs heavy negative marking penalties.`,
        nextAction: `Practice strict question filtering: skip questions where confidence is below 70%, and focus on zero negative markings.`,
        suggestedDurationMinutes: 30,
        targetQuestions: 20,
      });
    }

    // Rule 5: Neglected Chapter
    if (lastPracticedDate) {
      const daysSince = Math.floor(
        (now.getTime() - new Date(lastPracticedDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince >= neglectedDaysThreshold && testCount >= 1) {
        recommendations.push({
          id: `neglected_${chapterId}`,
          priority: 'medium',
          category: 'neglected_chapter',
          subjectId,
          subjectName,
          chapterId,
          chapterName,
          title: `Schedule Revision for ${chapterName}`,
          observedEvidence: `Last practiced ${daysSince} days ago (${testCount} previous tests recorded).`,
          whyItMatters: `Retention decays exponentially after 14 days without active retrieval practice.`,
          nextAction: `Dedicate a 30-minute quick-review session solving 10 mixed questions to maintain active recall.`,
          suggestedDurationMinutes: 30,
          targetQuestions: 10,
        });
      }
    }

    // Rule 6: Insufficient Data / Diagnostic Test
    if (testCount === 0 || totalAttempted < 10) {
      recommendations.push({
        id: `diagnostic_${chapterId}`,
        priority: 'low',
        category: 'diagnostic_needed',
        subjectId,
        subjectName,
        chapterId,
        chapterName,
        title: `Take Diagnostic Test: ${chapterName}`,
        observedEvidence: `Only ${testCount} tests recorded with fewer than 10 question attempts.`,
        whyItMatters: `PrepTrack needs a reliable baseline to calculate accurate strength/weakness classifications.`,
        nextAction: `Take a 15-to-20 question chapter diagnostic test to establish your performance baseline.`,
        suggestedDurationMinutes: 30,
        targetQuestions: 15,
      });
    }
  });

  // 2. Study Habit & Routine Recommendations
  if (studyStats) {
    const { currentStreak = 0, todayDurationSeconds = 0, dailyGoalSeconds = 7200 } = studyStats;
    if (todayDurationSeconds < dailyGoalSeconds / 2 && currentStreak > 0) {
      const remainingMinutes = Math.round((dailyGoalSeconds - todayDurationSeconds) / 60);
      if (remainingMinutes > 0) {
        recommendations.push({
          id: `daily_goal_streak`,
          priority: 'medium',
          category: 'study_routine',
          subjectId: null,
          chapterId: null,
          title: `Protect Your ${currentStreak}-Day Study Streak`,
          observedEvidence: `You have completed ${Math.round(todayDurationSeconds / 60)} mins out of your ${Math.round(dailyGoalSeconds / 60)} min daily goal.`,
          whyItMatters: `Consistent daily study beats sporadic cramming for competitive entrance exams.`,
          nextAction: `Start a 30-minute focus session with the Study Timer to stay on track.`,
          suggestedDurationMinutes: Math.min(30, remainingMinutes),
          targetQuestions: 0,
        });
      }
    }
  }

  // Sort recommendations by priority (high > medium > low)
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Return the top recommendations
  return recommendations;
};
