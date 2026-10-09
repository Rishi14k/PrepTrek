import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  Percent,
  Target,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../api/client';
import StatCard from '../components/common/StatCard';
import ChartCard from '../components/common/ChartCard';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';
import usePageSEO from '../hooks/usePageSEO';

const ReportsPage = () => {
  usePageSEO({
    title: 'Performance Reports & Comparative Analytics | PrepTrack',
    description: 'Generate, print, and export comprehensive mock exam scorecards and chapter mastery reports.',
    canonicalPath: '/reports',
    noindex: true,
  });

  const [period, setPeriod] = useState('30d');
  const [reportData, setReportData] = useState(null);
  const [subjectData, setSubjectData] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [overRes, subRes, chapRes] = await Promise.all([
        api.get(`/analytics/overview?period=${period}`),
        api.get(`/analytics/subjects?period=${period}`),
        api.get(`/analytics/chapters`),
      ]);

      if (overRes.data?.success) setReportData(overRes.data);
      if (subRes.data?.success) setSubjectData(subRes.data.subjects || []);
      if (chapRes.data?.success) setChapters(chapRes.data.chapters || []);
    } catch (err) {
      toast.error('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period]);

  const handleExportData = async () => {
    try {
      const res = await api.post('/users/me/export', {}, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preptrack_performance_export_${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Performance data exported!');
    } catch (err) {
      toast.error('Failed to export data.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = reportData?.summary || {};
  const comparisons = reportData?.comparisons || {};
  const testedChapters = chapters.filter((c) => c.testCount > 0);
  const strongChapters = testedChapters.filter((c) => c.classification === 'strong');
  const weakChapters = testedChapters.filter((c) => c.classification === 'needs_improvement');

  return (
    <div className="space-y-8 print:p-0 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80 print:border-b-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Performance Comparison & Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Comparative analysis versus preceding periods with plain-English summary narratives
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
          >
            <option value="7d">Last 7 Days vs Prior 7 Days</option>
            <option value="30d">Last 30 Days vs Prior 30 Days</option>
            <option value="90d">Last 90 Days vs Prior 90 Days</option>
            <option value="all">All Time Aggregate</option>
          </select>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>

          <button
            onClick={handleExportData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Plain English Narrative Summary Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Executive Performance Summary
        </h3>

        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          During the selected period ({period === '7d' ? 'last 7 days' : period === '30d' ? 'last 30 days' : period === '90d' ? 'last 90 days' : 'all recorded time'}),
          you recorded <strong className="text-indigo-600 dark:text-indigo-400">{summary.totalTests || 0} mock tests</strong>,
          attempting <strong className="text-slate-900 dark:text-white">{summary.totalAttemptedQuestions || 0} questions</strong>.
          Your marks-weighted score percentage achieved <strong className="text-indigo-600 dark:text-indigo-400">{summary.overallScorePercentage || 0}%</strong> with an overall accuracy of{' '}
          <strong className="text-emerald-600 dark:text-emerald-400">{summary.overallAccuracy !== null ? `${summary.overallAccuracy}%` : 'N/A'}</strong>.
        </p>

        {comparisons.scorePercentage?.hasHistoricalData && (
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {comparisons.scorePercentage.difference > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                ▲ Score improved by {comparisons.scorePercentage.difference} percentage points compared to the prior period.
              </span>
            ) : comparisons.scorePercentage.difference < 0 ? (
              <span className="text-rose-500 font-semibold">
                ▼ Score decreased by {Math.abs(comparisons.scorePercentage.difference)} percentage points compared to the prior period.
              </span>
            ) : (
              <span>Performance remained steady with 0.0 percentage point change.</span>
            )}
          </p>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Weighted Score"
          value={summary.overallScorePercentage}
          unit="%"
          icon={Percent}
          comparison={comparisons.scorePercentage}
        />
        <StatCard
          title="Accuracy"
          value={summary.overallAccuracy}
          unit="%"
          icon={Target}
          comparison={comparisons.accuracy}
        />
        <StatCard
          title="Study Hours"
          value={summary.totalStudyHours}
          unit="hrs"
          icon={Clock}
          comparison={comparisons.studyHours}
        />
        <StatCard
          title="Total Attempts"
          value={summary.totalAttemptedQuestions}
          icon={TrendingUp}
          comparison={comparisons.questions}
        />
      </div>

      {/* Subject Analysis Bar Graph */}
      <ChartCard
        title="Subject Scoring Distribution"
        subtitle="Comparing performance across core examination sections"
        empty={subjectData.every((s) => s.testCount === 0)}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={subjectData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
            <YAxis domain={[0, 100]} stroke="#888888" fontSize={11} tickLine={false} />
            <Tooltip />
            <Bar dataKey="weightedScorePercentage" name="Score %" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Strong vs Weak Summary Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card">
          <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-3">
            Mastered Chapters ({strongChapters.length})
          </h3>
          {strongChapters.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No chapters currently meet the 80%+ mastery threshold.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {strongChapters.map((c) => (
                <li key={c.chapterId} className="py-2 flex justify-between">
                  <span className="font-medium text-slate-900 dark:text-white">{c.chapterName}</span>
                  <span className="font-bold text-emerald-600">{c.weightedScorePercentage}% ({c.testCount} tests)</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card">
          <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-3">
            Priority Revision Chapters ({weakChapters.length})
          </h3>
          {weakChapters.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No chapters flagged as critically weak.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {weakChapters.map((c) => (
                <li key={c.chapterId} className="py-2 flex justify-between">
                  <span className="font-medium text-slate-900 dark:text-white">{c.chapterName}</span>
                  <span className="font-bold text-rose-500">{c.weightedScorePercentage}% ({c.testCount} tests)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
