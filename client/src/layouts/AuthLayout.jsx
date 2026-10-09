import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { GraduationCap, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthLayout = () => {
  const { theme, toggleTheme } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            Prep<span className="text-indigo-600 dark:text-indigo-400">Track</span>
          </span>
        </Link>

        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      <main className="max-w-md w-full mx-auto my-8">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-slate-500 dark:text-slate-400 py-4">
        &copy; {new Date().getFullYear()} PrepTrack Entrance Examination Analytics. All rights reserved.
      </footer>
    </div>
  );
};

export default AuthLayout;
