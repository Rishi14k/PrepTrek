import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  User,
  Mail,
  Target,
  Calendar,
  Clock,
  Sun,
  Moon,
  Download,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ConfirmationDialog } from '../components/common/FeedbackComponents';
import toast from 'react-hot-toast';
import usePageSEO from '../hooks/usePageSEO';

const SettingsPage = () => {
  const { user, refreshUser, theme, toggleTheme, logout } = useAuth();

  usePageSEO({
    title: 'Account & Target Exam Settings | PrepTrack',
    description: 'Customize target entrance examinations, daily study goals, theme mode, and data exports.',
    canonicalPath: '/settings',
    noindex: true,
  });
  const [loading, setLoading] = useState(false);
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        displayName: user.displayName || '',
        targetExam: user.targetExam || '',
        targetExamDate: user.targetExamDate
          ? new Date(user.targetExamDate).toISOString().split('T')[0]
          : '',
        dailyStudyGoalMinutes: Math.round((user.dailyStudyGoalSeconds || 7200) / 60),
        leaderboardOptIn: !!user.leaderboardOptIn,
        timezone: user.timezone || 'Asia/Kolkata',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.patch('/users/me', {
        name: data.name,
        displayName: data.displayName,
        targetExam: data.targetExam,
        targetExamDate: data.targetExamDate || null,
        dailyStudyGoalSeconds: Number(data.dailyStudyGoalMinutes) * 60,
        leaderboardOptIn: data.leaderboardOptIn,
        timezone: data.timezone,
      });

      if (res.data?.success) {
        toast.success('Profile and preferences updated successfully!');
        refreshUser();
      }
    } catch (err) {
      toast.error('Failed to update settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await api.post('/users/me/export', {}, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preptrack-export-${user?._id}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Your data has been exported.');
    } catch (err) {
      toast.error('Failed to export data.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/users/me');
      toast.success('Your account has been deleted.');
      logout();
    } catch (err) {
      toast.error('Failed to delete account.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Profile & Account Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal study targets, examination goals, and data privacy
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Information */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Personal Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Public Leaderboard Display Name
              </label>
              <input
                type="text"
                {...register('displayName')}
                placeholder="e.g. AlexS"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address (Read Only)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account Role
              </label>
              <input
                type="text"
                value={user?.role?.toUpperCase() || 'STUDENT'}
                disabled
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs cursor-not-allowed font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Exam Goals & Targets */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Preparation Targets
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Entrance Examination
              </label>
              <input
                type="text"
                {...register('targetExam')}
                placeholder="e.g. CAT 2026, GATE CS, JEE Advanced"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Exam Date
              </label>
              <input
                type="date"
                {...register('targetExamDate')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Daily Study Goal (Minutes)
              </label>
              <input
                type="number"
                min="10"
                step="5"
                {...register('dailyStudyGoalMinutes')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Timezone
              </label>
              <select
                {...register('timezone')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC Universal</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                {...register('leaderboardOptIn')}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Opt-in to the public student leaderboard using my display name</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Data Export & Danger Zone */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
          Data Export & Account Management
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Export Personal Data</h4>
            <p className="text-[11px] text-slate-500">Download a complete JSON export of all your test records and study sessions.</p>
          </div>
          <button
            onClick={handleExportData}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export My Data
          </button>
        </div>

        <div className="pt-4 border-t border-rose-100 dark:border-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">Delete Account</h4>
            <p className="text-[11px] text-slate-500">Permanently delete your user profile and all associated mock test records.</p>
          </div>
          <button
            onClick={() => setDeleteAccountModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Account
          </button>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={deleteAccountModal}
        title="Permanently Delete Account?"
        message="This action will permanently delete your user profile, test attempts, study sessions, and planner tasks. It cannot be reversed."
        confirmLabel="Permanently Delete"
        isDanger={true}
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteAccountModal(false)}
      />
    </div>
  );
};

export default SettingsPage;
