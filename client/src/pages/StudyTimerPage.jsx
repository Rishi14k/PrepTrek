import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Timer as TimerIcon,
  Flame,
  Target,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';
import usePageSEO from '../hooks/usePageSEO';

const StudyTimerPage = () => {
  const { user } = useAuth();

  usePageSEO({
    title: 'Focus Study Timer & Pomodoro | PrepTrack',
    description: 'Server-persisted focus timer and Pomodoro sessions for entrance examination preparation.',
    canonicalPath: '/study-timer',
    noindex: true,
  });

  // Active Session & Timer State
  const [activeSession, setActiveSession] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerMode, setTimerMode] = useState('standard'); // 'standard' or 'pomodoro'
  const [pomodoroPhase, setPomodoroPhase] = useState('focus'); // 'focus', 'short_break', 'long_break'
  const [targetFocusMinutes, setTargetFocusMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);

  // Form selections
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  // Stats
  const [todayStudySeconds, setTodayStudySeconds] = useState(0);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef(null);

  // 1. Fetch Subjects and check active session
  useEffect(() => {
    const initTimerPage = async () => {
      try {
        const [subRes, activeRes, sessionsRes] = await Promise.all([
          api.get('/subjects'),
          api.get('/study-sessions/active'),
          api.get('/study-sessions?limit=7'),
        ]);

        if (subRes.data?.success) setSubjects(subRes.data.subjects || []);
        if (sessionsRes.data?.success) {
          const sess = sessionsRes.data.sessions || [];
          setRecentSessions(sess);

          // Calculate today's study seconds
          const today = new Date().toISOString().split('T')[0];
          const todaySec = sess
            .filter((s) => new Date(s.startedAt).toISOString().split('T')[0] === today)
            .reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
          setTodayStudySeconds(todaySec);
        }

        // Restore active session if already running/paused
        if (activeRes.data?.activeSession) {
          const sess = activeRes.data.activeSession;
          setActiveSession(sess);
          setElapsedSeconds(sess.currentCalculatedDuration || 0);
          if (sess.subjectId?._id) setSelectedSubject(sess.subjectId._id);
          if (sess.chapterId?._id) setSelectedChapter(sess.chapterId._id);
          if (sess.sessionType) setTimerMode(sess.sessionType);
          if (sess.notes) setSessionNotes(sess.notes);
        }
      } catch (err) {
        toast.error('Failed to initialize study timer.');
      } finally {
        setLoading(false);
      }
    };
    initTimerPage();
  }, []);

  // Fetch chapters when subject changes
  useEffect(() => {
    if (!selectedSubject) {
      setChapters([]);
      return;
    }
    const fetchChapters = async () => {
      try {
        const res = await api.get(`/subjects/${selectedSubject}/chapters`);
        if (res.data?.success) setChapters(res.data.chapters || []);
      } catch (err) {}
    };
    fetchChapters();
  }, [selectedSubject]);

  // Local tick interval when session is 'running'
  useEffect(() => {
    if (activeSession && activeSession.status === 'running') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeSession?.status]);

  // Handle Start Session
  const handleStart = async () => {
    try {
      const res = await api.post('/study-sessions/start', {
        subjectId: selectedSubject || null,
        chapterId: selectedChapter || null,
        sessionType: timerMode,
        pomodoroPhase,
        notes: sessionNotes,
      });

      if (res.data?.success) {
        setActiveSession(res.data.session);
        setElapsedSeconds(0);
        toast.success('Study timer started!');
      }
    } catch (err) {
      toast.error(err.customMessage || 'Failed to start timer.');
    }
  };

  // Handle Pause Session
  const handlePause = async () => {
    if (!activeSession) return;
    try {
      const res = await api.post(`/study-sessions/${activeSession._id}/pause`);
      if (res.data?.success) {
        setActiveSession(res.data.session);
        toast('Timer paused', { icon: '⏸️' });
      }
    } catch (err) {
      toast.error('Failed to pause timer.');
    }
  };

  // Handle Resume Session
  const handleResume = async () => {
    if (!activeSession) return;
    try {
      const res = await api.post(`/study-sessions/${activeSession._id}/resume`);
      if (res.data?.success) {
        setActiveSession(res.data.session);
        toast.success('Timer resumed!');
      }
    } catch (err) {
      toast.error('Failed to resume timer.');
    }
  };

  // Handle Stop and Save Session
  const handleStop = async () => {
    if (!activeSession) return;
    try {
      const res = await api.post(`/study-sessions/${activeSession._id}/stop`, {
        notes: sessionNotes,
        subjectId: selectedSubject || null,
        chapterId: selectedChapter || null,
      });

      if (res.data?.success) {
        const durationSec = res.data.session?.durationSeconds || elapsedSeconds;
        setActiveSession(null);
        setElapsedSeconds(0);
        setSessionNotes('');
        setTodayStudySeconds((prev) => prev + durationSec);

        // Confetti celebration if focused > 15 minutes!
        if (durationSec >= 900) {
          confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
        }

        toast.success(`Session saved! Logged ${Math.round(durationSec / 60)} minutes.`);
        // Refresh recent sessions
        const rec = await api.get('/study-sessions?limit=7');
        if (rec.data?.success) setRecentSessions(rec.data.sessions || []);
      }
    } catch (err) {
      toast.error('Failed to save session.');
    }
  };

  // Handle Discard
  const handleDiscard = async () => {
    if (!activeSession) return;
    if (!window.confirm('Are you sure you want to discard this active study session?')) return;
    try {
      await api.post(`/study-sessions/${activeSession._id}/discard`);
      setActiveSession(null);
      setElapsedSeconds(0);
      toast('Session discarded', { icon: '🗑️' });
    } catch (err) {
      toast.error('Failed to discard session.');
    }
  };

  // Formatting helpers
  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const dailyGoalSeconds = user?.dailyStudyGoalSeconds || 7200; // 2 hours default
  const todayProgressPct = Math.min(
    100,
    Math.round(((todayStudySeconds + (activeSession?.status === 'running' ? elapsedSeconds : 0)) / dailyGoalSeconds) * 100)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Focus Study Timer
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Server-persisted sessions survive browser refreshes and prevent accidental double-counting
          </p>
        </div>

        <Link
          to="/study-history"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View Study History →
        </Link>
      </div>

      {/* Main Timer Display Card */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xl text-center relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Mode & Pomodoro Tabs */}
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-8 text-xs font-semibold">
          <button
            type="button"
            disabled={!!activeSession}
            onClick={() => setTimerMode('standard')}
            className={`px-4 py-2 rounded-lg transition ${
              timerMode === 'standard'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 disabled:opacity-50'
            }`}
          >
            Standard Stopwatch
          </button>
          <button
            type="button"
            disabled={!!activeSession}
            onClick={() => setTimerMode('pomodoro')}
            className={`px-4 py-2 rounded-lg transition ${
              timerMode === 'pomodoro'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 disabled:opacity-50'
            }`}
          >
            Pomodoro Focus
          </button>
        </div>

        {/* Large Digital Clock Display */}
        <div className="my-6">
          <span className="font-mono text-6xl sm:text-8xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-xs">
            {formatTime(elapsedSeconds)}
          </span>
          <div className="mt-3">
            {activeSession ? (
              <Badge variant={activeSession.status === 'running' ? 'success' : 'warning'}>
                {activeSession.status === 'running' ? '● RUNNING' : '❚❚ PAUSED'}
              </Badge>
            ) : (
              <Badge variant="default">READY TO FOCUS</Badge>
            )}
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {!activeSession ? (
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-600/25 transition active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Focus Session
            </button>
          ) : (
            <>
              {activeSession.status === 'running' ? (
                <button
                  onClick={handlePause}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  Pause
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Resume
                </button>
              )}

              <button
                onClick={handleStop}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
              >
                <Square className="w-5 h-5 fill-current" />
                Finish & Save
              </button>

              <button
                onClick={handleDiscard}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                title="Discard Session"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Session Metadata & Daily Goal Widget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject & Chapter Linkage Form */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Session Details & Tagging
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject (Optional)
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">General Focus / Mixed</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chapter / Topic (Optional)
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                disabled={!selectedSubject}
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Session Focus Note
              </label>
              <input
                type="text"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="e.g. Solving 25 questions on Time & Work"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Daily Study Goal & Streak Progress */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daily Study Goal</h3>
              </div>
              <Badge variant="primary">{todayProgressPct}% COMPLETED</Badge>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Today's Logged Focus:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {Math.round((todayStudySeconds + elapsedSeconds) / 60)} / {Math.round(dailyGoalSeconds / 60)} mins
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${todayProgressPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Active Daily Streak</p>
                <p className="text-slate-500">Every 30+ min study session keeps your streak alive.</p>
              </div>
            </div>
            <span className="text-lg font-black text-amber-500">Active 🔥</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyTimerPage;
