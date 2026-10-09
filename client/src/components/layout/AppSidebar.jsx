import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck2,
  BarChart3,
  Timer,
  CalendarCheck,
  Trophy,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AppSidebar = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, isAdmin } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Test Records', href: '/tests', icon: FileCheck2 },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Study Timer', href: '/study-timer', icon: Timer },
    { name: 'Study Planner', href: '/study-planner', icon: CalendarCheck },
    { name: 'Performance Reports', href: '/reports', icon: FileSpreadsheet },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  ];

  const secondaryNav = [
    { name: 'Profile & Settings', href: '/settings', icon: Settings },
  ];

  if (isAdmin) {
    secondaryNav.unshift({ name: 'Admin Dashboard', href: '/admin', icon: ShieldAlert });
  }

  const renderNavLinks = () => (
    <>
      <div className="space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              } ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? item.name : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </div>

      <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 space-y-1">
        {!collapsed && (
          <span className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Preferences
          </span>
        )}
        {secondaryNav.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              } ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? item.name : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between pb-6 mb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Prep<span className="text-indigo-600 dark:text-indigo-400">Track</span>
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">{renderNavLinks()}</div>
      </div>

      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 ease-in-out sticky top-0 h-screen z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
                Prep<span className="text-indigo-600 dark:text-indigo-400">Track</span>
              </span>
            )}
          </NavLink>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">{renderNavLinks()}</div>

        {/* User preview tag at bottom */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 ${collapsed ? 'justify-center p-1.5' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            {!collapsed && (
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {user?.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.targetExam || 'Aspirant'}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
