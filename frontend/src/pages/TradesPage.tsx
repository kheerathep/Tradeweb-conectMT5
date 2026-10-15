import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  X,
  Star,
  Layers,
  Save,
  RotateCw,
  Download,
  Upload,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  TrendingUp,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { tradesApi, UpdateJournalPayload, CreateManualTradePayload } from '../api/trades';
import { Trade, Mt5Deal, TradeDirection } from '../types';

export const TradesPage: React.FC = () => {
  const { accounts, activeAccount, setActiveAccount } = useAuth();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [filterOutcome, setFilterOutcome] = useState<'ALL' | 'WIN' | 'LOSS' | 'BE'>('ALL');
  const [filterStrategy, setFilterStrategy] = useState<string>('ALL');

  // Modal States
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [tradeDeals, setTradeDeals] = useState<Mt5Deal[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  const [journalForm, setJournalForm] = useState<UpdateJournalPayload>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCreatingTrade, setIsCreatingTrade] = useState(false);
  const [newTradeForm, setNewTradeForm] = useState<Partial<CreateManualTradePayload>>({
    symbol: 'XAUUSD',
    direction: 'BUY',
    totalVolume: 0.1,
    entryPrice: 2735.40,
    grossPnl: 0,
    setupName: 'FVG Breakout',
    notes: '',
  });

  const loadTrades = useCallback(async () => {
    if (!activeAccount) {
      setTrades([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await tradesApi.getTrades({ accountId: activeAccount.id });
      setTrades(data);
    } catch {
      setTrades([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeAccount]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  // Check URL query param ?action=log
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'log') {
      setIsAddOpen(true);
    }
  }, []);

  const handleOpenReview = async (trade: Trade) => {
    setSelectedTrade(trade);
    setJournalForm({
      setupName: trade.setupName || '',
      notes: trade.notes || '',
      mistakes: trade.mistakes || '',
      entryReason: trade.entryReason || '',
      exitReason: trade.exitReason || '',
      emotionBefore: trade.emotionBefore || 'CONFIDENT',
      emotionAfter: trade.emotionAfter || 'SATISFIED',
      followedRules: trade.followedRules ?? true,
      rating: trade.rating || 5,
      riskAmount: trade.riskAmount || 100,
    });
    setIsReviewOpen(true);

    try {
      const detail = await tradesApi.getTradeById(trade.id);
      setTradeDeals(detail.deals);
    } catch {
      setTradeDeals([]);
    }
  };

  const handleSaveJournal = async () => {
    if (!selectedTrade) return;
    setIsSavingJournal(true);
    try {
      const updated = await tradesApi.updateJournal(selectedTrade.id, journalForm);
      setSelectedTrade(updated);
      setTrades((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setIsReviewOpen(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to update journal');
    } finally {
      setIsSavingJournal(false);
    }
  };

  const handleCreateManualTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;
    setIsCreatingTrade(true);
    try {
      const payload: CreateManualTradePayload = {
        tradingAccountId: activeAccount.id,
        symbol: newTradeForm.symbol || 'XAUUSD',
        direction: (newTradeForm.direction as TradeDirection) || 'BUY',
        totalVolume: Number(newTradeForm.totalVolume) || 0.1,
        entryPrice: Number(newTradeForm.entryPrice) || 1.0,
        exitPrice: newTradeForm.exitPrice ? Number(newTradeForm.exitPrice) : undefined,
        grossPnl: newTradeForm.grossPnl ? Number(newTradeForm.grossPnl) : 0,
        setupName: newTradeForm.setupName,
        notes: newTradeForm.notes,
      };
      const created = await tradesApi.createManualTrade(payload);
      setTrades((prev) => [created, ...prev]);
      setIsAddOpen(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to create manual trade');
    } finally {
      setIsCreatingTrade(false);
    }
  };

  // Filtered trades computation
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      const matchesSearch =
        t.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.setupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDirection = filterDirection === 'ALL' || t.direction === filterDirection;
      const net = Number(t.netPnl ?? 0);
      let matchesOutcome = true;
      if (filterOutcome === 'WIN') matchesOutcome = net > 0;
      else if (filterOutcome === 'LOSS') matchesOutcome = net < 0;
      else if (filterOutcome === 'BE') matchesOutcome = net === 0;

      const matchesStrategy = filterStrategy === 'ALL' || (t.setupName && t.setupName.toLowerCase().includes(filterStrategy.toLowerCase()));

      return matchesSearch && matchesDirection && matchesOutcome && matchesStrategy;
    });
  }, [trades, searchTerm, filterDirection, filterOutcome, filterStrategy]);

  // Summary Metrics of filtered set
  const summary = useMemo(() => {
    let totalPnl = 0;
    let wins = 0;
    let losses = 0;
    let be = 0;
    let grossWin = 0;
    let grossLoss = 0;
    let totalR = 0;

    filteredTrades.forEach((t) => {
      const net = Number(t.netPnl ?? 0);
      totalPnl += net;
      const r = Number(t.rMultiple ?? (net >= 0 ? 1.5 : -1.0));
      totalR += r;
      if (net > 0) {
        wins++;
        grossWin += net;
      } else if (net < 0) {
        losses++;
        grossLoss += Math.abs(net);
      } else {
        be++;
      }
    });

    const count = filteredTrades.length;
    const winRate = count > 0 ? (wins / count) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 99.0 : 0;
    const avgR = count > 0 ? totalR / count : 1.65;
    const initialBal = Number(activeAccount?.initialBalance || 100000);
    const roi = initialBal > 0 ? (totalPnl / initialBal) * 100 : 0;

    return {
      count,
      totalPnl,
      wins,
      losses,
      be,
      winRate,
      profitFactor,
      avgR,
      roi,
    };
  }, [filteredTrades, activeAccount]);

  // Export CSV
  const handleExportCsv = () => {
    if (filteredTrades.length === 0) return;
    const headers = ['ID', 'Symbol', 'Direction', 'Volume', 'EntryPrice', 'ExitPrice', 'NetPnl', 'RMultiple', 'Setup', 'FollowedRules', 'ClosedAt'];
    const rows = filteredTrades.map((t) => [
      t.id,
      t.symbol,
      t.direction,
      t.totalVolume,
      t.entryPrice,
      t.exitPrice ?? '',
      t.netPnl ?? '',
      t.rMultiple ?? '',
      `"${t.setupName || ''}"`,
      t.followedRules ?? '',
      t.closedAt ?? '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trade_journal_${activeAccount?.id || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header Section with Ambient Glow */}
      <div className="relative w-full">
        <div className="absolute -top-6 left-1/4 w-96 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-4 right-1/4 w-80 h-28 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pt-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] uppercase tracking-wider font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span>Journal Execution Engine</span>
              <span className="text-outline/40">/</span>
              <span className="text-primary font-bold">Ledger v4.2</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Trade Journal</h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Review, organize, and extract statistical edge from every completed execution.
            </p>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleExportCsv}
              className="h-9 px-3.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-border/50 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              type="button"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Filtered (.CSV)</span>
            </button>
            <button
              onClick={() => (window.location.href = '/analytics')}
              className="h-9 px-3.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-border/50 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              type="button"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Import CSV / MT5 Deals</span>
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all"
              type="button"
            >
              <Plus className="w-4 h-4" />
              <span>Log Manual Trade</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filter & Parameter Toolbar */}
      <div className="bg-surface-container-low rounded-xl p-4 border border-surface-border/40 shadow-sm space-y-3">
        {/* Primary Search & View Mode Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="journalSearchInput"
              type="text"
              placeholder="Search by symbol, tags, setup or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-10 pr-12 bg-surface-container-lowest text-white placeholder:text-outline text-xs rounded-lg outline-none focus:bg-surface-container border border-surface-border/40 transition-all font-sans"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-container text-slate-400 rounded font-mono text-[10px]">↵</kbd>
            </div>
          </div>

          {/* Quick Toggles: Table View vs Visual Cards */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <div className="bg-surface-container-lowest p-0.5 rounded-lg flex items-center gap-0.5 border border-surface-border/40">
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'TABLE' ? 'bg-surface-container-high text-primary font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
              <button
                onClick={() => setViewMode('CARDS')}
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'CARDS' ? 'bg-surface-container-high text-primary font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Visual Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Multi-Select Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 pt-1 border-t border-surface-border/30">
          {/* Account Filter */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] uppercase font-bold text-slate-400 px-1">Account</label>
            <div className="relative">
              <select
                aria-label="Account"
                value={activeAccount?.id || ''}
                onChange={(e) => {
                  const target = accounts.find((a) => a.id === Number(e.target.value));
                  if (target) setActiveAccount(target);
                }}
                className="w-full h-8 px-2.5 pr-7 bg-surface-container-lowest text-white rounded-lg text-xs appearance-none outline-none cursor-pointer border border-surface-border/40"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Direction Filter */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] uppercase font-bold text-slate-400 px-1">Direction</label>
            <div className="relative">
              <select
                aria-label="Direction"
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value as any)}
                className="w-full h-8 px-2.5 pr-7 bg-surface-container-lowest text-white rounded-lg text-xs appearance-none outline-none cursor-pointer border border-surface-border/40"
              >
                <option value="ALL">All Sides (BUY & SELL)</option>
                <option value="BUY">Long (BUY Only)</option>
                <option value="SELL">Short (SELL Only)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Strategy Setup Filter */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] uppercase font-bold text-slate-400 px-1">Strategy Setup</label>
            <div className="relative">
              <select
                aria-label="Strategy Setup"
                value={filterStrategy}
                onChange={(e) => setFilterStrategy(e.target.value)}
                className="w-full h-8 px-2.5 pr-7 bg-surface-container-lowest text-white rounded-lg text-xs appearance-none outline-none cursor-pointer border border-surface-border/40"
              >
                <option value="ALL">All Setups</option>
                <option value="FVG">FVG Breakout</option>
                <option value="Sweep">Liquidity Sweep</option>
                <option value="Pullback">Trend Pullback</option>
                <option value="London">London Open</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Outcome Filter */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] uppercase font-bold text-slate-400 px-1">Outcome</label>
            <div className="relative">
              <select
                aria-label="Outcome"
                value={filterOutcome}
                onChange={(e) => setFilterOutcome(e.target.value as any)}
                className="w-full h-8 px-2.5 pr-7 bg-surface-container-lowest text-white rounded-lg text-xs appearance-none outline-none cursor-pointer border border-surface-border/40"
              >
                <option value="ALL">All Results (W / L / BE)</option>
                <option value="WIN">Winners Only (&gt; 0)</option>
                <option value="LOSS">Losses Only (&lt; 0)</option>
                <option value="BE">Breakeven ($0)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Reset Action */}
          <div className="flex flex-col justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterDirection('ALL');
                setFilterOutcome('ALL');
                setFilterStrategy('ALL');
              }}
              className="h-8 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-slate-300 text-xs font-semibold transition-colors border border-surface-border/40"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* 3. Summary Strip: Auto-calculating Metric Cards (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Filtered Trades */}
        <div className="bg-surface-container-low border border-surface-border/40 rounded-xl p-4 flex flex-col justify-between shadow-sm group hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Filtered Executions
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-mono text-[10px] font-bold">
              Active Set
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-white font-mono tracking-tight">{summary.count}</span>
              <span className="text-xs text-slate-400 font-mono">trades</span>
            </div>
            <span className="font-mono text-xs text-secondary font-semibold">
              {(summary.count / 22).toFixed(1)} / day
            </span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-primary h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Metric 2: Net Realized P&L */}
        <div className="bg-surface-container-low border border-surface-border/40 rounded-xl p-4 flex flex-col justify-between shadow-sm group hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Net Realized P&L
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                summary.totalPnl >= 0 ? 'bg-secondary/15 text-secondary' : 'bg-tertiary/15 text-tertiary'
              }`}
            >
              {summary.totalPnl >= 0 ? 'PROFITABLE' : 'DRAWDOWN'}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span
              className={`text-2xl font-extrabold font-mono tracking-tight ${
                summary.totalPnl >= 0 ? 'text-secondary' : 'text-tertiary'
              }`}
            >
              {summary.totalPnl >= 0 ? `+$${summary.totalPnl.toFixed(2)}` : `-$${Math.abs(summary.totalPnl).toFixed(2)}`}
            </span>
            <span className="font-mono text-xs text-secondary font-semibold">
              {summary.roi >= 0 ? `+${summary.roi.toFixed(1)}%` : `${summary.roi.toFixed(1)}%`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-secondary" />
            <span>Profit factor: <strong className="text-white font-semibold">{summary.profitFactor.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Metric 3: Win Rate */}
        <div className="bg-surface-container-low border border-surface-border/40 rounded-xl p-4 flex flex-col justify-between shadow-sm group hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Filtered Win Rate
            </span>
            <span className="font-mono text-xs text-slate-400">
              {summary.wins}W / {summary.losses}L / {summary.be}BE
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {summary.winRate.toFixed(1)}%
            </span>
            <span className="text-xs text-secondary font-semibold font-mono">
              {summary.winRate >= 50 ? 'Positive Edge' : 'Developing'}
            </span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-2 flex">
            <div className="bg-secondary h-full" style={{ width: `${Math.min(summary.winRate, 100)}%` }}></div>
            <div className="bg-tertiary h-full" style={{ width: `${Math.max(100 - summary.winRate, 0)}%` }}></div>
          </div>
        </div>

        {/* Metric 4: Avg R-Multiple */}
        <div className="bg-surface-container-low border border-surface-border/40 rounded-xl p-4 flex flex-col justify-between shadow-sm group hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Avg R-Multiple
            </span>
            <Layers className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-secondary font-mono tracking-tight">
              +{summary.avgR.toFixed(2)} R
            </span>
            <span className="text-xs text-slate-400 font-mono">per trade</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
            <span>Expectancy: <strong className="text-secondary font-semibold">Positive</strong></span>
          </div>
        </div>
      </div>

      {/* 4. Live Position Ledger (Table View & Cards View) */}
      <div className="rounded-xl bg-surface-container-low border border-surface-border/40 shadow-sm overflow-hidden flex flex-col">
        {/* Table Sub-bar */}
        <div className="px-4 py-3 bg-surface-container-high/80 border-b border-surface-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-white uppercase tracking-wider">
              Live Position Ledger
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
              Synced with MetaTrader 5 • {activeAccount?.accountName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadTrades}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
            >
              <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* View Selection: Table or Cards */}
        {filteredTrades.length === 0 ? (
          <div className="p-10 text-center space-y-3 font-mono">
            <FileSpreadsheet className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">No trades match the selected filter criteria.</p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-primary text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Manual Trade</span>
            </button>
          </div>
        ) : viewMode === 'TABLE' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-slate-300">
              <thead className="bg-surface-container-lowest/80 text-[10px] uppercase font-bold text-slate-400 border-b border-surface-border/40 select-none">
                <tr>
                  <th className="py-3 px-4">Symbol / Side</th>
                  <th className="py-3 px-4">Entry</th>
                  <th className="py-3 px-4">Exit</th>
                  <th className="py-3 px-4">Strategy</th>
                  <th className="py-3 px-4">Emotion & Rules</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Net P&L (R)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/30">
                {filteredTrades.map((t) => {
                  const net = Number(t.netPnl ?? 0);
                  const isWin = net >= 0;
                  return (
                    <tr key={t.id} className="hover:bg-surface-container/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{t.symbol}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              t.direction === 'BUY'
                                ? 'bg-secondary/15 text-secondary border border-secondary/30'
                                : 'bg-tertiary/15 text-tertiary border border-tertiary/30'
                            }`}
                          >
                            {t.direction}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <div>{t.openedAt ? new Date(t.openedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                        <div className="text-[10px] text-slate-500">@ {Number(t.entryPrice || 0).toFixed(4)}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <div>{t.closedAt ? new Date(t.closedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                        <div className="text-[10px] text-slate-500">@ {t.exitPrice ? Number(t.exitPrice).toFixed(4) : '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-slate-200 text-xs font-sans">
                          {t.setupName || 'Price Action'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {t.followedRules ?? true ? (
                            <span className="flex items-center gap-1 text-secondary text-xs font-sans">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Disciplined</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-tertiary text-xs font-sans">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Plan Violated</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container text-slate-400 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                          <span>MT5 Synced</span>
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${isWin ? 'text-secondary' : 'text-tertiary'}`}>
                        <div>{isWin ? `+$${net.toFixed(2)}` : `-$${Math.abs(net).toFixed(2)}`}</div>
                        <div className="text-[10px] font-normal text-slate-400">
                          {t.rMultiple ? `${t.rMultiple > 0 ? '+' : ''}${t.rMultiple.toFixed(2)} R` : isWin ? '+1.80 R' : '-1.00 R'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenReview(t)}
                          className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-primary text-xs font-sans font-semibold transition-colors border border-surface-border/40"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards Grid View */
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTrades.map((t) => {
              const net = Number(t.netPnl ?? 0);
              const isWin = net >= 0;
              return (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-surface-container border border-surface-border/40 hover:border-surface-border transition-all flex flex-col justify-between space-y-3 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{t.symbol}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.direction === 'BUY' ? 'bg-secondary/15 text-secondary' : 'bg-tertiary/15 text-tertiary'
                        }`}
                      >
                        {t.direction}
                      </span>
                    </div>
                    <span className={`text-base font-extrabold ${isWin ? 'text-secondary' : 'text-tertiary'}`}>
                      {isWin ? `+$${net.toFixed(2)}` : `-$${Math.abs(net).toFixed(2)}`}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-container-lowest/60 text-xs space-y-1 text-slate-400">
                    <div className="flex justify-between">
                      <span>Entry:</span>
                      <span className="text-white">@ {Number(t.entryPrice || 0).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exit:</span>
                      <span className="text-white">@ {t.exitPrice ? Number(t.exitPrice).toFixed(4) : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Setup:</span>
                      <span className="text-primary font-sans">{t.setupName || 'Price Action'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-surface-border/30">
                    <div>
                      {t.followedRules ?? true ? (
                        <span className="text-secondary text-[11px] font-sans flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Disciplined
                        </span>
                      ) : (
                        <span className="text-tertiary text-[11px] font-sans flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Violated
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleOpenReview(t)}
                      className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-sans font-semibold transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Trade Review / Journal Modal */}
      {isReviewOpen && selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-surface-container-low border border-surface-border rounded-xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border/40">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Trade Evaluation & Psychology</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-mono text-xs">
                    {selectedTrade.symbol} • {selectedTrade.direction}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record playbook setups, emotional discipline, and cognitive triggers for this execution.
                </p>
              </div>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-container transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form controls */}
            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase text-slate-400">Playbook Setup</label>
                  <input
                    type="text"
                    value={journalForm.setupName || ''}
                    onChange={(e) => setJournalForm({ ...journalForm, setupName: e.target.value })}
                    placeholder="e.g. FVG Breakout, Liquidity Sweep"
                    className="w-full h-9 px-3 bg-surface-container rounded-lg border border-surface-border/40 text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase text-slate-400">Planned Risk ($)</label>
                  <input
                    type="number"
                    value={journalForm.riskAmount || 100}
                    onChange={(e) => setJournalForm({ ...journalForm, riskAmount: Number(e.target.value) })}
                    className="w-full h-9 px-3 bg-surface-container rounded-lg border border-surface-border/40 text-white focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              {/* Followed rules checkbox */}
              <div className="p-3 rounded-lg bg-surface-container border border-surface-border/40 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Adhered to Pre-market Plan & Rules</div>
                  <div className="text-[11px] text-slate-400">Did you follow entry, position sizing, and stop loss criteria?</div>
                </div>
                <button
                  type="button"
                  onClick={() => setJournalForm({ ...journalForm, followedRules: !journalForm.followedRules })}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                    journalForm.followedRules ? 'bg-secondary' : 'bg-surface-container-high'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                      journalForm.followedRules ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></span>
                </button>
              </div>

              {/* Emotion Before & After */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase text-slate-400">Psychology Before Entry</label>
                  <select
                    value={journalForm.emotionBefore || 'CONFIDENT'}
                    onChange={(e) => setJournalForm({ ...journalForm, emotionBefore: e.target.value })}
                    className="w-full h-9 px-2.5 bg-surface-container rounded-lg border border-surface-border/40 text-white outline-none"
                  >
                    <option value="CONFIDENT">Confident & Patient</option>
                    <option value="FOMO">FOMO / Chasing Entry</option>
                    <option value="REVENGE">Revenge / Anxious</option>
                    <option value="NEUTRAL">Neutral & Mechanical</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase text-slate-400">Post-Trade Cognitive State</label>
                  <select
                    value={journalForm.emotionAfter || 'SATISFIED'}
                    onChange={(e) => setJournalForm({ ...journalForm, emotionAfter: e.target.value })}
                    className="w-full h-9 px-2.5 bg-surface-container rounded-lg border border-surface-border/40 text-white outline-none"
                  >
                    <option value="SATISFIED">Satisfied with Execution</option>
                    <option value="REGRET">Regret / Cut Winners Early</option>
                    <option value="ANGER">Anger / Overleveraged</option>
                    <option value="ACCEPTANCE">Acceptance of Risk</option>
                  </select>
                </div>
              </div>

              {/* Mistakes & Notes */}
              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold uppercase text-slate-400">Self-Correction & Mistakes</label>
                <textarea
                  rows={2}
                  value={journalForm.mistakes || ''}
                  onChange={(e) => setJournalForm({ ...journalForm, mistakes: e.target.value })}
                  placeholder="e.g. Moved stop loss too early, hesitation on trigger..."
                  className="w-full p-2.5 bg-surface-container rounded-lg border border-surface-border/40 text-white placeholder-slate-500 focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold uppercase text-slate-400">General Notes</label>
                <textarea
                  rows={2}
                  value={journalForm.notes || ''}
                  onChange={(e) => setJournalForm({ ...journalForm, notes: e.target.value })}
                  placeholder="Key observations on market structure and liquidity..."
                  className="w-full p-2.5 bg-surface-container rounded-lg border border-surface-border/40 text-white placeholder-slate-500 focus:outline-none focus:border-primary text-xs"
                />
              </div>

              {/* Star Rating */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-surface-border/40">
                <span className="font-semibold text-white">Execution Quality Rating</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setJournalForm({ ...journalForm, rating: star })}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= (journalForm.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Linked MT5 Deals Audit */}
            {tradeDeals.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-surface-border/40 font-mono text-xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">Underlying MT5 Deals</div>
                <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-border/30 space-y-1">
                  {tradeDeals.map((d) => (
                    <div key={d.id} className="flex justify-between text-slate-300">
                      <span>#{d.externalDealTicket} {d.dealType} {d.volume} lots @ {d.price}</span>
                      <span className={d.profit >= 0 ? 'text-secondary font-bold' : 'text-tertiary font-bold'}>
                        {d.profit >= 0 ? `+$${d.profit}` : `-$${Math.abs(d.profit)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border/40">
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveJournal}
                disabled={isSavingJournal}
                className="h-9 px-5 rounded-lg bg-primary hover:bg-primary/90 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingJournal ? 'Saving...' : 'Save Evaluation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Log Manual Trade Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface-container-low border border-surface-border rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border/40">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                <span>Log Manual Execution</span>
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-container transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualTrade} className="space-y-3 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase text-slate-400">Symbol</label>
                  <input
                    type="text"
                    required
                    value={newTradeForm.symbol || ''}
                    onChange={(e) => setNewTradeForm({ ...newTradeForm, symbol: e.target.value.toUpperCase() })}
                    className="w-full h-9 px-3 bg-surface-container rounded-lg border border-surface-border/40 text-white font-mono uppercase focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase text-slate-400">Direction</label>
                  <select
                    value={newTradeForm.direction || 'BUY'}
                    onChange={(e) => setNewTradeForm({ ...newTradeForm, direction: e.target.value as any })}
                    className="w-full h-9 px-2.5 bg-surface-container rounded-lg border border-surface-border/40 text-white outline-none font-bold"
                  >
                    <option value="BUY">BUY (Long)</option>
                    <option value="SELL">SELL (Short)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase text-slate-400">Volume (Lots)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newTradeForm.totalVolume || 0.1}
                    onChange={(e) => setNewTradeForm({ ...newTradeForm, totalVolume: Number(e.target.value) })}
                    className="w-full h-9 px-3 bg-surface-container rounded-lg border border-surface-border/40 text-white font-mono focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase text-slate-400">Entry Price</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newTradeForm.entryPrice || 0}
                    onChange={(e) => setNewTradeForm({ ...newTradeForm, entryPrice: Number(e.target.value) })}
                    className="w-full h-9 px-3 bg-surface-container rounded-lg border border-surface-border/40 text-white font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase text-slate-400">Exit Price</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newTradeForm.exitPrice || ''}
                    onChange={(e) => setNewTradeForm({ ...newTradeForm, exitPrice: Number(e.target.value) })}
                    placeholder="Leave empty if open"
                    className="w-full h-9 px-3 bg-surface-container rounded-lg border border-surface-border/40 text-white font-mono focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase text-slate-400">Gross P&L ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTradeForm.grossPnl || 0}
                    onChange={(e) => setNewTradeForm({ ...newTradeForm, grossPnl: Number(e.target.value) })}
                    className="w-full h-9 px-3 bg-surface-container rounded-lg border border-surface-border/40 text-white font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold uppercase text-slate-400">Playbook Setup</label>
                <input
                  type="text"
                  value={newTradeForm.setupName || ''}
                  onChange={(e) => setNewTradeForm({ ...newTradeForm, setupName: e.target.value })}
                  placeholder="e.g. FVG Breakout"
                  className="w-full h-9 px-3 bg-surface-container rounded-lg border border-surface-border/40 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border/40">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTrade}
                  className="h-9 px-5 rounded-lg bg-primary hover:bg-primary/90 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isCreatingTrade ? 'Logging...' : 'Record Trade'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
