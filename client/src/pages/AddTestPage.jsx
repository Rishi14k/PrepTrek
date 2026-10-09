import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  FileCheck2,
  Layers,
  Calculator,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import usePageSEO from '../hooks/usePageSEO';

const AddTestPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get('subjectId') || '';
  const initialChapter = searchParams.get('chapterId') || '';

  usePageSEO({
    title: 'Log New Mock Test Result | PrepTrack',
    description: 'Record single chapter, sectional, or multi-subject full mock test results with automatic score calculation.',
    canonicalPath: '/tests/new',
    noindex: true,
  });

  const [mode, setMode] = useState('single'); // 'single' or 'multi'
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      testName: '',
      testDate: new Date().toISOString().split('T')[0],
      testType: 'chapter',
      subjectId: initialSubject,
      chapterId: initialChapter,
      totalQuestions: 25,
      attemptedQuestions: 20,
      correctAnswers: 16,
      incorrectAnswers: 4,
      unattemptedQuestions: 5,
      marksObtained: 28,
      maxMarks: 50,
      durationMinutes: 30,
      notes: '',
      breakdowns: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'breakdowns',
  });

  const watchSubject = watch('subjectId');
  const watchTotalQ = Number(watch('totalQuestions')) || 0;
  const watchAttQ = Number(watch('attemptedQuestions')) || 0;
  const watchCorr = Number(watch('correctAnswers')) || 0;
  const watchIncorr = Number(watch('incorrectAnswers')) || 0;
  const watchUnattQ = Number(watch('unattemptedQuestions')) || 0;
  const watchMarks = Number(watch('marksObtained')) || 0;
  const watchMaxMarks = Number(watch('maxMarks')) || 1;

  // Auto-fill unattempted questions when total or attempted changes
  useEffect(() => {
    if (watchTotalQ >= watchAttQ) {
      setValue('unattemptedQuestions', watchTotalQ - watchAttQ);
    }
  }, [watchTotalQ, watchAttQ, setValue]);

  // Auto-fill incorrect answers when attempted or correct changes
  useEffect(() => {
    if (watchAttQ >= watchCorr) {
      setValue('incorrectAnswers', watchAttQ - watchCorr);
    }
  }, [watchAttQ, watchCorr, setValue]);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/subjects');
        if (res.data?.success) setSubjects(res.data.subjects || []);
      } catch (err) {}
    };
    fetchSubjects();
  }, []);

  // Fetch chapters for selected subject
  useEffect(() => {
    if (!watchSubject) {
      setChapters([]);
      return;
    }
    const fetchChapters = async () => {
      try {
        const res = await api.get(`/subjects/${watchSubject}/chapters`);
        if (res.data?.success) setChapters(res.data.chapters || []);
      } catch (err) {}
    };
    fetchChapters();
  }, [watchSubject]);

  // Calculated Live Metrics
  const liveScorePercentage =
    watchMaxMarks > 0 ? Number(((watchMarks / watchMaxMarks) * 100).toFixed(1)) : 0;
  const liveAccuracy =
    watchAttQ > 0 ? Number(((watchCorr / watchAttQ) * 100).toFixed(1)) : null;
  const liveAttemptRate =
    watchTotalQ > 0 ? Number(((watchAttQ / watchTotalQ) * 100).toFixed(1)) : 0;

  // Invariant checks
  const isAttemptSumValid = watchAttQ === watchCorr + watchIncorr;
  const isTotalSumValid = watchTotalQ === watchAttQ + watchUnattQ;
  const isMarksValid = watchMarks <= watchMaxMarks;

  const onSubmit = async (data) => {
    if (!isAttemptSumValid) {
      return toast.error('Attempted questions must equal Correct + Incorrect answers.');
    }
    if (!isTotalSumValid) {
      return toast.error('Total questions must equal Attempted + Unattempted questions.');
    }
    if (!isMarksValid) {
      return toast.error('Marks obtained cannot exceed maximum marks.');
    }

    setLoading(true);
    try {
      const payload = {
        testName: data.testName,
        testDate: data.testDate,
        testType: mode === 'multi' ? 'full_mock' : data.testType,
        subjectId: mode === 'single' ? data.subjectId || null : null,
        chapterId: mode === 'single' ? data.chapterId || null : null,
        totalQuestions: Number(data.totalQuestions),
        attemptedQuestions: Number(data.attemptedQuestions),
        correctAnswers: Number(data.correctAnswers),
        incorrectAnswers: Number(data.incorrectAnswers),
        unattemptedQuestions: Number(data.unattemptedQuestions),
        marksObtained: Number(data.marksObtained),
        maxMarks: Number(data.maxMarks),
        durationSeconds: (Number(data.durationMinutes) || 0) * 60,
        notes: data.notes || '',
        breakdowns: mode === 'multi' ? data.breakdowns : [],
      };

      const res = await api.post('/tests', payload);
      if (res.data?.success) {
        toast.success('Mock test recorded successfully!');
        navigate('/tests');
      }
    } catch (err) {
      toast.error(err.customMessage || 'Failed to record test.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tests')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Record Test Result
            </h1>
            <p className="text-xs text-slate-500">
              Enter your entrance test marks with automatic validation and accuracy analytics
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              mode === 'single'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Single Chapter Test
          </button>
          <button
            type="button"
            onClick={() => setMode('multi')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              mode === 'multi'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Sectional / Full Mock
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Fields (2 cols) */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                1. General Test Details
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Test Name / Title *
                </label>
                <input
                  type="text"
                  {...register('testName', { required: 'Test name is required' })}
                  placeholder="e.g. Quants Speed Drill 04 or Mock Test A"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
                {errors.testName && (
                  <p className="text-xs text-rose-500 mt-1">{errors.testName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Test Date *
                  </label>
                  <input
                    type="date"
                    {...register('testDate', { required: true })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Test Type
                  </label>
                  <select
                    {...register('testType')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="chapter">Chapter Test</option>
                    <option value="sectional">Sectional Mock</option>
                    <option value="full_mock">Full Mock Paper</option>
                    <option value="previous_year">Previous Year Paper</option>
                  </select>
                </div>
              </div>

              {/* Subject & Chapter selector (Single mode) */}
              {mode === 'single' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Subject
                    </label>
                    <select
                      {...register('subjectId')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Chapter / Topic
                    </label>
                    <select
                      {...register('chapterId')}
                      disabled={!watchSubject}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <option value="">Select Chapter</option>
                      {chapters.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Overall Question & Marks Counts */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                2. Questions & Scoring Breakdown
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Questions *
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...register('totalQuestions', { required: true, valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Attempted *
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('attemptedQuestions', { required: true, valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unattempted
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('unattemptedQuestions', { valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correct Answers *
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('correctAnswers', { required: true, valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Incorrect Answers
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('incorrectAnswers', { valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('durationMinutes', { valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Marks Obtained *
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register('marksObtained', { required: true, valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Maximum Marks *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    {...register('maxMarks', { required: true, valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes & Analysis Comments
                </label>
                <textarea
                  rows={2}
                  {...register('notes')}
                  placeholder="e.g. High negative marking due to rushed guesses in the last 10 minutes..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Mode B: Sectional Breakdowns */}
            {mode === 'multi' && (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    3. Subject / Section Breakdowns (Optional)
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      append({
                        subjectId: subjects[0]?._id || '',
                        totalQuestions: 20,
                        attemptedQuestions: 15,
                        correctAnswers: 12,
                        incorrectAnswers: 3,
                        unattemptedQuestions: 5,
                        marksObtained: 20,
                        maxMarks: 40,
                      })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Section
                  </button>
                </div>

                {fields.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">
                    No section breakdown added. The parent summary above will be recorded.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field, idx) => (
                      <div
                        key={field.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Section #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-500">Subject</label>
                            <select
                              {...register(`breakdowns.${idx}.subjectId`)}
                              className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            >
                              {subjects.map((s) => (
                                <option key={s._id} value={s._id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500">Total Q</label>
                            <input
                              type="number"
                              {...register(`breakdowns.${idx}.totalQuestions`, { valueAsNumber: true })}
                              className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500">Attempted</label>
                            <input
                              type="number"
                              {...register(`breakdowns.${idx}.attemptedQuestions`, { valueAsNumber: true })}
                              className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500">Correct</label>
                            <input
                              type="number"
                              {...register(`breakdowns.${idx}.correctAnswers`, { valueAsNumber: true })}
                              className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/tests')}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isAttemptSumValid || !isTotalSumValid || !isMarksValid}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50"
              >
                {loading ? 'Saving Record...' : 'Save Test Result'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Calculation Preview Card (1 col) */}
        <div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card sticky top-24 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Calculator className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Calculation Preview
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-500">Calculated Score %</span>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {liveScorePercentage}%
                </p>
                <p className="text-[11px] text-slate-400">
                  {watchMarks} marks / {watchMaxMarks} maximum
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-500">Calculated Accuracy</span>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {liveAccuracy !== null ? `${liveAccuracy}%` : 'N/A'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {watchCorr} correct out of {watchAttQ} attempted
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-500">Question Attempt Rate</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {liveAttemptRate}%
                </p>
                <p className="text-[11px] text-slate-400">
                  {watchAttQ} attempted of {watchTotalQ} total questions
                </p>
              </div>
            </div>

            {/* Validation Invariants Checklist */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Mathematical Verification:
              </span>

              <div className="flex items-center gap-2">
                {isAttemptSumValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                )}
                <span className={isAttemptSumValid ? 'text-slate-600 dark:text-slate-400' : 'text-rose-500 font-semibold'}>
                  Attempted = Correct + Incorrect
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isTotalSumValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                )}
                <span className={isTotalSumValid ? 'text-slate-600 dark:text-slate-400' : 'text-rose-500 font-semibold'}>
                  Total = Attempted + Unattempted
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isMarksValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                )}
                <span className={isMarksValid ? 'text-slate-600 dark:text-slate-400' : 'text-rose-500 font-semibold'}>
                  Marks &le; Maximum Marks
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTestPage;
