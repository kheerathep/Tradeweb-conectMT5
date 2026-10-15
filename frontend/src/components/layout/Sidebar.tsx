import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  LineChart,
  BookOpen,
  Radio,
  Wallet,
  Settings,
  HelpCircle,
} from 'lucide-react';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-surface-border bg-surface-container-lowest shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-surface-border/50 gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <LineChart className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-base text-white tracking-tight">TradeFlow</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            MT5
          </span>
        </div>
      </div>

      {/* Nav List with Sections */}
      <div className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {/* OVERVIEW */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Overview
          </div>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                isActive
                  ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface-container'
              )
            }
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard</span>
          </NavLink>
        </div>

        {/* TRADING */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Trading
          </div>
          <NavLink
            to="/trades"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                isActive
                  ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface-container'
              )
            }
          >
            <LineChart className="w-4 h-4 shrink-0" />
            <span>Trade Journal</span>
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                isActive
                  ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface-container'
              )
            }
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Analytics</span>
          </NavLink>
          <NavLink
            to="/accounts"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                isActive
                  ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface-container'
              )
            }
          >
            <Wallet className="w-4 h-4 shrink-0" />
            <span>Accounts</span>
          </NavLink>
        </div>

        {/* INTEGRATIONS */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Integrations
          </div>
          <NavLink
            to="/mt5-connections"
            className={({ isActive }) =>
              clsx(
                'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                isActive
                  ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface-container'
              )
            }
          >
            <div className="flex items-center gap-3">
              <Radio className="w-4 h-4 shrink-0" />
              <span>MT5 Connections</span>
            </div>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
            </span>
          </NavLink>
        </div>

        {/* PREFERENCES */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Preferences
          </div>
          <NavLink
            to="/mt5-guide"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                isActive
                  ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface-container'
              )
            }
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>MT5 Setup Guide (TH)</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                isActive
                  ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface-container'
              )
            }
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Settings</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
};
