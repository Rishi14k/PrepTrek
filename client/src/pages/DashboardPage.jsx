import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  HelpCircle,
  Percent,
  Target,
  Clock,
  Flame,
  TrendingUp,
  Plus,
  Play,
  ArrowRight,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import StatCard from '../components/common/StatCard';
import ChartCard from '../components/common/ChartCard';
import DateRangeFilter from '../components/common/DateRangeFilter';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';
import usePageSEO from '../hooks/usePageSEO';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  usePageSEO({
    title: 'Performance Dashboard | PrepTrack',
    description: 'Track your mock test scores, accuracy trends, study hours, and weak chapters.',
    canonicalPath: '/dashboard',
    noindex: true,
  });

  const [period, setPeriod] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);

  const [overviewData, setOverviewData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [chapterStats, setChapterStats] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      let query = `period=${period}`;
      if (period === 'custom' && customStart && customEnd) {
        query += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const [overviewRes, trendsRes, subjectsRes, chaptersRes, insightsRes] = await Promise.all([
        api.get(`/analytics/overview?${query}`),
        api.get(`/analytics/trends?${query}`),
        api.get(`/analytics/subjects?${query}`),
        api.get(`/analytics/chapters`),
        api.get(`/analytics/insights`),
      ]);

      if (overviewRes.data?.success) setOverviewData(overviewRes.data);
      if (trendsRes.data?.success) setTrendData(trendsRes.data.timeline || []);
      if (subjectsRes.data?.success) setSubjectData(subjectsRes.data.subjects || []);
      if (chaptersRes.data?.success) setChapterStats(chaptersRes.data.chapters || []);
      if (insightsRes.data?.success) setRecommendations(insightsRes.data.recommendations || []);
    } catch (err) {
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const handleCustomRange = (start, end) => {
    setCustomStart(start);
    setCustomEnd(end);
  };

  const handleCreateTaskFromRecommendation = async (rec) => {
    try {
      await api.post('/study-tasks', {
        title: rec.title,
        description: `${rec.observedEvidence} - ${rec.nextAction}`,
        subjectId: rec.subjectId,
        chapterId: rec.chapterId,
        priority: rec.priority,
        estimatedDurationSeconds: (rec.suggestedDurationMinutes || 45) * 60,
        linkedRecommendationType: rec.category,
      });
      toast.success('Recommendation added to Study Planner!');
    } catch (err) {
      toast.error('Failed to create study task.');
    }
  };

  const summary = overviewData?.summary || {};
  const comparisons = overviewData?.comparisons || {};
  const recentTests = overviewData?.recentActivity?.tests || [];
  const recentSessions = overviewData?.recentActivity?.sessions || [];

  // Filter strongest, weakest, and declining chapters
  const testedChapters = chapterStats.filter((c) => c.testCount > 0);
  const strongestChapters = [...testedChapters]
    .sort((a, b) => b.weightedScorePercentage - a.weightedScorePercentage)
    .slice(0, 3);
  const weakestChapters = [...testedChapters]
    .sort((a, b) => a.weightedScorePercentage - b.weightedScorePercentage)
    .slice(0, 3);
  const decliningChapters = testedChapters.filter((c) => c.trend === 'declining').slice(0, 3);

  const isNewStudent = !loading && summary.totalTests === 0;

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Today is{' '}
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}{' '}
            • Preparing for <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user?.targetExam}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter
            period={period}
            onPeriodChange={(p) => setPeriod(p)}
            customStart={customStart}
            customEnd={customEnd}
            onCustomRangeChange={handleCustomRange}
          />

          <Link
            to="/tests/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Record Test
          </Link>

          <Link
            to="/study-timer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition"
          >
            <Play className="w-4 h-4 text-indigo-600" />
            Study Timer
          </Link>
        </div>
      </div>

      {/* Onboarding Checklist for Brand New Aspirants */}
      {isNewStudent && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-teal-500/10 border border-indigo-200 dark:border-indigo-900">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-indigo-600 text-white shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-3 flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Welcome to PrepTrack! Complete Your Onboarding Checklist
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                You haven't recorded any mock tests yet. Log your first test or import existing scores
                from CSV to unlock personalized weak-area detection and study recommendations.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <Link
                  to="/tests/new"
                  className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition shadow-xs text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  1. Record your first mock test
                </Link>
                <Link
                  to="/study-timer"
                  className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition shadow-xs text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  2. Start a 25-min study timer
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition shadow-xs text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  3. Set target examination date
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8 Primary Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tests Recorded"
          value={summary.totalTests}
          icon={FileCheck2}
          color="indigo"
          comparison={comparisons.tests}
          loading={loading}
        />
        <StatCard
          title="Questions Attempted"
          value={summary.totalAttemptedQuestions}
          icon={HelpCircle}
          color="violet"
          comparison={comparisons.questions}
          loading={loading}
        />
        <StatCard
          title="Weighted Score %"
          value={summary.overallScorePercentage}
          unit="%"
          icon={Percent}
          color="emerald"
          comparison={comparisons.scorePercentage}
          loading={loading}
        />
        <StatCard
          title="Overall Accuracy"
          value={summary.overallAccuracy}
          unit="%"
          icon={Target}
          color="teal"
          comparison={comparisons.accuracy}
          loading={loading}
        />
        <StatCard
          title="Total Study Hours"
          value={summary.totalStudyHours}
          unit="hrs"
          icon={Clock}
          color="blue"
          comparison={comparisons.studyHours}
          loading={loading}
        />
        <StatCard
          title="Avg Session Length"
          value={summary.avgSessionMinutes}
          unit="mins"
          icon={Clock}
          color="indigo"
          comparison={comparisons.avgSessionMinutes}
          loading={loading}
        />
        <StatCard
          title="Current Study Streak"
          value={summary.currentStreak}
          unit="days"
          icon={Flame}
          color="amber"
          subtitle={summary.currentStreak > 0 ? 'Consistent practice daily' : 'Start a session today!'}
          loading={loading}
        />
        <StatCard
          title="Question Attempt Rate"
          value={summary.attemptRate}
          unit="%"
          icon={TrendingUp}
          color="violet"
          subtitle="Proportion of total questions attempted"
          loading={loading}
        />
      </div>

      {/* Charts Section: Performance Over Time & Subject Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Timeline (2 cols) */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Performance Over Time"
            subtitle="Score percentage and accuracy across recorded mock tests"
            empty={trendData.length === 0}
            emptyMessage="No tests recorded in this date range. Record a mock test to view your timeline."
            loading={loading}
            actions={
              <Link
                to="/analytics"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Deep Analytics <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="dateFormatted" stroke="#888888" fontSize={12} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#888888" fontSize={12} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white">{d.testName}</p>
                          <p className="text-slate-500">{new Date(d.testDate).toLocaleDateString()} • {d.subjectName}</p>
                          <p className="text-indigo-600 font-semibold">Score: {d.scorePercentage}% ({d.marksObtained}/{d.maxMarks} marks)</p>
                          <p className="text-emerald-600 font-semibold">Accuracy: {d.accuracy !== null ? `${d.accuracy}%` : 'N/A'}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="scorePercentage"
                  name="Score %"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 1.5 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  name="Accuracy %"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Subject Comparison Bar Chart (1 col) */}
        <div>
          <ChartCard
            title="Subject Comparison"
            subtitle="Weighted score % by core subject"
            empty={subjectData.every((s) => s.testCount === 0)}
            emptyMessage="No tests logged for subjects yet."
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} interval={0} />
                <YAxis domain={[0, 100]} stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white">{d.name}</p>
                          <p className="text-indigo-600 font-semibold">Score: {d.weightedScorePercentage}%</p>
                          <p className="text-emerald-600">Accuracy: {d.accuracy !== null ? `${d.accuracy}%` : 'N/A'}</p>
                          <p className="text-slate-500">Tests: {d.testCount} • Study: {d.studyHours}h</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="weightedScorePercentage" name="Score %" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Chapter Performance Breakdown: Strongest vs Weakest & Declining */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strongest Chapters */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Strongest Chapters</h3>
              <p className="text-[11px] text-slate-500">High mastery and consistent test scores</p>
            </div>
          </div>

          {strongestChapters.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Record tests across multiple chapters to identify strengths.</p>
          ) : (
            <div className="space-y-3">
              {strongestChapters.map((chap) => (
                <Link
                  key={chap.chapterId}
                  to={`/analytics/chapters/${chap.chapterId}`}
                  className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{chap.chapterName}</p>
                      <p className="text-[11px] text-slate-500">{chap.subjectName} • {chap.testCount} tests</p>
                    </div>
                    <Badge variant="success">{chap.weightedScorePercentage}%</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Chapters Needing Attention */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Weakest Chapters</h3>
              <p className="text-[11px] text-slate-500">Score &lt;60% across recorded mock attempts</p>
            </div>
          </div>

          {weakestChapters.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No weak chapters flagged.</p>
          ) : (
            <div className="space-y-3">
              {weakestChapters.map((chap) => (
                <Link
                  key={chap.chapterId}
                  to={`/analytics/chapters/${chap.chapterId}`}
                  className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{chap.chapterName}</p>
                      <p className="text-[11px] text-slate-500">{chap.subjectName} • {chap.testCount} tests</p>
                    </div>
                    <Badge variant="danger">{chap.weightedScorePercentage}%</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Chapters With Declining Performance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <TrendingUp className="w-4 h-4 rotate-180" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Declining Trend</h3>
              <p className="text-[11px] text-slate-500">Recent mock scores fell vs earlier tests</p>
            </div>
          </div>

          {decliningChapters.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No chapters currently showing a declining trajectory.</p>
          ) : (
            <div className="space-y-3">
              {decliningChapters.map((chap) => (
                <Link
                  key={chap.chapterId}
                  to={`/analytics/chapters/${chap.chapterId}`}
                  className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{chap.chapterName}</p>
                      <p className="text-[11px] text-rose-500">Dropped {chap.scoreDrop}% in recent tests</p>
                    </div>
                    <Badge variant="warning">Declining</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Personalized Next-Action Recommendations */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Personalized Recommendations
              </h2>
              <p className="text-xs text-slate-500">
                Data-driven study suggestions generated from your real examination attempts
              </p>
            </div>
          </div>
          <Link
            to="/study-planner"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Open Study Planner <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recommendations.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            Log tests to unlock customized study advice based on your accuracy and attempt patterns.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <Badge variant={rec.priority === 'high' ? 'danger' : 'warning'}>
                      {rec.priority.toUpperCase()} PRIORITY
                    </Badge>
                    {rec.chapterName && (
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[140px]">
                        {rec.chapterName}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{rec.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Evidence: </span>
                    {rec.observedEvidence}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Why it matters: </span>
                    {rec.whyItMatters}
                  </p>
                  <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-800 dark:text-indigo-300">
                    <span className="font-semibold">Next Step: </span>
                    {rec.nextAction}
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCreateTaskFromRecommendation(rec)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition"
                  >
                    + Add to Planner
                  </button>
                  {rec.chapterId && (
                    <Link
                      to={`/analytics/chapters/${rec.chapterId}`}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Chapter Analytics →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity Table & Recent Study Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tests */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Test Records</h3>
            <Link to="/tests" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              View All Tests
            </Link>
          </div>

          {recentTests.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No test records saved yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="pb-2.5 font-semibold">Test Name</th>
                    <th className="pb-2.5 font-semibold">Date</th>
                    <th className="pb-2.5 font-semibold">Score %</th>
                    <th className="pb-2.5 font-semibold">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recentTests.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-medium text-slate-900 dark:text-white">
                        <Link to={`/tests/${t._id}`} className="hover:text-indigo-600">
                          {t.testName}
                        </Link>
                      </td>
                      <td className="py-2.5 text-slate-500">
                        {new Date(t.testDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 font-semibold text-indigo-600 dark:text-indigo-400">
                        {t.scorePercentage}%
                      </td>
                      <td className="py-2.5 font-semibold text-emerald-600 dark:text-emerald-400">
                        {t.accuracy !== null ? `${t.accuracy}%` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Study Sessions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Study Sessions</h3>
            <Link to="/study-history" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              View All Sessions
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No completed study sessions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="pb-2.5 font-semibold">Date</th>
                    <th className="pb-2.5 font-semibold">Subject</th>
                    <th className="pb-2.5 font-semibold">Duration</th>
                    <th className="pb-2.5 font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recentSessions.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 text-slate-500">
                        {new Date(s.startedAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 font-medium text-slate-900 dark:text-white">
                        {s.subjectId?.name || 'General Focus'}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                        {Math.floor((s.durationSeconds || 0) / 60)} mins
                      </td>
                      <td className="py-2.5">
                        <Badge variant="teal">{s.sessionType}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
