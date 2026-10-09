import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Flame,
  Clock,
  TrendingUp,
  Percent,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';
import usePageSEO from '../hooks/usePageSEO';

const LeaderboardPage = () => {
  const { user, refreshUser } = useAuth();

  usePageSEO({
    title: 'Student Leaderboard & Rankings | PrepTrack',
    description: 'Compare weekly study hours, test consistency, and mock exam accuracy with peer aspirants.',
    canonicalPath: '/leaderboard',
    noindex: true,
  });

  const [category, setCategory] = useState('weekly_study');
  const [leaderboard, setLeaderboard] = useState([]);
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leaderboard?category=${category}`);
      if (res.data?.success) {
        setLeaderboard(res.data.leaderboard || []);
        setIsOptedIn(res.data.isCurrentUserOptedIn);
      }
    } catch (err) {
      toast.error('Failed to load leaderboard rankings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setIsOptedIn(!!user.leaderboardOptIn);
      setDisplayName(user.displayName || user.name.split(' ')[0]);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaderboard();
  }, [category]);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPreferences(true);
    try {
      const res = await api.patch('/leaderboard/preferences', {
        leaderboardOptIn: isOptedIn,
        displayName,
      });
      if (res.data?.success) {
        toast.success(
          isOptedIn
            ? 'You are now participating in the community leaderboard!'
            : 'Left the leaderboard. Your rank has been withdrawn.'
        );
        refreshUser();
        fetchLeaderboard();
      }
    } catch (err) {
      toast.error('Failed to update leaderboard settings.');
    } finally {
      setSavingPreferences(false);
    }
  };

  const categories = [
    { id: 'weekly_study', label: 'Weekly Study Time', icon: Clock },
    { id: 'monthly_study', label: 'Monthly Study Time', icon: Clock },
    { id: 'weekly_score', label: 'Weekly Test Scores', icon: Percent },
    { id: 'monthly_score', label: 'Monthly Test Scores', icon: Percent },
    { id: 'consistency', label: 'Consistency (Active Days)', icon: Flame },
    { id: 'improvement', label: 'Overall Improvement', icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Student Leaderboard & Rankings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Compare your preparation effort and test performance anonymously with fellow aspirants
        </p>
      </div>

      {/* Privacy Safeguard & Opt-In Setting Box */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Privacy Safeguards & Opt-in Status
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Participation is 100% voluntary. Only your chosen public display name is visible.
                Your private email, personal test notes, and raw mock answers are never shared.
              </p>
            </div>
          </div>

          <form onSubmit={handleSavePreferences} className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Public Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
            />

            <button
              type="button"
              onClick={() => setIsOptedIn(!isOptedIn)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                isOptedIn
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {isOptedIn ? '✓ Opted In' : '✕ Opted Out'}
            </button>

            <button
              type="submit"
              disabled={savingPreferences}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
            >
              {savingPreferences ? 'Saving...' : 'Save Preference'}
            </button>
          </form>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
                category === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Leaderboard Rankings Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading rankings...</div>
        ) : leaderboard.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No students currently ranked in this category. Opt-in above and record mock tests or study hours to join!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-semibold w-16">Rank</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Target Examination</th>
                  <th className="py-3 px-4 font-semibold text-right">Performance Metric</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {leaderboard.map((student) => {
                  const isTop3 = student.rank <= 3;
                  return (
                    <tr
                      key={student.userId}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                        student.isCurrentUser
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold">
                        {student.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-black">
                            🥇 1
                          </span>
                        ) : student.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-black">
                            🥈 2
                          </span>
                        ) : student.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-800 font-black">
                            🥉 3
                          </span>
                        ) : (
                          <span className="text-slate-500 pl-2">#{student.rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs uppercase">
                            {student.name.charAt(0)}
                          </div>
                          <span className="text-slate-900 dark:text-white font-medium">
                            {student.name}{' '}
                            {student.isCurrentUser && (
                              <Badge variant="primary" className="ml-1.5">YOU</Badge>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {student.targetExam || 'General'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                        {student.metricLabel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
