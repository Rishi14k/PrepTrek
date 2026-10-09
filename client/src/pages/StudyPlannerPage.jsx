import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lightbulb,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import api from '../api/client';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';
import usePageSEO from '../hooks/usePageSEO';

const StudyPlannerPage = () => {
  usePageSEO({
    title: 'Study Planner & Revision Tasks | PrepTrack',
    description: 'Organize study sessions, backlog tasks, and review automated weakness-based recommendations.',
    canonicalPath: '/study-planner',
    noindex: true,
  });

  const [tasks, setTasks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [filterStatus, setFilterStatus] = useState('all');

  // New task modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskSubject, setTaskSubject] = useState('');
  const [taskChapter, setTaskChapter] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskDurationMinutes, setTaskDurationMinutes] = useState(45);

  const fetchPlannerData = async () => {
    setLoading(true);
    try {
      const [tasksRes, insightsRes, subsRes] = await Promise.all([
        api.get('/study-tasks'),
        api.get('/analytics/insights'),
        api.get('/subjects'),
      ]);

      if (tasksRes.data?.success) setTasks(tasksRes.data.tasks || []);
      if (insightsRes.data?.success) setRecommendations(insightsRes.data.recommendations || []);
      if (subsRes.data?.success) setSubjects(subsRes.data.subjects || []);
    } catch (err) {
      toast.error('Failed to load study planner.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlannerData();
  }, []);

  useEffect(() => {
    if (!taskSubject) {
      setChapters([]);
      return;
    }
    const fetchChapters = async () => {
      try {
        const res = await api.get(`/subjects/${taskSubject}/chapters`);
        if (res.data?.success) setChapters(res.data.chapters || []);
      } catch (err) {}
    };
    fetchChapters();
  }, [taskSubject]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle) return toast.error('Task title is required');

    try {
      await api.post('/study-tasks', {
        title: taskTitle,
        description: taskDescription,
        subjectId: taskSubject || null,
        chapterId: taskChapter || null,
        priority: taskPriority,
        dueDate: taskDueDate || null,
        estimatedDurationSeconds: Number(taskDurationMinutes) * 60,
      });

      toast.success('Study task scheduled!');
      setIsModalOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      fetchPlannerData();
    } catch (err) {
      toast.error('Failed to create task.');
    }
  };

  const handleConvertRecommendation = async (rec) => {
    try {
      await api.post('/study-tasks', {
        title: rec.title,
        description: `${rec.observedEvidence} - Action: ${rec.nextAction}`,
        subjectId: rec.subjectId || null,
        chapterId: rec.chapterId || null,
        priority: rec.priority,
        estimatedDurationSeconds: (rec.suggestedDurationMinutes || 45) * 60,
        linkedRecommendationType: rec.category,
      });
      toast.success('Converted recommendation to active study task!');
      fetchPlannerData();
    } catch (err) {
      toast.error('Failed to convert recommendation.');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/study-tasks/${taskId}`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
      toast.success(`Task marked as ${newStatus.replace('_', ' ')}.`);
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/study-tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success('Task removed.');
    } catch (err) {
      toast.error('Failed to delete task.');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Study Planner & Revision Tasks
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize high-priority revision goals connected directly to your weak chapter recommendations
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Schedule Study Task
        </button>
      </div>

      {/* Recommended Next Steps Ribbon */}
      {recommendations.length > 0 && (
        <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
              Recommended Next Steps Based on Exam Analytics
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950 shadow-xs flex flex-col justify-between text-xs space-y-2"
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <Badge variant={rec.priority === 'high' ? 'danger' : 'warning'}>
                      {rec.priority.toUpperCase()}
                    </Badge>
                    <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[120px]">
                      {rec.chapterName || rec.subjectName}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{rec.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{rec.nextAction}</p>
                </div>

                <button
                  onClick={() => handleConvertRecommendation(rec)}
                  className="w-full py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-semibold transition"
                >
                  + Add to Active Tasks
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Filters */}
      <div className="flex items-center gap-2 text-xs font-semibold">
        {['all', 'pending', 'in_progress', 'completed'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg transition capitalize ${
              filterStatus === st
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Task Cards List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading study tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No tasks in this category"
          description="Schedule a revision task or convert one of your personalized study recommendations above."
          actionLabel="Schedule First Task"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((t) => (
            <div
              key={t._id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <Badge
                    variant={
                      t.priority === 'high'
                        ? 'danger'
                        : t.priority === 'medium'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {t.priority.toUpperCase()} PRIORITY
                  </Badge>

                  <select
                    value={t.status}
                    onChange={(e) => handleStatusChange(t._id, e.target.value)}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <h3 className={`text-sm font-bold text-slate-900 dark:text-white ${t.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                  {t.title}
                </h3>

                {t.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t.description}
                  </p>
                )}

                <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                  {t.subjectId && (
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {t.subjectId.name}
                    </span>
                  )}
                  {t.dueDate && (
                    <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                  )}
                  <span>Est: {Math.round(t.estimatedDurationSeconds / 60)} mins</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => handleDeleteTask(t._id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  title="Remove task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <form
            onSubmit={handleCreateTask}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Schedule New Study Task
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Solve 20 questions on Time & Work formulas"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description / Notes
              </label>
              <textarea
                rows={2}
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Specific areas to focus on..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={taskSubject}
                  onChange={(e) => setTaskSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="">General</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chapter
                </label>
                <select
                  value={taskChapter}
                  onChange={(e) => setTaskChapter(e.target.value)}
                  disabled={!taskSubject}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white disabled:opacity-50"
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

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duration (Mins)
                </label>
                <input
                  type="number"
                  min="5"
                  value={taskDurationMinutes}
                  onChange={(e) => setTaskDurationMinutes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Schedule Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StudyPlannerPage;
