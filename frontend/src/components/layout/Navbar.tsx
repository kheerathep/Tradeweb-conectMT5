import React, { useState } from 'react';
import {
  Menu,
  Plus,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Check,
  Bell,
  Terminal,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onOpenMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
  const { user, accounts, activeAccount, setActiveAccount, logout } = useAuth();
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  const handleQuickSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  return (
    <header className="h-16 border-b border-surface-border/40 bg-surface-container-lowest/95 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger & Terminal Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-container-high focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Terminal Breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 text-slate-400 font-mono text-xs">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="font-semibold text-slate-300">Terminal</span>
          <span className="text-outline/40">/</span>
          <span className="text-primary font-medium">TradeFlow Live</span>
        </div>

        {/* Dynamic Account Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className="flex items-center gap-2 bg-[#181c25] hover:bg-[#202634] border border-slate-700/80 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-left shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white leading-tight truncate max-w-[140px] sm:max-w-[180px]">
                {activeAccount ? activeAccount.accountName : 'Select Account'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono leading-none hidden xs:inline">
                {activeAccount
                  ? `${activeAccount.initialBalance.toLocaleString()} ${activeAccount.currency}`
                  : 'No account'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Account Dropdown Menu with 100% Solid Opaque Background */}
          {showAccountDropdown && (
            <>
              {/* Backdrop to close dropdown on click outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAccountDropdown(false)}
              />

              {/* Solid Dropdown Box */}
              <div
                className="absolute left-0 mt-2 w-72 rounded-xl border border-slate-700 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-50 font-sans"
                style={{ backgroundColor: '#131722', opacity: 1 }}
              >
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono border-b border-slate-800 mb-1.5">
                  Switch Trading Account
                </div>
                <div className="space-y-1">
                  {accounts.map((acc) => {
                    const isSel = activeAccount?.id === acc.id;
                    return (
                      <button
                        key={acc.id}
                        onClick={() => {
                          setActiveAccount(acc);
                          setShowAccountDropdown(false);
                        }}
                        style={{ backgroundColor: isSel ? '#1f2637' : '#181d2a' }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs text-left transition-all border ${
                          isSel
                            ? 'border-primary/50 text-white shadow-sm'
                            : 'border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-[#202738]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-white truncate text-xs">{acc.accountName}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {acc.accountType} • {Number(acc.initialBalance || 0).toLocaleString()} {acc.currency}
                          </div>
                        </div>
                        {isSel && (
                          <span className="w-5 h-5 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800">
                  <Link
                    to="/accounts"
                    onClick={() => setShowAccountDropdown(false)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-primary hover:text-primary/80 font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Manage Accounts
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Sync MT5, Log Trade, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync MT5 Quick Action */}
        <button
          onClick={handleQuickSync}
          className="h-8 px-2.5 sm:px-3 rounded-lg bg-surface-container border border-surface-border/50 hover:bg-surface-container-high text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          title="Trigger sync ping with active MT5 terminal"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
          <span className="hidden sm:inline">Sync MT5</span>
          {isSyncing && <RotateCw className="w-3 h-3 animate-spin text-primary ml-0.5" />}
        </button>

        {/* Log Trade Quick Action */}
        <button
          onClick={() => navigate('/trades?action=log')}
          className="h-8 px-3 rounded-lg bg-primary text-slate-950 font-semibold text-xs hover:bg-primary/90 transition-all flex items-center gap-1 shadow-sm shadow-primary/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Log Trade</span>
        </button>

        <div className="h-4 w-px bg-surface-border/60 mx-0.5 hidden sm:block"></div>

        {/* Notifications Icon */}
        <button
          className="relative p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-container transition-colors"
          title="System Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-tertiary ring-2 ring-surface-container-lowest"></span>
        </button>

        {/* User Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-container transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs">
              {user ? user.username.substring(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight">
                {user ? user.displayName || user.username : 'Alex Chen'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono leading-none">
                {user ? user.email : 'PRO Trader'}
              </span>
            </div>
          </button>

          {/* User Menu */}
          {showUserDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserDropdown(false)}
              />
              <div
                className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-700 p-2 shadow-2xl z-50"
                style={{ backgroundColor: '#131722', opacity: 1 }}
              >
                <div className="px-3 py-2 border-b border-slate-800 text-xs">
                  <p className="font-semibold text-slate-200">{user?.displayName || user?.username}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</p>
                </div>
                <div className="pt-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors font-medium text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
