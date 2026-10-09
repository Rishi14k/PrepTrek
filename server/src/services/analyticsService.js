/**
 * Core Analytics & Mathematical Calculation Utilities for PrepTrack
 * Implements strict, uniform calculations across all dashboard & report metrics.
 */

export const calculateScorePercentage = (marksObtained, maxMarks) => {
  if (!maxMarks || maxMarks <= 0) return 0;
  return Number(((marksObtained / maxMarks) * 100).toFixed(2));
};

export const calculateAccuracy = (correctAnswers, attemptedQuestions) => {
  if (!attemptedQuestions || attemptedQuestions <= 0) return null;
  return Number(((correctAnswers / attemptedQuestions) * 100).toFixed(2));
};

export const calculateAttemptRate = (attemptedQuestions, totalQuestions) => {
  if (!totalQuestions || totalQuestions <= 0) return 0;
  return Number(((attemptedQuestions / totalQuestions) * 100).toFixed(2));
};

export const calculateCorrectRate = (correctAnswers, totalQuestions) => {
  if (!totalQuestions || totalQuestions <= 0) return 0;
  return Number(((correctAnswers / totalQuestions) * 100).toFixed(2));
};

export const calculateErrorRate = (incorrectAnswers, attemptedQuestions) => {
  if (!attemptedQuestions || attemptedQuestions <= 0) return null;
  return Number(((incorrectAnswers / attemptedQuestions) * 100).toFixed(2));
};

/**
 * Calculates aggregate test metrics from a list of test records
 */
export const calculateAggregateMetrics = (tests) => {
  if (!tests || tests.length === 0) {
    return {
      totalTests: 0,
      totalQuestions: 0,
      totalAttempted: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      totalUnattempted: 0,
      totalMarksObtained: 0,
      totalMaxMarks: 0,
      weightedScorePercentage: 0,
      averageScorePercentage: 0,
      overallAccuracy: null,
      attemptRate: 0,
      totalDurationSeconds: 0,
    };
  }

  let totalQuestions = 0;
  let totalAttempted = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalUnattempted = 0;
  let totalMarksObtained = 0;
  let totalMaxMarks = 0;
  let totalDurationSeconds = 0;
  let scorePercentageSum = 0;

  tests.forEach((t) => {
    totalQuestions += t.totalQuestions || 0;
    totalAttempted += t.attemptedQuestions || 0;
    totalCorrect += t.correctAnswers || 0;
    totalIncorrect += t.incorrectAnswers || 0;
    totalUnattempted += t.unattemptedQuestions || 0;
    totalMarksObtained += t.marksObtained || 0;
    totalMaxMarks += t.maxMarks || 0;
    totalDurationSeconds += t.durationSeconds || 0;

    const scorePct = t.maxMarks > 0 ? (t.marksObtained / t.maxMarks) * 100 : 0;
    scorePercentageSum += scorePct;
  });

  const weightedScorePercentage =
    totalMaxMarks > 0
      ? Number(((totalMarksObtained / totalMaxMarks) * 100).toFixed(2))
      : 0;

  const averageScorePercentage = Number(
    (scorePercentageSum / tests.length).toFixed(2)
  );

  const overallAccuracy =
    totalAttempted > 0
      ? Number(((totalCorrect / totalAttempted) * 100).toFixed(2))
      : null;

  const attemptRate =
    totalQuestions > 0
      ? Number(((totalAttempted / totalQuestions) * 100).toFixed(2))
      : 0;

  return {
    totalTests: tests.length,
    totalQuestions,
    totalAttempted,
    totalCorrect,
    totalIncorrect,
    totalUnattempted,
    totalMarksObtained,
    totalMaxMarks,
    weightedScorePercentage,
    averageScorePercentage,
    overallAccuracy,
    attemptRate,
    totalDurationSeconds,
  };
};

/**
 * Calculates percentage-point difference and relative percentage difference
 */
export const calculateComparison = (currentValue, previousValue) => {
  if (previousValue === null || previousValue === undefined || isNaN(previousValue)) {
    return {
      difference: null,
      percentageChange: null,
      hasHistoricalData: false,
    };
  }

  if (currentValue === null || currentValue === undefined || isNaN(currentValue)) {
    return {
      difference: null,
      percentageChange: null,
      hasHistoricalData: true,
    };
  }

  const difference = Number((currentValue - previousValue).toFixed(2));
  let percentageChange = null;
  if (previousValue !== 0) {
    percentageChange = Number((((currentValue - previousValue) / Math.abs(previousValue)) * 100).toFixed(2));
  }

  return {
    difference,
    percentageChange,
    hasHistoricalData: true,
  };
};

/**
 * Classifies chapter readiness using configurable thresholds and evidence rules
 */
export const classifyChapter = (stats, thresholds = {}) => {
  const strongThresh = thresholds.strongThreshold ?? 80;
  const devThresh = thresholds.developingThreshold ?? 60;
  const minTests = thresholds.minEvidenceTests ?? 2;
  const minQuestions = thresholds.minEvidenceQuestions ?? 20;

  if (stats.testCount < minTests || stats.totalAttempted < minQuestions) {
    return {
      classification: 'insufficient_data',
      label: 'Insufficient Data',
      color: 'slate',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      reason: `Need at least ${minTests} tests and ${minQuestions} attempted questions to establish mastery pattern.`,
    };
  }

  const score = stats.weightedScorePercentage;

  if (score >= strongThresh) {
    return {
      classification: 'strong',
      label: 'Strong',
      color: 'emerald',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
      reason: `Consistently high score (>=${strongThresh}%) across tested sessions.`,
    };
  }

  if (score >= devThresh) {
    return {
      classification: 'developing',
      label: 'Developing',
      color: 'amber',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
      reason: `Moderate performance (${devThresh}% - ${strongThresh}%). Requires targeted refinement.`,
    };
  }

  return {
    classification: 'needs_improvement',
    label: 'Needs Improvement',
    color: 'rose',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
    reason: `Score is below ${devThresh}%. Foundational revision recommended.`,
  };
};
