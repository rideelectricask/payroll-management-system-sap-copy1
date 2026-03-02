import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TrendingUp, Users, Award, BarChart3, Activity, RefreshCw, Loader2, Download, ChevronDown, ChevronUp, User, Calendar, Target, AlertCircle, CheckCircle2, XCircle, Zap, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { getPerformanceAnalytics, exportPerformanceReport, generatePerformanceChart } from '../services/DMApi';
import { showSuccessNotification, showErrorNotification } from '../utils/notificationService';
import DatePicker from '../components/calendar/Datepicker';

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  indigo: '#6366f1',
  emerald: '#10b981'
};

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

const formatDateTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day}/${year} ${hours}:${minutes}`;
};

const StatCard = ({ title, value, subtitle, icon: Icon, color, isLoading }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`text-${color}-500`} size={18} />
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</p>
        </div>
        {isLoading ? (
          <div className="h-8 w-24 bg-gray-100 animate-pulse rounded"></div>
        ) : (
          <>
            <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </>
        )}
      </div>
    </div>
  </div>
);

const PerformanceInsightCard = ({ insights, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-blue-200 rounded w-1/2"></div>
          <div className="h-3 bg-blue-200 rounded"></div>
          <div className="h-3 bg-blue-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-5">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
          <Zap className="text-blue-600" size={20} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-2">AI-Powered Insights</h4>
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className={`flex-shrink-0 mt-0.5 ${
                  insight.type === 'success' ? 'text-green-600' : 
                  insight.type === 'warning' ? 'text-yellow-600' : 
                  'text-blue-600'
                }`}>
                  {insight.type === 'success' ? <CheckCircle2 size={14} /> : 
                   insight.type === 'warning' ? <AlertTriangle size={14} /> : 
                   <AlertCircle size={14} />}
                </div>
                <p className="text-sm text-gray-700">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AIPerformanceAnalysis = ({ user, rank, totalUsers, dateRange }) => {
  const successRate = parseFloat(((user.eligible / user.totalTasks) * 100).toFixed(1));
  const responseRate = parseFloat((((user.invited + user.changedMind + user.noResponse) / user.totalTasks) * 100).toFixed(1));
  const conversionRate = user.invited > 0 ? parseFloat(((user.eligible / user.invited) * 100).toFixed(1)) : 0;
  
  const analysis = useMemo(() => {
    const insights = {
      performanceLevel: '',
      rootCauses: [],
      strengths: [],
      weaknesses: [],
      recommendations: [],
      challenges: [],
      appreciation: [],
      managementActions: [],
      guidance: [],
      methodology: []
    };

    if (successRate >= 70) {
      insights.performanceLevel = 'Exceptional';
      insights.appreciation.push(`Outstanding ${successRate}% success rate demonstrates exceptional task execution capabilities`);
      insights.strengths.push('Consistently high conversion rate', 'Strong task completion discipline', 'Effective client engagement');
    } else if (successRate >= 50) {
      insights.performanceLevel = 'Good';
      insights.appreciation.push(`Solid ${successRate}% success rate shows reliable performance`);
      insights.strengths.push('Steady task management', 'Reliable output quality');
    } else if (successRate >= 30) {
      insights.performanceLevel = 'Fair';
      insights.weaknesses.push('Success rate below optimal threshold', 'Inconsistent conversion patterns');
    } else {
      insights.performanceLevel = 'Needs Improvement';
      insights.weaknesses.push('Low success rate requires immediate attention', 'High rejection rate affecting overall performance');
    }

    if (user.noResponse > user.invited) {
      insights.rootCauses.push('High no-response rate indicates potential communication gaps or timing issues');
      insights.recommendations.push('Implement multi-channel follow-up strategy', 'Optimize contact timing based on client availability patterns');
    }

    if (user.changedMind > user.eligible) {
      insights.rootCauses.push('High changed-mind rate suggests initial qualification or expectation management issues');
      insights.recommendations.push('Strengthen initial screening process', 'Improve project briefing and expectation setting');
    }

    if (user.totalTasks < totalUsers * 0.5) {
      insights.rootCauses.push('Below-average task volume may indicate workload distribution or capacity issues');
      insights.recommendations.push('Review task allocation process', 'Assess if additional training or resources are needed');
    }

    if (responseRate > 60) {
      insights.strengths.push('Excellent response engagement rate');
      insights.appreciation.push('Strong client communication and follow-up discipline');
    }

    if (conversionRate > 70 && user.invited > 5) {
      insights.strengths.push('High invited-to-eligible conversion demonstrates quality screening');
      insights.appreciation.push('Effective qualification and selection process');
    }

    if (user.projects.length > 2) {
      insights.strengths.push('Multi-project handling capability');
    }

    if (responseRate < 40) {
      insights.weaknesses.push('Low response rate affecting pipeline efficiency');
      insights.recommendations.push('Implement response tracking system', 'Review communication strategy and templates');
    }

    if (conversionRate < 50 && user.invited > 5) {
      insights.weaknesses.push('Low conversion rate from invited to eligible');
      insights.recommendations.push('Refine candidate screening criteria', 'Enhance qualification questions');
    }

    if (rank <= 3) {
      insights.challenges.push(`Maintain top ${rank} position in selected period`, 'Mentor team members to elevate overall performance');
    } else if (rank <= Math.ceil(totalUsers * 0.3)) {
      insights.challenges.push(`Move into top 3 rankings within next period`, `Increase success rate by 10-15% through process optimization`);
    } else {
      insights.challenges.push(`Achieve 20% improvement in success rate`, `Reduce no-response rate by implementing structured follow-up system`);
    }

    if (successRate >= 70 && user.totalTasks > totalUsers * 0.8) {
      insights.managementActions.push('Consider for team lead or mentorship role', 'Candidate for advanced project assignments', 'Recognition program nomination');
    } else if (successRate >= 50) {
      insights.managementActions.push('Provide advanced training opportunities', 'Assign to diverse projects for skill expansion');
    } else {
      insights.managementActions.push('Immediate performance improvement plan required', 'Assign dedicated mentor or coach', 'Weekly performance review meetings');
    }

    if (successRate < 50) {
      insights.guidance.push('Schedule one-on-one coaching sessions focusing on qualification techniques', 'Shadow top performers to learn best practices', 'Access to communication skills workshop');
    }

    if (user.noResponse > user.totalTasks * 0.4) {
      insights.guidance.push('Training on effective follow-up strategies', 'Implement CRM tools for automated reminders', 'Time management workshop');
    }

    insights.guidance.push('Regular feedback sessions to discuss progress and blockers', 'Goal-setting workshop for personal KPI development');

    insights.methodology.push(
      'KPI Tracking: Success rate, response rate, conversion rate analysis',
      'Behavior Analysis: Communication patterns and follow-up consistency',
      'Trend Correlation: Performance trends vs. period and project complexity',
      'Comparative Benchmarking: Performance relative to team average and top performers',
      'Predictive Modeling: AI-based forecast of future performance trajectory'
    );

    return insights;
  }, [user, rank, totalUsers, successRate, responseRate, conversionRate]);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 bg-indigo-100 rounded-full p-2">
            <Zap className="text-indigo-600" size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">AI-Powered Performance Analysis</h4>
            <p className="text-xs text-gray-600">Comprehensive assessment based on multi-dimensional KPI analysis</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Target size={16} className="text-indigo-600" />
            Key Performance Indicators
          </h5>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Success Rate</p>
              <p className="text-lg font-bold text-indigo-600">{successRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Response Rate</p>
              <p className="text-lg font-bold text-blue-600">{responseRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Conversion Rate</p>
              <p className="text-lg font-bold text-purple-600">{conversionRate}%</p>
            </div>
          </div>
        </div>

        {analysis.rootCauses.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600" />
              Root Cause Analysis
            </h5>
            <ul className="space-y-1.5">
              {analysis.rootCauses.map((cause, idx) => (
                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">▸</span>
                  <span>{cause}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {analysis.strengths.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600" />
                Strengths
              </h5>
              <ul className="space-y-1.5">
                {analysis.strengths.map((strength, idx) => (
                  <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.weaknesses.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600" />
                Areas for Improvement
              </h5>
              <ul className="space-y-1.5">
                {analysis.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">⚠</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {analysis.recommendations.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Target size={16} className="text-blue-600" />
              Strategic Recommendations
            </h5>
            <ul className="space-y-1.5">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.challenges.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-600" />
              Performance Challenges
            </h5>
            <ul className="space-y-1.5">
              {analysis.challenges.map((challenge, idx) => (
                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">◆</span>
                  <span>{challenge}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.appreciation.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-emerald-200">
            <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Award size={16} className="text-emerald-600" />
              Recognition & Appreciation
            </h5>
            <ul className="space-y-1.5">
              {analysis.appreciation.map((item, idx) => (
                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">★</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.managementActions.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-indigo-200">
            <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Users size={16} className="text-indigo-600" />
              Management Decision Support
            </h5>
            <ul className="space-y-1.5">
              {analysis.managementActions.map((action, idx) => (
                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                  <span className="text-indigo-500 mt-0.5">▶</span>
                  <span className="font-medium">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.guidance.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-cyan-200">
            <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <User size={16} className="text-cyan-600" />
              Personal Development Guidance
            </h5>
            <ul className="space-y-1.5">
              {analysis.guidance.map((guide, idx) => (
                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                  <span className="text-cyan-500 mt-0.5">◉</span>
                  <span>{guide}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-300">
          <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Activity size={14} className="text-gray-600" />
            Analysis Methodology
          </h5>
          <ul className="space-y-1">
            {analysis.methodology.map((method, idx) => (
              <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>{method}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const UserPerformanceTable = ({ data, dateRange, isLoading }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'totalTasks', direction: 'desc' });
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [showAIAnalysisId, setShowAIAnalysisId] = useState(null);

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key] || 0;
      const bVal = b[sortConfig.key] || 0;
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [data, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getSuccessRate = (eligible, total) => {
    if (total === 0) return 0;
    return ((eligible / total) * 100).toFixed(1);
  };

  const getRank = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return index + 1;
  };

  const getPerformanceStatus = (user) => {
    const successRate = parseFloat(getSuccessRate(user.eligible, user.totalTasks));
    if (successRate >= 70) return { label: 'Excellent', color: 'green' };
    if (successRate >= 50) return { label: 'Good', color: 'blue' };
    if (successRate >= 30) return { label: 'Fair', color: 'yellow' };
    return { label: 'Needs Improvement', color: 'red' };
  };

  const handleShowDetails = useCallback((userName) => {
    setExpandedUserId(prev => prev === userName ? null : userName);
  }, []);

  const handleShowAIAnalysis = useCallback((userName) => {
    setShowAIAnalysisId(prev => prev === userName ? null : userName);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
        <Users className="mx-auto text-gray-400 mb-3" size={48} />
        <p className="text-gray-600">No performance data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('totalTasks')}>
                <div className="flex items-center gap-1">
                  Total Tasks
                  {sortConfig.key === 'totalTasks' && (
                    sortConfig.direction === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('eligible')}>
                <div className="flex items-center gap-1">
                  Eligible
                  {sortConfig.key === 'eligible' && (
                    sortConfig.direction === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Success Rate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Performance</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sortedData.map((user, index) => {
              const status = getPerformanceStatus(user);
              const successRate = getSuccessRate(user.eligible, user.totalTasks);
              const isExpanded = expandedUserId === user.userName;
              const showAIAnalysis = showAIAnalysisId === user.userName;
              
              return (
                <React.Fragment key={user.userName}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-700">{getRank(index)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-9 w-9 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-700 font-semibold text-sm">{user.userName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                          <div className="text-xs text-gray-500">{user.projects.length} project(s)</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-lg font-bold text-gray-900">{user.totalTasks}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                          {user.eligible}
                        </span>
                        <span className="px-2.5 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                          {user.notEligible}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              successRate >= 70 ? 'bg-green-500' : 
                              successRate >= 50 ? 'bg-blue-500' : 
                              successRate >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${successRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{successRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full bg-${status.color}-100 text-${status.color}-800`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowDetails(user.userName)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="Details"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <button
                          onClick={() => handleShowAIAnalysis(user.userName)}
                          className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors flex items-center gap-1"
                          title="AI Analysis"
                        >
                          <Zap size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr>
                      <td colSpan="7" className="px-4 py-4 bg-gray-50">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600 uppercase font-medium mb-3">Contact Information</p>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">User Name:</span>
                                <span className="text-sm font-semibold text-gray-900">{user.userName}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">Total Tasks:</span>
                                <span className="text-sm font-semibold text-blue-600">{user.totalTasks}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">Rank:</span>
                                <span className="text-sm font-semibold text-gray-600">{getRank(index)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600 uppercase font-medium mb-3">Reply Record Breakdown</p>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">Invited:</span>
                                <span className="text-sm font-semibold text-green-600">{user.invited}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">Changed Mind:</span>
                                <span className="text-sm font-semibold text-yellow-600">{user.changedMind}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">No Response:</span>
                                <span className="text-sm font-semibold text-gray-600">{user.noResponse}</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600 uppercase font-medium mb-3">Status & Performance</p>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">Eligible:</span>
                                <span className="text-sm font-semibold text-green-600">{user.eligible}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">Not Eligible:</span>
                                <span className="text-sm font-semibold text-red-600">{user.notEligible}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">Success Rate:</span>
                                <span className="text-sm font-semibold text-blue-600">{successRate}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600 uppercase font-medium mb-2">Projects ({user.projects.length})</p>
                            <div className="flex flex-wrap gap-1.5">
                              {user.projects.map((project, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium">
                                  {project}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600 uppercase font-medium mb-2">Cities ({user.cities.length})</p>
                            <div className="flex flex-wrap gap-1.5">
                              {user.cities.map((city, idx) => (
                                <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md font-medium">
                                  {city}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {showAIAnalysis && (
                    <tr>
                      <td colSpan="7" className="px-4 py-4 bg-gray-50">
                        <AIPerformanceAnalysis 
                          user={user} 
                          rank={index + 1} 
                          totalUsers={sortedData.length}
                          dateRange={dateRange}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const total = data.invited + data.changedMind + data.noResponse;
    const percentage = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : 0;
    
    return (
      <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-200">
        <p className="font-semibold text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-700 mt-1">
          Total: <span className="font-bold text-lg">{payload[0].value}</span>
        </p>
        <p className="text-xs text-gray-500">
          {percentage}% dari total responses
        </p>
      </div>
    );
  }
  return null;
};

export default function PerformanceAnalytics({ onRefreshData }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    eligible: 0,
    notEligible: 0,
    avgTasksPerUser: 0
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingChart, setIsGeneratingChart] = useState(false);
  const [datePickerKey, setDatePickerKey] = useState(0);

  const generateInsights = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) return [];

    const insights = [];
    const avgSuccessRate = summaryStats.total > 0 
      ? ((summaryStats.eligible / summaryStats.total) * 100).toFixed(1) 
      : 0;

    if (avgSuccessRate >= 70) {
      insights.push({
        type: 'success',
        message: `Excellent team performance with ${avgSuccessRate}% success rate`
      });
    } else if (avgSuccessRate < 50) {
      insights.push({
        type: 'warning',
        message: `Success rate is ${avgSuccessRate}%. Consider reviewing processes and training`
      });
    }

    const topPerformer = analyticsData[0];
    if (topPerformer) {
      insights.push({
        type: 'info',
        message: `${topPerformer.userName} leads with ${topPerformer.totalTasks} tasks completed`
      });
    }

    if (summaryStats.avgTasksPerUser < 10) {
      insights.push({
        type: 'warning',
        message: 'Low average tasks per user. Consider workload distribution'
      });
    }

    return insights;
  }, [analyticsData, summaryStats]);

  const replyRecordData = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) {
      return [];
    }

    const totals = {
      invited: 0,
      changedMind: 0,
      noResponse: 0
    };

    analyticsData.forEach(user => {
      totals.invited += user.invited || 0;
      totals.changedMind += user.changedMind || 0;
      totals.noResponse += user.noResponse || 0;
    });

    const total = totals.invited + totals.changedMind + totals.noResponse;

    return [
      { 
        name: 'Invited', 
        value: totals.invited, 
        color: COLORS.success,
        total,
        percentage: total > 0 ? ((totals.invited / total) * 100).toFixed(1) : 0,
        invited: totals.invited,
        changedMind: totals.changedMind,
        noResponse: totals.noResponse
      },
      { 
        name: 'Changed Mind', 
        value: totals.changedMind, 
        color: COLORS.warning,
        total,
        percentage: total > 0 ? ((totals.changedMind / total) * 100).toFixed(1) : 0,
        invited: totals.invited,
        changedMind: totals.changedMind,
        noResponse: totals.noResponse
      },
      { 
        name: 'No Response', 
        value: totals.noResponse, 
        color: COLORS.danger,
        total,
        percentage: total > 0 ? ((totals.noResponse / total) * 100).toFixed(1) : 0,
        invited: totals.invited,
        changedMind: totals.changedMind,
        noResponse: totals.noResponse
      }
    ];
  }, [analyticsData]);

  const totalResponses = useMemo(() => {
    return replyRecordData.reduce((sum, item) => sum + item.value, 0);
  }, [replyRecordData]);

  const responseRate = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) return 0;
    const totalTasks = analyticsData.reduce((sum, user) => sum + (user.totalTasks || 0), 0);
    return totalTasks > 0 ? ((totalResponses / totalTasks) * 100).toFixed(1) : 0;
  }, [analyticsData, totalResponses]);

  const inviteSuccessRate = useMemo(() => {
    const invited = replyRecordData.find(d => d.name === 'Invited');
    return invited && totalResponses > 0 
      ? ((invited.value / totalResponses) * 100).toFixed(1) 
      : 0;
  }, [replyRecordData, totalResponses]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (startDate && endDate) {
        params.startDate = startDate.toISOString();
        params.endDate = endDate.toISOString();
      }

      const result = await getPerformanceAnalytics(params);
      
      if (result.success) {
        setAnalyticsData(result.data || []);
        setSummaryStats(result.summary || {
          total: 0,
          eligible: 0,
          notEligible: 0,
          avgTasksPerUser: 0
        });
      }
    } catch (error) {
      showErrorNotification("Load Failed", `Failed to load analytics: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  const handleRefresh = useCallback(async () => {
    if (onRefreshData) {
      await onRefreshData();
    }
    await loadAnalytics();
  }, [onRefreshData, loadAnalytics]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const params = {};
      if (startDate && endDate) {
        params.startDate = startDate.toISOString();
        params.endDate = endDate.toISOString();
      }

      const blob = await exportPerformanceReport(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Performance_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccessNotification("Export Success", "Performance report exported successfully");
    } catch (error) {
      showErrorNotification("Export Failed", `Failed to export report: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  }, [startDate, endDate]);

  const handleGenerateChart = useCallback(async () => {
    setIsGeneratingChart(true);
    try {
      const params = {};
      if (startDate && endDate) {
        params.startDate = startDate.toISOString();
        params.endDate = endDate.toISOString();
      }

      const blob = await generatePerformanceChart(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Task_Performance_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccessNotification("Chart Generated", "Performance analytics chart generated successfully");
    } catch (error) {
      showErrorNotification("Chart Generation Failed", `Failed to generate chart: ${error.message}`);
    } finally {
      setIsGeneratingChart(false);
    }
  }, [startDate, endDate]);

  const handleDateRangeChange = useCallback((start, end) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const handleClearDateFilter = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
    setDatePickerKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const chartData = useMemo(() => {
    return analyticsData.slice(0, 10).map(user => ({
      name: user.userName.length > 10 ? user.userName.substring(0, 10) + '...' : user.userName,
      Eligible: user.eligible,
      'Not Eligible': user.notEligible,
      Total: user.totalTasks
    }));
  }, [analyticsData]);

  const pieChartData = useMemo(() => {
    return [
      { name: 'Eligible', value: summaryStats.eligible, color: COLORS.success },
      { name: 'Not Eligible', value: summaryStats.notEligible, color: COLORS.danger }
    ];
  }, [summaryStats]);

  const topPerformer = useMemo(() => {
    if (analyticsData.length === 0) return null;
    return analyticsData[0];
  }, [analyticsData]);

  const dateRangeDisplay = useMemo(() => {
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    return 'All Time';
  }, [startDate, endDate]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="text-blue-600" size={28} />
              Performance Analytics Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">Real-time performance monitoring and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={isExporting || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
            >
              {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              {isExporting ? 'Exporting...' : 'Export Report'}
            </button>
            <button
              onClick={handleGenerateChart}
              disabled={isGeneratingChart || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
            >
              {isGeneratingChart ? <Loader2 className="animate-spin" size={16} /> : <FileSpreadsheet size={16} />}
              {isGeneratingChart ? 'Generating...' : 'Export Chart'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
            >
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Calendar className="text-gray-500" size={20} />
              <span className="text-sm font-medium text-gray-700">Date Range:</span>
              <DatePicker 
                key={datePickerKey}
                onDateRangeChange={handleDateRangeChange}
                disabled={isLoading}
                resetTrigger={datePickerKey}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Showing: <span className="font-semibold text-gray-900">{dateRangeDisplay}</span>
              </span>
              {(startDate || endDate) && (
                <button
                  onClick={handleClearDateFilter}
                  disabled={isLoading}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Tasks"
            value={summaryStats.total || 0}
            subtitle={`${dateRangeDisplay}`}
            icon={BarChart3}
            color="blue"
            isLoading={isLoading}
          />
          <StatCard
            title="Eligible"
            value={summaryStats.eligible || 0}
            subtitle={`${((summaryStats.eligible / summaryStats.total) * 100 || 0).toFixed(1)}% success rate`}
            icon={CheckCircle2}
            color="green"
            isLoading={isLoading}
          />
          <StatCard
            title="Not Eligible"
            value={summaryStats.notEligible || 0}
            subtitle={`${((summaryStats.notEligible / summaryStats.total) * 100 || 0).toFixed(1)}% rejection rate`}
            icon={XCircle}
            color="red"
            isLoading={isLoading}
          />
          <StatCard
            title="Avg Tasks/User"
            value={summaryStats.avgTasksPerUser || 0}
            subtitle={`${analyticsData.length} active users`}
            icon={Users}
            color="purple"
            isLoading={isLoading}
          />
        </div>

        <PerformanceInsightCard insights={generateInsights} isLoading={isLoading} />

        {topPerformer && !isLoading && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1 flex items-center gap-2">
                  <Award size={16} />
                  Top Performer - {dateRangeDisplay}
                </p>
                <h2 className="text-2xl font-bold mb-2">{topPerformer.userName}</h2>
                <div className="flex items-center gap-6 text-sm">
                  <span className="flex items-center gap-1">
                    <Target size={14} />
                    {topPerformer.totalTasks} Tasks
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    {topPerformer.eligible} Eligible
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp size={14} />
                    {((topPerformer.eligible / topPerformer.totalTasks) * 100).toFixed(1)}% Success
                  </span>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                <Award size={40} />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="text-blue-600" size={18} />
              Performance Comparison
            </h3>
            {isLoading ? (
              <div className="flex justify-center items-center h-[280px]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Eligible" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Not Eligible" fill={COLORS.danger} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="text-green-600" size={18} />
              Overall Status Distribution
            </h3>
            {isLoading ? (
              <div className="flex justify-center items-center h-[280px]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="text-purple-600" size={18} />
              Reply Record Distribution
            </h3>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total Responses</p>
              <p className="text-2xl font-bold text-gray-900">{totalResponses}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 mb-4 border border-purple-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-purple-700 font-medium uppercase mb-1">Response Rate</p>
                <p className="text-2xl font-bold text-purple-900">{responseRate}%</p>
                <p className="text-xs text-purple-600 mt-1">dari total tasks</p>
              </div>
              <div>
                <p className="text-xs text-green-700 font-medium uppercase mb-1">Invite Success</p>
                <p className="text-2xl font-bold text-green-900">{inviteSuccessRate}%</p>
                <p className="text-xs text-green-600 mt-1">dari total responses</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-[280px]">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : replyRecordData.length > 0 && totalResponses > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart 
                  data={replyRecordData} 
                  layout="horizontal"
                  margin={{ top: 10, right: 40, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    domain={[0, 'dataMax + 5']}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    width={120}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={60}>
                    {replyRecordData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList 
                      dataKey="value" 
                      position="right"
                      style={{ fontSize: '13px', fontWeight: 'bold', fill: '#374151' }}
                      offset={10}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Detailed Breakdown</p>
                <div className="grid grid-cols-3 gap-3">
                  {replyRecordData.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border-2 border-gray-100 hover:border-gray-200 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{item.name}</span>
                        </div>
                      </div>
                      <p className="text-3xl font-bold mb-1" style={{ color: item.color }}>{item.value}</p>
                      <p className="text-xs text-gray-500">{item.percentage}% dari total</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-900 mb-2">Insights for Management:</p>
                  <ul className="space-y-1 text-xs text-blue-800">
                    {inviteSuccessRate >= 50 && (
                      <li>✓ Invite success rate {inviteSuccessRate}% menunjukkan kualifikasi kandidat yang baik</li>
                    )}
                    {inviteSuccessRate < 50 && (
                      <li>⚠ Invite success rate {inviteSuccessRate}% perlu ditingkatkan melalui better screening</li>
                    )}
                    {replyRecordData.find(d => d.name === 'No Response')?.percentage > 40 && (
                      <li>⚠ High no-response rate ({replyRecordData.find(d => d.name === 'No Response')?.percentage}%) - pertimbangkan follow-up strategy</li>
                    )}
                    {replyRecordData.find(d => d.name === 'Changed Mind')?.percentage > 20 && (
                      <li>⚠ Changed mind rate tinggi ({replyRecordData.find(d => d.name === 'Changed Mind')?.percentage}%) - review expectation management</li>
                    )}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-600">Tidak ada data reply record</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="text-blue-600" size={18} />
            Detailed User Performance
          </h3>
          <UserPerformanceTable 
            data={analyticsData} 
            dateRange={dateRangeDisplay} 
            isLoading={isLoading} 
          />
        </div>

        {!isLoading && analyticsData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="text-indigo-600" size={18} />
              Key Performance Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-600 font-medium uppercase mb-1">Highest Tasks</p>
                <p className="text-2xl font-bold text-blue-900">{Math.max(...analyticsData.map(u => u.totalTasks))}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs text-green-600 font-medium uppercase mb-1">Best Success Rate</p>
                <p className="text-2xl font-bold text-green-900">
                  {Math.max(...analyticsData.map(u => u.totalTasks > 0 ? (u.eligible / u.totalTasks * 100) : 0)).toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-xs text-purple-600 font-medium uppercase mb-1">Active Users</p>
                <p className="text-2xl font-bold text-purple-900">{analyticsData.length}</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <p className="text-xs text-yellow-600 font-medium uppercase mb-1">Avg Response Rate</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {analyticsData.length > 0
                    ? (analyticsData.reduce((sum, u) => sum + u.invited, 0) / analyticsData.reduce((sum, u) => sum + u.totalTasks, 0) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-gray-500 py-4">
          <p>Last updated: {formatDateTime(new Date())} | Data refreshes on filter change</p>
        </div>
      </div>
    </div>
  );
}