import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Target, Percent, Trash2, Edit } from 'lucide-react';
import api from '../api/client';
import Badge from '../components/common/Badge';
import { ConfirmationDialog } from '../components/common/FeedbackComponents';
import toast from 'react-hot-toast';
import usePageSEO from '../hooks/usePageSEO';

const TestDetailPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  usePageSEO({
    title: test?.testName ? `${test.testName} | Test Scorecard` : 'Mock Test Scorecard | PrepTrack',
    description: 'Detailed section marks, accuracy breakdown, and error analysis for this mock exam.',
    canonicalPath: `/tests/${testId}`,
    noindex: true,
  });

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await api.get(`/tests/${testId}`);
        if (res.data?.success) setTest(res.data.test);
      } catch (err) {
        toast.error('Failed to load test details.');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [testId]);

  const handleDelete = async () => {
    try {
      await api.delete(`/tests/${testId}`);
      toast.success('Test record deleted.');
      navigate('/tests');
    } catch (err) {
      toast.error('Failed to delete test.');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading test record...</div>;
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Test record not found or access denied.</p>
        <Link to="/tests" className="text-indigo-600 hover:underline">
          Return to Test Records
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <Link
            to="/tests"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {test.testName}
              </h1>
              <Badge variant="teal">{test.testType}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Logged on {new Date(test.testDate).toLocaleDateString()} • {test.subjectId?.name || 'Multi-Subject'}
              {test.chapterId && ` > ${test.chapterId.name}`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDeleting(true)}
          className="p-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 transition"
          title="Delete Test"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Score KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card">
          <span className="text-xs text-slate-500 font-medium">Marks Obtained</span>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {test.marksObtained} <span className="text-sm font-medium text-slate-400">/ {test.maxMarks}</span>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card">
          <span className="text-xs text-slate-500 font-medium">Score Percentage</span>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {test.scorePercentage}%
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card">
          <span className="text-xs text-slate-500 font-medium">Accuracy</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {test.accuracy !== null ? `${test.accuracy}%` : 'N/A'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card">
          <span className="text-xs text-slate-500 font-medium">Time Taken</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {Math.floor((test.durationSeconds || 0) / 60)} <span className="text-sm font-medium text-slate-400">mins</span>
          </p>
        </div>
      </div>

      {/* Question Statistics Grid */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
          Question Performance Analysis
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-xs text-slate-500">Total Questions</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{test.totalQuestions}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-xs text-slate-500">Attempted</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{test.attemptedQuestions}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
            <span className="text-xs text-emerald-700 dark:text-emerald-300">Correct Answers</span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{test.correctAnswers}</p>
          </div>
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40">
            <span className="text-xs text-rose-700 dark:text-rose-300">Incorrect Answers</span>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">{test.incorrectAnswers}</p>
          </div>
        </div>

        {test.notes && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
            <span className="font-semibold block mb-1">Student Notes:</span>
            {test.notes}
          </div>
        )}
      </div>

      {/* Breakdowns if present */}
      {test.breakdowns && test.breakdowns.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Section / Chapter Breakdowns
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="pb-2 font-semibold">Subject</th>
                  <th className="pb-2 font-semibold">Total Q</th>
                  <th className="pb-2 font-semibold">Attempted</th>
                  <th className="pb-2 font-semibold">Correct</th>
                  <th className="pb-2 font-semibold">Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {test.breakdowns.map((b, i) => (
                  <tr key={i}>
                    <td className="py-2.5 font-medium">{b.subjectId?.name || 'Section'}</td>
                    <td className="py-2.5">{b.totalQuestions}</td>
                    <td className="py-2.5">{b.attemptedQuestions}</td>
                    <td className="py-2.5 font-semibold text-emerald-600">{b.correctAnswers}</td>
                    <td className="py-2.5 font-semibold text-indigo-600">{b.marksObtained} / {b.maxMarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={isDeleting}
        title="Delete Test Record"
        message="Are you sure you want to delete this test? This action cannot be undone."
        confirmLabel="Delete"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleting(false)}
      />
    </div>
  );
};

export default TestDetailPage;
