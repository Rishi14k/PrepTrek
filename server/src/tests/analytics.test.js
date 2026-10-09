import {
  calculateScorePercentage,
  calculateAccuracy,
  calculateAttemptRate,
  calculateCorrectRate,
  calculateErrorRate,
  calculateAggregateMetrics,
  calculateComparison,
  classifyChapter,
} from '../services/analyticsService.js';
import { generateRecommendations } from '../services/recommendationService.js';

describe('Analytics & Calculation Engine - Unit Tests', () => {
  test('calculateScorePercentage correctly calculates percentage and handles edge cases', () => {
    expect(calculateScorePercentage(36, 50)).toBe(72);
    expect(calculateScorePercentage(0, 50)).toBe(0);
    expect(calculateScorePercentage(50, 50)).toBe(100);
    expect(calculateScorePercentage(10, 0)).toBe(0);
  });

  test('calculateAccuracy returns accurate float and handles zero attempts without division by zero', () => {
    expect(calculateAccuracy(32, 40)).toBe(80);
    expect(calculateAccuracy(0, 10)).toBe(0);
    expect(calculateAccuracy(10, 0)).toBeNull(); // Never divide by zero
    expect(calculateAccuracy(5, null)).toBeNull();
  });

  test('calculateAttemptRate and calculateErrorRate calculations', () => {
    expect(calculateAttemptRate(20, 25)).toBe(80);
    expect(calculateAttemptRate(0, 25)).toBe(0);
    expect(calculateErrorRate(4, 20)).toBe(20);
    expect(calculateErrorRate(2, 0)).toBeNull();
  });

  test('calculateAggregateMetrics calculates correct weighted score vs simple average', () => {
    const mockTests = [
      {
        totalQuestions: 20,
        attemptedQuestions: 15,
        correctAnswers: 12,
        incorrectAnswers: 3,
        unattemptedQuestions: 5,
        marksObtained: 24, // 80% on 30 marks
        maxMarks: 30,
        durationSeconds: 1200,
      },
      {
        totalQuestions: 50,
        attemptedQuestions: 40,
        correctAnswers: 20,
        incorrectAnswers: 20,
        unattemptedQuestions: 10,
        marksObtained: 35, // 50% on 70 marks
        maxMarks: 70,
        durationSeconds: 3000,
      },
    ];

    const metrics = calculateAggregateMetrics(mockTests);
    expect(metrics.totalTests).toBe(2);
    expect(metrics.totalAttempted).toBe(55);
    expect(metrics.totalCorrect).toBe(32);
    // Weighted score: (24 + 35) / (30 + 70) * 100 = 59%
    expect(metrics.weightedScorePercentage).toBe(59);
    // Simple average score: (80 + 50) / 2 = 65%
    expect(metrics.averageScorePercentage).toBe(65);
    // Overall accuracy: 32 / 55 * 100 = 58.18%
    expect(metrics.overallAccuracy).toBe(58.18);
  });

  test('calculateComparison identifies improvement percentage and handles no history', () => {
    const withHistory = calculateComparison(70, 60);
    expect(withHistory.difference).toBe(10);
    expect(withHistory.percentageChange).toBe(16.67);
    expect(withHistory.hasHistoricalData).toBe(true);

    const noHistory = calculateComparison(75, null);
    expect(noHistory.hasHistoricalData).toBe(false);
    expect(noHistory.difference).toBeNull();
  });

  test('classifyChapter handles minimum evidence thresholds and categorizes properly', () => {
    // Insufficient data (< 2 tests)
    const insData = classifyChapter({
      testCount: 1,
      totalAttempted: 15,
      weightedScorePercentage: 90,
    });
    expect(insData.classification).toBe('insufficient_data');

    // Strong (>= 80% with >= 2 tests and >= 20 questions)
    const strong = classifyChapter({
      testCount: 3,
      totalAttempted: 35,
      weightedScorePercentage: 84,
    });
    expect(strong.classification).toBe('strong');

    // Developing (60-80%)
    const developing = classifyChapter({
      testCount: 2,
      totalAttempted: 25,
      weightedScorePercentage: 68,
    });
    expect(developing.classification).toBe('developing');

    // Needs improvement (< 60%)
    const weak = classifyChapter({
      testCount: 2,
      totalAttempted: 22,
      weightedScorePercentage: 45,
    });
    expect(weak.classification).toBe('needs_improvement');
  });

  test('generateRecommendations creates targeted advice for weak chapters and declining trends', () => {
    const mockChapters = [
      {
        chapterId: 'chap1',
        chapterName: 'Mixture and Alligation',
        subjectName: 'Quantitative Aptitude',
        testCount: 3,
        totalAttempted: 30,
        totalQuestions: 35,
        weightedScorePercentage: 42,
        accuracy: 45,
        attemptRate: 85,
        trend: 'declining',
        scoreDrop: 12,
      },
    ];

    const recommendations = generateRecommendations({
      chapterStats: mockChapters,
    });

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].priority).toBe('high');
    expect(recommendations[0].chapterName).toBe('Mixture and Alligation');
  });
});
