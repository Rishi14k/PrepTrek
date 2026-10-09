import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../api/client';
import Badge from '../components/common/Badge';
import ChartCard from '../components/common/ChartCard';
import toast from 'react-hot-toast';
import usePageSEO from '../hooks/usePageSEO';

const AnalyticsPage = () => {
  usePageSEO({
    title: 'Subject & Chapter Analytics | PrepTrack',
    description: 'Diagnose chapter accuracy, weak areas, and subject trends with deep visual analytics.',
    canonicalPath: '/analytics',
    noindex: true,
  });

  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let query = `sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (selectedSubject) query += `&subjectId=${selectedSubject}`;

      const [subRes, chapRes] = await Promise.all([
        api.get('/analytics/subjects?period=all'),
        api.get(`/analytics/chapters?${query}`),
      ]);

      if (subRes.data?.success) setSubjects(subRes.data.subjects || []);
      if (chapRes.data?.success) setChapters(chapRes.data.chapters || []);
    } catch (err) {
      toast.error('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedSubject, sortBy, sortOrder]);

  const handleSortToggle = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Chapter & Subject Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Detailed breakdown of your strengths, developing topics, and areas needing immediate revision
        </p>
      </div>

      {/* Subject Performance Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {subjects.map((sub) => (
          <div
            key={sub.subjectId}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {sub.name}
                </span>
                <Badge variant="teal">{sub.testCount} tests</Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Weighted Score:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {sub.weightedScorePercentage}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Accuracy:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {sub.accuracy !== null ? `${sub.accuracy}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Attempt Rate:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {sub.attemptRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Study Time:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {sub.studyHours} hrs
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedSubject(selectedSubject === sub.subjectId ? '' : sub.subjectId)}
              className={`mt-4 w-full py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedSubject === sub.subjectId
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {selectedSubject === sub.subjectId ? 'Showing Chapters' : 'Filter Chapters'}
            </button>
          </div>
        ))}
      </div>

      {/* Chapters Table Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Filter Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              <option value="">All Subjects ({chapters.length} Chapters)</option>
              {subjects.map((s) => (
                <option key={s.subjectId} value={s.subjectId}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Quick Sort:</span>
            <button
              onClick={() => handleSortToggle('score')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                sortBy === 'score'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}
            >
              Score %
            </button>
            <button
              onClick={() => handleSortToggle('accuracy')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                sortBy === 'accuracy'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}
            >
              Accuracy
            </button>
            <button
              onClick={() => handleSortToggle('tests')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                sortBy === 'tests'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}
            >
              Most Tested
            </button>
            <button
              onClick={() => handleSortToggle('neglected')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                sortBy === 'neglected'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}
            >
              Neglected
            </button>
          </div>
        </div>

        {/* Chapter Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-semibold">Chapter Name</th>
                  <th className="py-3 px-4 font-semibold">Subject</th>
                  <th className="py-3 px-4 font-semibold">Classification</th>
                  <th className="py-3 px-4 font-semibold">Tests Logged</th>
                  <th className="py-3 px-4 font-semibold">Score %</th>
                  <th className="py-3 px-4 font-semibold">Accuracy</th>
                  <th className="py-3 px-4 font-semibold">Trend</th>
                  <th className="py-3 px-4 font-semibold">Last Practiced</th>
                  <th className="py-3 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {chapters.map((chap) => (
                  <tr key={chap.chapterId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <Link
                        to={`/analytics/chapters/${chap.chapterId}`}
                        className="hover:text-indigo-600 transition"
                      >
                        {chap.chapterName}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{chap.subjectName}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${chap.classificationBadge}`}>
                        {chap.classificationLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {chap.testCount} tests ({chap.totalAttempted} att.)
                    </td>
                    <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {chap.testCount > 0 ? `${chap.weightedScorePercentage}%` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {chap.accuracy !== null ? `${chap.accuracy}%` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {chap.trend === 'improving' && (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> Improving
                        </span>
                      )}
                      {chap.trend === 'declining' && (
                        <span className="text-rose-500 font-semibold flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 rotate-180" /> -{chap.scoreDrop}% Drop
                        </span>
                      )}
                      {chap.trend === 'stable' && (
                        <span className="text-slate-400">Stable</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {chap.lastPracticedDate
                        ? new Date(chap.lastPracticedDate).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/analytics/chapters/${chap.chapterId}`}
                        className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                      >
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
