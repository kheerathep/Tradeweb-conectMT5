import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  LineChart,
  BookOpen,
  Radio,
  Wallet,
  Settings,
  X,
  HelpCircle,
} from 'lucide-react';
import clsx from 'clsx';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Trades', to: '/trades', icon: LineChart },
  { name: 'Analytics', to: '/analytics', icon: BookOpen },
  { name: 'MT5 Sync', to: '/mt5-connections', icon: Radio },
  { name: 'Accounts', to: '/accounts', icon: Wallet },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* 1. Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* 2. Slide-out Drawer */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-72 bg-surface border-r border-surface-border flex flex-col transition-transform duration-300 ease-in-out md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Drawer Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <LineChart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base">TradeJournal</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Nav Links */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                      : 'text-slate-300 hover:bg-slate-800'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-surface-border">
          <a
            href="/mt5-guide"
            onClick={onClose}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200"
          >
            <HelpCircle className="w-4 h-4" />
            <span>MT5 Setup Guide (TH)</span>
          </a>
        </div>
      </div>

      {/* 3. Bottom Tab Bar for Mobile Navigation (thumb-friendly) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-lg border-t border-surface-border md:hidden flex items-center justify-around h-14 px-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition-colors',
              isActive ? 'text-blue-400' : 'text-slate-400'
            )
          }
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/trades"
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition-colors',
              isActive ? 'text-blue-400' : 'text-slate-400'
            )
          }
        >
          <LineChart className="w-4 h-4 mb-0.5" />
          <span>Trades</span>
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition-colors',
              isActive ? 'text-blue-400' : 'text-slate-400'
            )
          }
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          <span>Stats</span>
        </NavLink>

        <NavLink
          to="/mt5-connections"
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition-colors',
              isActive ? 'text-blue-400' : 'text-slate-400'
            )
          }
        >
          <Radio className="w-4 h-4 mb-0.5" />
          <span>MT5</span>
        </NavLink>
      </nav>
    </>
  );
};
