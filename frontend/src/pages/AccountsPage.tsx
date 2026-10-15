import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  CheckCircle2,
  Shield,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { accountsApi } from '../api/accounts';
import { tradesApi } from '../api/trades';
import { AccountType, Trade } from '../types';

interface DayCell {
  date: Date;
  dayNumber: string;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  dateKey: string;
  trades: Trade[];
  netPnl: number;
  tradeCount: number;
}

export const AccountsPage: React.FC = () => {
  const { accounts, activeAccount, setActiveAccount, refreshAccounts } = useAuth();

  // Active Tab: 'CALENDAR' | 'OVERVIEW' | 'ACCOUNTS'
  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'OVERVIEW' | 'ACCOUNTS'>('CALENDAR');

  // Month navigation: default to current date
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [broker, setBroker] = useState('');
  const [mt5Server, setMt5Server] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('PROP');
  const [currency, setCurrency] = useState('USD');
  const [initialBalance, setInitialBalance] = useState('100000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load trades for active account
  const loadTrades = useCallback(async () => {
    if (!activeAccount) {
      setTrades([]);
      return;
    }
    setIsLoadingTrades(true);
    try {
      const data = await tradesApi.getTrades({ accountId: activeAccount.id });
      setTrades(data);

      // If trades exist, check if any trade is in a recent month and auto-set month
      if (data.length > 0) {
        const sorted = [...data].sort(
          (a, b) => new Date(b.closedAt || b.openedAt || 0).getTime() - new Date(a.closedAt || a.openedAt || 0).getTime()
        );
        const latestDateStr = sorted[0].closedAt || sorted[0].openedAt;
        if (latestDateStr) {
          const lDate = new Date(latestDateStr);
          if (!isNaN(lDate.getTime())) {
            setCurrentDate(new Date(lDate.getFullYear(), lDate.getMonth(), 1));
          }
        }
      }
    } catch {
      setTrades([]);
    } finally {
      setIsLoadingTrades(false);
    }
  }, [activeAccount]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDayKey(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDayKey(null);
  };

  // Build Calendar Matrix (Monday to Sunday)
  const { monthLabel, calendarCells, monthStats } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthLabel = currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    // Group trades by date (YYYY-MM-DD)
    const tradesByDate = new Map<string, Trade[]>();
    trades.forEach((t) => {
      const dateStr = t.closedAt || t.openedAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      // Local date format YYYY-MM-DD
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      const list = tradesByDate.get(key) || [];
      list.push(t);
      tradesByDate.set(key, list);
    });

    const firstDay = new Date(year, month, 1);
    let startDayOfWeek = firstDay.getDay(); // 0 is Sunday, 1 is Monday
    if (startDayOfWeek === 0) startDayOfWeek = 7; // Convert Sunday to 7
    const prefixDays = startDayOfWeek - 1; // Number of days from previous month to show

    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: DayCell[] = [];

    // Previous month filler days
    for (let i = prefixDays - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const cellDate = new Date(year, month - 1, d);
      const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
      const yStr = cellDate.getFullYear();
      const mStr = String(cellDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateKey = `${yStr}-${mStr}-${dStr}`;
      const dayTrades = tradesByDate.get(dateKey) || [];
      const netPnl = dayTrades.reduce((acc, t) => acc + Number(t.netPnl ?? 0), 0);

      cells.push({
        date: cellDate,
        dayNumber: String(d).padStart(2, '0'),
        isCurrentMonth: false,
        isWeekend,
        dateKey,
        trades: dayTrades,
        netPnl,
        tradeCount: dayTrades.length,
      });
    }

    let monthNetPnl = 0;
    let winDays = 0;
    let lossDays = 0;
    let totalMonthTrades = 0;

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const cellDate = new Date(year, month, d);
      const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
      const yStr = year;
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateKey = `${yStr}-${mStr}-${dStr}`;
      const dayTrades = tradesByDate.get(dateKey) || [];
      const netPnl = dayTrades.reduce((acc, t) => acc + Number(t.netPnl ?? 0), 0);

      if (dayTrades.length > 0) {
        monthNetPnl += netPnl;
        totalMonthTrades += dayTrades.length;
        if (netPnl > 0) winDays++;
        else if (netPnl < 0) lossDays++;
      }

      cells.push({
        date: cellDate,
        dayNumber: String(d).padStart(2, '0'),
        isCurrentMonth: true,
        isWeekend,
        dateKey,
        trades: dayTrades,
        netPnl,
        tradeCount: dayTrades.length,
      });
    }

    // Next month filler days to complete weeks (fill up to multiple of 7, at least 35 or 42)
    const totalFilled = cells.length;
    const remaining = (7 - (totalFilled % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const cellDate = new Date(year, month + 1, d);
      const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
      const yStr = cellDate.getFullYear();
      const mStr = String(cellDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateKey = `${yStr}-${mStr}-${dStr}`;
      const dayTrades = tradesByDate.get(dateKey) || [];
      const netPnl = dayTrades.reduce((acc, t) => acc + Number(t.netPnl ?? 0), 0);

      cells.push({
        date: cellDate,
        dayNumber: String(d).padStart(2, '0'),
        isCurrentMonth: false,
        isWeekend,
        dateKey,
        trades: dayTrades,
        netPnl,
        tradeCount: dayTrades.length,
      });
    }

    return {
      monthLabel,
      calendarCells: cells,
      monthStats: {
        monthNetPnl,
        winDays,
        lossDays,
        totalTradingDays: winDays + lossDays,
        totalMonthTrades,
      },
    };
  }, [currentDate, trades]);

  // Selected Day's Trades
  const selectedDayTrades = useMemo(() => {
    if (!selectedDayKey) return null;
    const cell = calendarCells.find((c) => c.dateKey === selectedDayKey);
    return cell || null;
  }, [selectedDayKey, calendarCells]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await accountsApi.createAccount({
        accountName,
        broker,
        mt5Server,
        accountType,
        currency,
        initialBalance: parseFloat(initialBalance) || 0,
      });
      await refreshAccounts();
      setShowModal(false);
      setAccountName('');
      setBroker('');
      setMt5Server('');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: number) => {
    if (confirm('Are you sure you want to archive this account? Historical trades will remain safe.')) {
      try {
        await accountsApi.archiveAccount(id);
        await refreshAccounts();
      } catch (err: unknown) {
        const apiErr = err as { message?: string };
        alert(apiErr?.message || 'Failed to archive account');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Account Challenge & Cycle Top Ribbon (matching user screenshot) */}
      <div className="rounded-xl bg-surface-container-low border border-surface-border/50 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 font-mono text-[11px] font-extrabold uppercase tracking-wider border border-rose-500/30">
              {activeAccount?.accountType === 'PROP' ? 'CHALLENGE • P1' : `${activeAccount?.accountType || 'LIVE'} • ACTIVE`}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-white">
                {activeAccount?.accountName || 'Apex 100k Funded'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                (${Number(activeAccount?.initialBalance || 100000).toLocaleString()} {activeAccount?.currency || 'USD'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <CalendarIcon className="w-3.5 h-3.5 text-primary" />
            <span>
              Trading Cycle: {activeAccount?.createdAt ? new Date(activeAccount.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Sep 9, 2026'} to Unlimited
            </span>
          </div>
        </div>

        {/* Subtabs Strip: Overview | Calendar | History | Platform */}
        <div className="flex items-center justify-between border-t border-surface-border/40 pt-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'OVERVIEW'
                  ? 'bg-surface-container text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('CALENDAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors relative ${
                activeTab === 'CALENDAR'
                  ? 'bg-surface-container text-primary font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Calendar</span>
              {activeTab === 'CALENDAR' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('ACCOUNTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'ACCOUNTS'
                  ? 'bg-surface-container text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Manage Accounts ({accounts.length})
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* 2. CALENDAR TAB CONTENT (Exact match to screenshot) */}
      {activeTab === 'CALENDAR' && (
        <div className="space-y-4">
          {/* Calendar Header with Title & Month Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Trading Calendar</span>
                {isLoadingTrades && <span className="text-xs font-normal text-slate-400 font-mono">(Loading trades...)</span>}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Daily P&L distribution, trading frequency, and performance highlights.
              </p>
            </div>

            {/* Right Month Navigation */}
            <div className="flex items-center gap-3">
              {/* Monthly Stats Summary Pills */}
              <div className="hidden lg:flex items-center gap-2 font-mono text-xs">
                <span className="px-2 py-1 rounded bg-surface-container text-slate-300">
                  Month P&L:{' '}
                  <strong className={monthStats.monthNetPnl >= 0 ? 'text-secondary font-bold' : 'text-tertiary font-bold'}>
                    {monthStats.monthNetPnl >= 0 ? `+$${monthStats.monthNetPnl.toFixed(2)}` : `-$${Math.abs(monthStats.monthNetPnl).toFixed(2)}`}
                  </strong>
                </span>
                <span className="px-2 py-1 rounded bg-surface-container text-slate-300">
                  <span className="text-secondary font-bold">{monthStats.winDays}W</span> / <span className="text-tertiary font-bold">{monthStats.lossDays}L</span>
                </span>
              </div>

              {/* Month Selector Buttons */}
              <div className="flex items-center gap-1 bg-surface-container-low border border-surface-border/50 rounded-lg p-0.5 font-mono text-xs">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded hover:bg-surface-container text-slate-400 hover:text-white transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-bold text-white min-w-[130px] text-center select-none">
                  {monthLabel}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded hover:bg-surface-container text-slate-400 hover:text-white transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 7-Column Calendar Grid Container */}
          <div className="rounded-xl bg-surface-container-low border border-surface-border/50 p-3 sm:p-5 shadow-sm space-y-2">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs sm:text-sm font-semibold text-slate-300 py-1 select-none">
              <div className="py-1">Monday</div>
              <div className="py-1">Tuesday</div>
              <div className="py-1">Wednesday</div>
              <div className="py-1">Thursday</div>
              <div className="py-1">Friday</div>
              <div className="py-1 text-slate-400">Saturday</div>
              <div className="py-1 text-slate-400">Sunday</div>
            </div>

            {/* Calendar Day Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarCells.map((cell) => {
                const hasTrades = cell.tradeCount > 0;
                const isWin = cell.netPnl > 0;
                const isLoss = cell.netPnl < 0;
                const isSelected = selectedDayKey === cell.dateKey;

                // Cell styling matching user's screenshot
                let cellBgClass = 'bg-[#181c25]/80 border-surface-border/30 hover:border-surface-border';
                if (!cell.isCurrentMonth) {
                  cellBgClass = 'bg-[#12151d]/40 border-surface-border/20 opacity-40';
                } else if (hasTrades) {
                  if (isWin) {
                    cellBgClass = 'bg-[#0d2818] border-[#1b4332] shadow-sm hover:border-emerald-500/70';
                  } else if (isLoss) {
                    cellBgClass = 'bg-[#2b1114] border-[#4a1c24] shadow-sm hover:border-rose-500/70';
                  }
                }

                return (
                  <div
                    key={cell.dateKey}
                    onClick={() => {
                      if (hasTrades) {
                        setSelectedDayKey(isSelected ? null : cell.dateKey);
                      }
                    }}
                    className={`min-h-[78px] sm:min-h-[105px] p-2 sm:p-3 rounded-xl border flex flex-col justify-between transition-all select-none ${cellBgClass} ${
                      hasTrades ? 'cursor-pointer hover:scale-[1.01]' : ''
                    } ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest' : ''}`}
                  >
                    {/* Top Row: Day Number */}
                    <div className="flex items-start justify-between">
                      <span
                        className={`text-xs sm:text-sm font-mono font-bold ${
                          cell.isCurrentMonth ? 'text-slate-200' : 'text-slate-600'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                    </div>

                    {/* Bottom Area: P&L or Weekend Label */}
                    <div className="mt-1">
                      {hasTrades ? (
                        <div className="space-y-0.5">
                          {/* P&L Line */}
                          <div
                            className={`font-mono text-[11px] sm:text-xs font-extrabold flex items-center gap-1 ${
                              isWin ? 'text-secondary' : isLoss ? 'text-tertiary' : 'text-slate-300'
                            }`}
                          >
                            <span>
                              {isWin
                                ? `+$${cell.netPnl.toFixed(2)}`
                                : isLoss
                                ? `-$${Math.abs(cell.netPnl).toFixed(2)}`
                                : `$0.00`}
                            </span>
                            <span className="text-[10px]">
                              {isWin ? '▲' : isLoss ? '▼' : '•'}
                            </span>
                          </div>
                          {/* Trade Count Subtitle */}
                          <div className="text-[10px] text-slate-400 font-sans">
                            {cell.tradeCount} {cell.tradeCount === 1 ? 'Trade' : 'Trades'}
                          </div>
                        </div>
                      ) : cell.isWeekend && cell.isCurrentMonth ? (
                        <div className="text-[10px] sm:text-[11px] text-slate-600 font-sans font-medium">
                          Weekend
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Trade Details Drawer */}
          {selectedDayTrades && selectedDayTrades.trades.length > 0 && (
            <div className="rounded-xl bg-surface-container-low border border-surface-border/50 p-4 sm:p-5 shadow-lg animate-in fade-in space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-surface-border/30">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white">
                    Trades on {selectedDayTrades.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span
                    className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                      selectedDayTrades.netPnl >= 0 ? 'bg-secondary/15 text-secondary' : 'bg-tertiary/15 text-tertiary'
                    }`}
                  >
                    {selectedDayTrades.netPnl >= 0
                      ? `+$${selectedDayTrades.netPnl.toFixed(2)}`
                      : `-$${Math.abs(selectedDayTrades.netPnl).toFixed(2)}`}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDayKey(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs text-slate-300">
                  <thead className="text-[10px] uppercase text-slate-400 border-b border-surface-border/30">
                    <tr>
                      <th className="py-2 px-3">Symbol</th>
                      <th className="py-2 px-3">Side</th>
                      <th className="py-2 px-3">Volume</th>
                      <th className="py-2 px-3">Entry / Exit</th>
                      <th className="py-2 px-3">Setup</th>
                      <th className="py-2 px-3">Discipline</th>
                      <th className="py-2 px-3 text-right">Net P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/20">
                    {selectedDayTrades.trades.map((t) => (
                      <tr key={t.id} className="hover:bg-surface-container/50">
                        <td className="py-2 px-3 font-bold text-white">{t.symbol}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              t.direction === 'BUY' ? 'bg-secondary/15 text-secondary' : 'bg-tertiary/15 text-tertiary'
                            }`}
                          >
                            {t.direction}
                          </span>
                        </td>
                        <td className="py-2 px-3">{t.totalVolume} lots</td>
                        <td className="py-2 px-3 text-slate-400">
                          {Number(t.entryPrice || 0).toFixed(4)} → {t.exitPrice ? Number(t.exitPrice).toFixed(4) : '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-200 font-sans">{t.setupName || 'Price Action'}</td>
                        <td className="py-2 px-3">
                          {t.followedRules ?? true ? (
                            <span className="text-secondary text-[11px] font-sans">Disciplined</span>
                          ) : (
                            <span className="text-tertiary text-[11px] font-sans">Violated</span>
                          )}
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-bold ${
                            Number(t.netPnl ?? 0) >= 0 ? 'text-secondary' : 'text-tertiary'
                          }`}
                        >
                          {Number(t.netPnl ?? 0) >= 0
                            ? `+$${Number(t.netPnl ?? 0).toFixed(2)}`
                            : `-$${Math.abs(Number(t.netPnl ?? 0)).toFixed(2)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-surface-container-low border border-surface-border/50 shadow-sm space-y-3">
            <span className="font-mono text-[10px] uppercase font-bold text-slate-400">Account Specifications</span>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Account Name:</span>
                <span className="text-white font-bold">{activeAccount?.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Type:</span>
                <span className="text-primary font-bold">{activeAccount?.accountType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Currency:</span>
                <span className="text-white font-bold">{activeAccount?.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Broker:</span>
                <span className="text-slate-200">{activeAccount?.broker || 'Prop Firm'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">MT5 Server:</span>
                <span className="text-slate-200">{activeAccount?.mt5Server || 'MetaTrader 5'}</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-surface-container-low border border-surface-border/50 shadow-sm space-y-3">
            <span className="font-mono text-[10px] uppercase font-bold text-slate-400">Capital & Sizing</span>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Starting Balance:</span>
                <span className="text-white font-bold">${Number(activeAccount?.initialBalance || 100000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Profit Target (P1):</span>
                <span className="text-secondary font-bold">8.0% ($8,000.00)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Max Overall Loss:</span>
                <span className="text-tertiary font-bold">10.0% ($10,000.00)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Max Daily Loss:</span>
                <span className="text-tertiary font-bold">5.0% ($5,000.00)</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-surface-container-low border border-surface-border/50 shadow-sm space-y-3">
            <span className="font-mono text-[10px] uppercase font-bold text-slate-400">Bridge Status</span>
            <div className="flex items-center gap-2 text-xs text-secondary font-mono">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span>Ready for Auto-Sync with MT5 EA</span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              To configure auto-sync credentials and download the EA, visit the MT5 Connections page.
            </p>
            <div className="pt-2">
              <a
                href="/mt5-connections"
                className="text-xs text-primary hover:underline font-semibold"
              >
                Go to MT5 Connections →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 4. ACCOUNTS LIST TAB */}
      {activeTab === 'ACCOUNTS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => {
              const isActive = activeAccount?.id === acc.id;
              return (
                <div
                  key={acc.id}
                  className={`p-5 rounded-xl bg-surface-container-low border transition-all flex flex-col justify-between space-y-4 ${
                    isActive
                      ? 'border-primary bg-surface-container shadow-md'
                      : 'border-surface-border/40 hover:border-surface-border'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-mono text-[10px] font-bold uppercase">
                        {acc.accountType}
                      </span>
                      {isActive ? (
                        <span className="text-[11px] text-secondary font-semibold flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                        </span>
                      ) : (
                        <button
                          onClick={() => setActiveAccount(acc)}
                          className="text-xs text-primary hover:underline font-semibold"
                        >
                          Set Active
                        </button>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white mt-3">{acc.accountName}</h3>
                    <p className="text-xs text-slate-400">{acc.broker || 'MetaTrader 5 Account'}</p>

                    <div className="mt-4 pt-3 border-t border-surface-border/30">
                      <span className="text-xs text-slate-500 font-mono">Initial Balance</span>
                      <div className="text-xl font-bold font-mono text-white mt-0.5">
                        ${Number(acc.initialBalance).toLocaleString()}{' '}
                        <span className="text-xs text-slate-400 font-normal">{acc.currency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-surface-border/30">
                    <span className="text-secondary flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> Ready for MT5
                    </span>
                    {accounts.length > 1 && (
                      <button
                        onClick={() => handleArchive(acc.id)}
                        className="text-tertiary hover:underline"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface-container-low border border-surface-border rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border/40">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                <span>Create Trading Account</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-tertiary/10 border border-tertiary/20 text-tertiary text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold uppercase text-slate-400">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex 100k Funded, FTMO Phase 1"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full h-9 px-3 bg-surface-container rounded-lg border border-surface-border/40 text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase text-slate-400">Account Type</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as AccountType)}
                    className="w-full h-9 px-2.5 bg-surface-container rounded-lg border border-surface-border/40 text-white outline-none font-bold"
                  >
                    <option value="PROP">Prop Firm</option>
                    <option value="PERSONAL">Personal Live</option>
                    <option value="DEMO">Demo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase text-slate-400">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-9 px-2.5 bg-surface-container rounded-lg border border-surface-border/40 text-white outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="THB">THB (฿)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold uppercase text-slate-400">Initial Balance</label>
                <input
                  type="number"
                  step="100"
                  required
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full h-9 px-3 bg-surface-container rounded-lg border border-surface-border/40 text-white font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase text-slate-400">Broker / Prop Firm</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Trader, FTMO"
                    value={broker}
                    onChange={(e) => setBroker(e.target.value)}
                    className="w-full h-9 px-3 bg-surface-container rounded-lg border border-surface-border/40 text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase text-slate-400">MT5 Server</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex-Live02"
                    value={mt5Server}
                    onChange={(e) => setMt5Server(e.target.value)}
                    className="w-full h-9 px-3 bg-surface-container rounded-lg border border-surface-border/40 text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border/40">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-9 px-5 rounded-lg bg-primary hover:bg-primary/90 text-slate-950 font-bold text-xs transition-colors shadow-sm"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
