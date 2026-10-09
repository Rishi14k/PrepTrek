import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  Plus,
  TrendingUp,
  FileCheck2,
  CalendarCheck,
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
} from 'recharts';
import api from '../api/client';
import Badge from '../components/common/Badge';
import ChartCard from '../components/common/ChartCard';
import toast from 'react-hot-toast';
import usePageSEO from '../hooks/usePageSEO';

const ChapterDetailPage = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  usePageSEO({
    title: data?.chapter?.name ? `${data.chapter.name} Analytics | PrepTrack` : 'Chapter Analytics | PrepTrack',
    description: 'Detailed accuracy trends, test history, and study log breakdown for this chapter.',
    canonicalPath: `/analytics/chapter/${chapterId}`,
    noindex: true,
  });

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const res = await api.get(`/analytics/chapters/${chapterId}`);
        if (res.data?.success) setData(res.data.chapter);
      } catch (err) {
        toast.error('Failed to load chapter analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchChapter();
  }, [chapterId]);

  const handleCreateRevisionTask = async () => {
    if (!data) return;
    try {
      await api.post('/study-tasks', {
        title: `Revision: ${data.name}`,
        description: `Targeted practice for ${data.name}. Solve targeted sets and review mistakes.`,
        subjectId: data.subject?._id,
        chapterId: data._id,
        priority: 'high',
        estimatedDurationSeconds: 2700,
        linkedRecommendationType: 'chapter_revision',
      });
      toast.success('Study task added to Revision Planner!');
      navigate('/study-planner');
    } catch (err) {
      toast.error('Failed to schedule revision task.');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading chapter analytics...</div>;
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Chapter not found.</p>
        <Link to="/analytics" className="text-indigo-600 hover:underline">
          Return to Analytics
        </Link>
      </div>
    );
  }

  const metrics = data.metrics || {};
  const classification = metrics.classification || {};
  const history = data.history || [];

  const chartData = history.map((h) => ({
    testName: h.testName,
    dateFormatted: new Date(h.testDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    scorePercentage: h.scorePercentage,
    accuracy: h.accuracy,
    marksObtained: h.marksObtained,
    maxMarks: h.maxMarks,
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <Link
            to="/analytics"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {data.name}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${classification.badgeClass}`}>
                {classification.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Subject: {data.subject?.name} • Evidence Threshold: {classification.reason}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCreateRevisionTask}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition"
          >
            <CalendarCheck className="w-4 h-4 text-indigo-600" />
            Schedule Revision Task
          </button>
          <Link
            to={`/tests/new?subjectId=${data.subject?._id}&chapterId=${data._id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Record Chapter Test
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card">
          <span className="text-xs text-slate-500 font-medium">Weighted Score</span>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {metrics.weightedScorePercentage}%
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card">
          <span className="text-xs text-slate-500 font-medium">Accuracy</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.overallAccuracy !== null ? `${metrics.overallAccuracy}%` : 'N/A'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card">
          <span className="text-xs text-slate-500 font-medium">Tests Recorded</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {metrics.totalTests} <span className="text-xs font-medium text-slate-400">({metrics.totalAttempted} att.)</span>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card">
          <span className="text-xs text-slate-500 font-medium">Study Time</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {metrics.studyHours} <span className="text-xs font-medium text-slate-400">hrs</span>
          </p>
        </div>
      </div>

      {/* Chapter Trend Chart */}
      <ChartCard
        title={`${data.name} - Score Trend`}
        subtitle="Chronological score percentage and accuracy progression"
        empty={history.length === 0}
        emptyMessage="No historical tests recorded for this chapter yet."
      >
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="dateFormatted" stroke="#888888" fontSize={11} tickLine={false} />
            <YAxis domain={[0, 100]} stroke="#888888" fontSize={11} tickLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">{d.testName}</p>
                      <p className="text-indigo-600 font-semibold">Score: {d.scorePercentage}% ({d.marksObtained}/{d.maxMarks})</p>
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
              dot={{ r: 4 }}
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

      {/* Historical Test Entries Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
          Recorded Test Attempts ({history.length})
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No test attempts logged for this chapter yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="pb-2.5 font-semibold">Test Name</th>
                  <th className="pb-2.5 font-semibold">Date</th>
                  <th className="pb-2.5 font-semibold">Questions</th>
                  <th className="pb-2.5 font-semibold">Score %</th>
                  <th className="pb-2.5 font-semibold">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-medium text-slate-900 dark:text-white">
                      <Link to={`/tests/${t._id}`} className="hover:text-indigo-600">
                        {t.testName}
                      </Link>
                    </td>
                    <td className="py-2.5 text-slate-500">
                      {new Date(t.testDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400">
                      {t.correctAnswers} / {t.attemptedQuestions} correct ({t.attemptedQuestions}/{t.totalQuestions} att.)
                    </td>
                    <td className="py-2.5 font-bold text-indigo-600 dark:text-indigo-400">
                      {t.scorePercentage}%
                    </td>
                    <td className="py-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                      {t.accuracy !== null ? `${t.accuracy}%` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterDetailPage;
