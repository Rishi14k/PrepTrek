import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  FileCheck2,
  BookOpen,
  Sliders,
  CheckCircle2,
  Search,
  Plus,
  Save,
} from 'lucide-react';
import api from '../api/client';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';
import usePageSEO from '../hooks/usePageSEO';

const AdminDashboardPage = () => {
  usePageSEO({
    title: 'Platform Administration | PrepTrack',
    description: 'System metrics, user management, and analytics threshold configuration.',
    canonicalPath: '/admin',
    noindex: true,
  });

  const [stats, setStats] = useState({});
  const [systemConfig, setSystemConfig] = useState({});
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchStudent, setSearchStudent] = useState('');

  // Threshold form
  const [strongThresh, setStrongThresh] = useState(80);
  const [devThresh, setDevThresh] = useState(60);
  const [minTests, setMinTests] = useState(2);
  const [minQuestions, setMinQuestions] = useState(20);
  const [neglectedDays, setNeglectedDays] = useState(14);
  const [savingConfig, setSavingConfig] = useState(false);

  // New Subject form
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('indigo');

  // New Chapter form
  const [targetSubjectId, setTargetSubjectId] = useState('');
  const [newChapterName, setNewChapterName] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [dashRes, usersRes, subRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users'),
        api.get('/subjects'),
      ]);

      if (dashRes.data?.success) {
        setStats(dashRes.data.stats || {});
        const cfg = dashRes.data.systemConfig || {};
        setSystemConfig(cfg);
        if (cfg.strongThreshold) setStrongThresh(cfg.strongThreshold);
        if (cfg.developingThreshold) setDevThresh(cfg.developingThreshold);
        if (cfg.minEvidenceTests) setMinTests(cfg.minEvidenceTests);
        if (cfg.minEvidenceQuestions) setMinQuestions(cfg.minEvidenceQuestions);
        if (cfg.neglectedDaysThreshold) setNeglectedDays(cfg.neglectedDaysThreshold);
      }

      if (usersRes.data?.success) setStudents(usersRes.data.users || []);
      if (subRes.data?.success) {
        const subs = subRes.data.subjects || [];
        setSubjects(subs);
        if (subs.length > 0) setTargetSubjectId(subs[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load administrator data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await api.patch('/admin/settings', {
        strongThreshold: Number(strongThresh),
        developingThreshold: Number(devThresh),
        minEvidenceTests: Number(minTests),
        minEvidenceQuestions: Number(minQuestions),
        neglectedDaysThreshold: Number(neglectedDays),
      });

      if (res.data?.success) {
        toast.success('Classification thresholds and rules updated across the platform!');
      }
    } catch (err) {
      toast.error('Failed to update thresholds.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      const res = await api.patch(`/admin/users/${user._id}`, {
        isActive: !user.isActive,
      });
      if (res.data?.success) {
        toast.success(`User ${user.name} is now ${!user.isActive ? 'Active' : 'Deactivated'}.`);
        setStudents((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, isActive: !user.isActive } : u))
        );
      }
    } catch (err) {
      toast.error('Failed to update student status.');
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName) return toast.error('Subject name is required');
    try {
      const res = await api.post('/admin/subjects', {
        name: newSubjectName,
        color: newSubjectColor,
      });
      if (res.data?.success) {
        toast.success(`Subject "${newSubjectName}" created!`);
        setNewSubjectName('');
        fetchAdminData();
      }
    } catch (err) {
      toast.error(err.customMessage || 'Failed to create subject.');
    }
  };

  const handleCreateChapter = async (e) => {
    e.preventDefault();
    if (!newChapterName || !targetSubjectId) return toast.error('Chapter name & subject required');
    try {
      const res = await api.post('/admin/chapters', {
        subjectId: targetSubjectId,
        name: newChapterName,
      });
      if (res.data?.success) {
        toast.success(`Chapter "${newChapterName}" added!`);
        setNewChapterName('');
        fetchAdminData();
      }
    } catch (err) {
      toast.error(err.customMessage || 'Failed to add chapter.');
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.email.toLowerCase().includes(searchStudent.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Administrator Command Center
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          System governance, student account moderation, syllabus management, and threshold rules
        </p>
      </div>

      {/* Global Application KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Registered Users" value={stats.totalUsers} />
        <StatCard title="Active Students" value={stats.activeStudents} />
        <StatCard title="Tests Recorded" value={stats.totalTests} />
        <StatCard title="Active Subjects" value={stats.totalSubjects} />
        <StatCard title="Total Chapters" value={stats.totalChapters} />
        <StatCard title="Study Hours" value={stats.totalStudyHours} unit="hrs" />
      </div>

      {/* Classification Thresholds Configuration */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Sliders className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Configurable Classification Thresholds & Evidence Requirements
            </h3>
            <p className="text-[11px] text-slate-500">
              Changes instantly alter strength and weakness classifications across the student analytics engine
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveThresholds} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Strong Threshold (%)
            </label>
            <input
              type="number"
              min="50"
              max="100"
              value={strongThresh}
              onChange={(e) => setStrongThresh(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Developing Threshold (%)
            </label>
            <input
              type="number"
              min="30"
              max="90"
              value={devThresh}
              onChange={(e) => setDevThresh(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Min Evidence Tests
            </label>
            <input
              type="number"
              min="1"
              value={minTests}
              onChange={(e) => setMinTests(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Min Evidence Attempts
            </label>
            <input
              type="number"
              min="5"
              value={minQuestions}
              onChange={(e) => setMinQuestions(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Neglected (Days)
            </label>
            <input
              type="number"
              min="3"
              value={neglectedDays}
              onChange={(e) => setNeglectedDays(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-3 lg:col-span-5 flex justify-end">
            <button
              type="submit"
              disabled={savingConfig}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              {savingConfig ? 'Updating...' : 'Save Classification Rules'}
            </button>
          </div>
        </form>
      </div>

      {/* Syllabus Management: Subject and Chapter Creation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add Subject */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Create Examination Subject
          </h3>
          <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject Name
              </label>
              <input
                type="text"
                placeholder="e.g. Data Interpretation & Logical Reasoning"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Theme Color
              </label>
              <select
                value={newSubjectColor}
                onChange={(e) => setNewSubjectColor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="indigo">Indigo</option>
                <option value="violet">Violet</option>
                <option value="teal">Teal</option>
                <option value="blue">Blue</option>
                <option value="emerald">Emerald</option>
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Subject
            </button>
          </form>
        </div>

        {/* Add Chapter */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Add Chapter under Subject
          </h3>
          <form onSubmit={handleCreateChapter} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Parent Subject
              </label>
              <select
                value={targetSubjectId}
                onChange={(e) => setTargetSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chapter / Topic Name
              </label>
              <input
                type="text"
                placeholder="e.g. Logarithms and Functions"
                value={newChapterName}
                onChange={(e) => setNewChapterName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Chapter
            </button>
          </form>
        </div>
      </div>

      {/* Student User Management Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Student Accounts ({students.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Manage student accounts and toggle access status
            </p>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Student Name</th>
                <th className="py-2.5 px-3 font-semibold">Email</th>
                <th className="py-2.5 px-3 font-semibold">Target Exam</th>
                <th className="py-2.5 px-3 font-semibold">Role</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                    {u.name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{u.email}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                    {u.targetExam || 'General'}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant={u.role === 'admin' ? 'primary' : 'default'}>
                      {u.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant={u.isActive ? 'success' : 'danger'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleToggleUserStatus(u)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                        u.isActive
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
