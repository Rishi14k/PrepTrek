import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Upload,
  Download,
  Trash2,
  Edit,
  Eye,
  Filter,
  Search,
  FileCheck2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import api from '../api/client';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { ConfirmationDialog } from '../components/common/FeedbackComponents';
import toast from 'react-hot-toast';
import usePageSEO from '../hooks/usePageSEO';

const TestsPage = () => {
  usePageSEO({
    title: 'Mock Tests & Records | PrepTrack',
    description: 'Manage, search, export and analyze your entrance exam mock test results.',
    canonicalPath: '/tests',
    noindex: true,
  });

  const [tests, setTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [deleteId, setDeleteId] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      if (res.data?.success) setSubjects(res.data.subjects || []);
    } catch (err) {}
  };

  const fetchTests = async () => {
    setLoading(true);
    try {
      let url = `/tests?page=${page}&limit=15`;
      if (selectedSubject) url += `&subjectId=${selectedSubject}`;
      if (selectedType) url += `&testType=${selectedType}`;

      const res = await api.get(url);
      if (res.data?.success) {
        setTests(res.data.tests || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error('Failed to load test history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchTests();
  }, [page, selectedSubject, selectedType]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/tests/${deleteId}`);
      toast.success('Test record removed successfully.');
      setDeleteId(null);
      fetchTests();
    } catch (err) {
      toast.error('Failed to delete test record.');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/tests/template', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'preptrack_test_import_template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to download CSV template.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target.result || '');
      setImportErrors([]);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (!csvContent) return toast.error('Please upload or paste CSV data.');
    setImporting(true);
    setImportErrors([]);
    try {
      const res = await api.post('/tests/import', { csvData: csvContent });
      toast.success(res.data.message || 'CSV imported successfully!');
      setIsImportModalOpen(false);
      setCsvContent('');
      fetchTests();
    } catch (err) {
      if (err.response?.data?.errors) {
        setImportErrors(err.response.data.errors);
      }
      toast.error(err.customMessage || 'CSV import failed. Inspect validation errors.');
    } finally {
      setImporting(false);
    }
  };

  const filteredTests = tests.filter((t) =>
    t.testName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Mock Test Records
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your single chapter tests, sectional papers, and full mocks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition"
            title="Download CSV spreadsheet template"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Template
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            Import CSV
          </button>

          <Link
            to="/tests/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Add Test
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tests by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="chapter">Chapter Test</option>
            <option value="sectional">Sectional Mock</option>
            <option value="full_mock">Full Mock Paper</option>
            <option value="previous_year">Previous Year Paper</option>
          </select>
        </div>
      </div>

      {/* Test Records Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading tests...</div>
      ) : filteredTests.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No test records found"
          description={
            selectedSubject || selectedType || searchQuery
              ? 'Try adjusting your search query or filters.'
              : 'Start logging your entrance test scores to generate analytics.'
          }
          actionLabel="Record Mock Test"
          onAction={() => window.location.assign('/tests/new')}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-semibold">Test Name</th>
                  <th className="py-3 px-4 font-semibold">Subject / Chapter</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Questions</th>
                  <th className="py-3 px-4 font-semibold">Marks</th>
                  <th className="py-3 px-4 font-semibold">Score %</th>
                  <th className="py-3 px-4 font-semibold">Accuracy</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredTests.map((test) => (
                  <tr key={test._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      <Link to={`/tests/${test._id}`} className="hover:text-indigo-600">
                        {test.testName}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      {test.subjectId?.name || (test.isParent ? 'Multi-Subject' : 'General')}
                      {test.chapterId && (
                        <span className="block text-[11px] text-slate-500">
                          {test.chapterId.name}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="teal">{test.testType}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {test.attemptedQuestions} / {test.totalQuestions} att.
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {test.marksObtained} / {test.maxMarks}
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {test.scorePercentage}%
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {test.accuracy !== null ? `${test.accuracy}%` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(test.testDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/tests/${test._id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(test._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded-md border border-slate-300 dark:border-slate-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded-md border border-slate-300 dark:border-slate-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteId}
        title="Delete Test Record"
        message="Are you sure you want to permanently delete this test record? Any associated section breakdowns will also be removed."
        confirmLabel="Delete"
        isDanger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Import Mock Test Records from CSV
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Upload your spreadsheet file or paste CSV text below. Rows will be validated for mathematical consistency before saving.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Or Paste CSV Data Directly
                </label>
                <textarea
                  rows={6}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="testName,testDate,testType,subjectName,chapterName,totalQuestions,attemptedQuestions,correctAnswers,incorrectAnswers,unattemptedQuestions,marksObtained,maxMarks,durationSeconds,notes"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Validation Errors Preview */}
              {importErrors.length > 0 && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>CSV Validation Issues Detected:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-rose-600 dark:text-rose-300 max-h-32 overflow-y-auto">
                    {importErrors.map((err, idx) => (
                      <li key={idx}>
                        Row {err.row}: {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importing || !csvContent}
                onClick={handleImportSubmit}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-50"
              >
                {importing ? 'Validating & Importing...' : 'Import Records'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestsPage;
