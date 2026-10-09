import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';

// Public Pages
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';

// Student Pages
import DashboardPage from '../pages/DashboardPage';
import TestsPage from '../pages/TestsPage';
import AddTestPage from '../pages/AddTestPage';
import TestDetailPage from '../pages/TestDetailPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import ChapterDetailPage from '../pages/ChapterDetailPage';
import StudyTimerPage from '../pages/StudyTimerPage';
import StudyHistoryPage from '../pages/StudyHistoryPage';
import StudyPlannerPage from '../pages/StudyPlannerPage';
import ReportsPage from '../pages/ReportsPage';
import LeaderboardPage from '../pages/LeaderboardPage';
import SettingsPage from '../pages/SettingsPage';

// Admin Page
import AdminDashboardPage from '../pages/AdminDashboardPage';
import NotFoundPage from '../pages/NotFoundPage';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Admin Route Guard
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Home */}
      <Route path="/" element={<HomePage />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Authenticated Student Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tests" element={<TestsPage />} />
        <Route path="/tests/new" element={<AddTestPage />} />
        <Route path="/tests/:testId" element={<TestDetailPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/analytics/chapters/:chapterId" element={<ChapterDetailPage />} />
        <Route path="/study-timer" element={<StudyTimerPage />} />
        <Route path="/study-history" element={<StudyHistoryPage />} />
        <Route path="/study-planner" element={<StudyPlannerPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<SettingsPage />} />

        {/* Administrator Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
