import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Trash2, Edit2, Calendar, Timer } from 'lucide-react';
import api from '../api/client';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { ConfirmationDialog } from '../components/common/FeedbackComponents';
import toast from 'react-hot-toast';
import usePageSEO from '../hooks/usePageSEO';

const StudyHistoryPage = () => {
  usePageSEO({
    title: 'Study Session History & Logs | PrepTrack',
    description: 'Review historical study sessions, Pomodoro focus time logs, and manual session adjustments.',
    canonicalPath: '/study-history',
    noindex: true,
  });

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  // Edit modal state
  const [editSession, setEditSession] = useState(null);
  const [editDurationMinutes, setEditDurationMinutes] = useState(0);
  const [editNotes, setEditNotes] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/study-sessions?limit=50');
      if (res.data?.success) setSessions(res.data.sessions || []);
    } catch (err) {
      toast.error('Failed to load study sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/study-sessions/${deleteId}`);
      toast.success('Study session deleted.');
      setDeleteId(null);
      fetchSessions();
    } catch (err) {
      toast.error('Failed to delete session.');
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editSession) return;
    try {
      await api.patch(`/study-sessions/${editSession._id}`, {
        durationSeconds: Number(editDurationMinutes) * 60,
        notes: editNotes,
      });
      toast.success('Session updated.');
      setEditSession(null);
      fetchSessions();
    } catch (err) {
      toast.error('Failed to update session.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <Link
            to="/study-timer"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Study Session History
            </h1>
            <p className="text-xs text-slate-500">
              Authoritative log of all completed focus sessions and Pomodoro rounds
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading history...</div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Timer}
          title="No study sessions recorded"
          description="Use the study timer to track your focus hours and build your daily study streak."
          actionLabel="Open Study Timer"
          onAction={() => window.location.assign('/study-timer')}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date & Time</th>
                  <th className="py-3 px-4 font-semibold">Duration</th>
                  <th className="py-3 px-4 font-semibold">Subject / Chapter</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Focus Notes</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {sessions.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {new Date(s.startedAt).toLocaleDateString()} at{' '}
                      {new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.round((s.durationSeconds || 0) / 60)} mins
                    </td>
                    <td className="py-3 px-4">
                      {s.subjectId?.name || 'General Focus'}
                      {s.chapterId && <span className="block text-[11px] text-slate-400">{s.chapterId.name}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="teal">{s.sessionType}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {s.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditSession(s);
                            setEditDurationMinutes(Math.round((s.durationSeconds || 0) / 60));
                            setEditNotes(s.notes || '');
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Edit Session"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(s._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteId}
        title="Delete Study Record"
        message="Are you sure you want to delete this study session record? This will adjust your total study hours."
        confirmLabel="Delete"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* Edit Session Modal */}
      {editSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <form
            onSubmit={handleEditSave}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Edit Study Session
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                value={editDurationMinutes}
                onChange={(e) => setEditDurationMinutes(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Session Notes
              </label>
              <textarea
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditSession(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StudyHistoryPage;
