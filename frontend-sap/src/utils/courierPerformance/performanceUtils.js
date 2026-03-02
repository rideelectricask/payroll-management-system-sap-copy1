import { PERFORMANCE_COLORS, PERFORMANCE_THRESHOLDS } from './constants.js';

export const getPerformanceStyle = (percentage) => {
  if (percentage >= PERFORMANCE_THRESHOLDS.EXCELLENT) return PERFORMANCE_COLORS.EXCELLENT;
  if (percentage >= PERFORMANCE_THRESHOLDS.GOOD) return PERFORMANCE_COLORS.GOOD;
  if (percentage >= PERFORMANCE_THRESHOLDS.AVERAGE) return PERFORMANCE_COLORS.AVERAGE;
  return PERFORMANCE_COLORS.NEEDS_IMPROVEMENT;
};

export const getPerformanceIcon = (percentage) => {
  if (percentage >= PERFORMANCE_THRESHOLDS.EXCELLENT) return '🏆';
  if (percentage >= PERFORMANCE_THRESHOLDS.GOOD) return '✅';
  if (percentage >= PERFORMANCE_THRESHOLDS.AVERAGE) return '⚠️';
  return '❌';
};

export const getPerformanceRating = (percentage) => {
  if (percentage >= PERFORMANCE_THRESHOLDS.EXCELLENT) return 'Excellent';
  if (percentage >= PERFORMANCE_THRESHOLDS.GOOD) return 'Good';
  if (percentage >= PERFORMANCE_THRESHOLDS.AVERAGE) return 'Average';
  return 'Needs Improvement';
};