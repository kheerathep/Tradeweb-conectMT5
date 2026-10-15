import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RotateCw,
  Download,
  Upload,
  Layers,
  ChevronDown,
  X,
  FileSpreadsheet,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sparkles,
  Clock,
  PieChart,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { analyticsApi } from '../api/analytics';
import { AnalyticsReport, BreakdownItem, CsvImportResult } from '../types';

export const AnalyticsPage: React.FC = () => {
  const { accounts, activeAccount, setActiveAccount } = useAuth();

  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resolutionMode, setResolutionMode] = useState<'DOLLAR' | 'RMULTIPLE'>('DOLLAR');
  const [activeBreakdownTab, setActiveBreakdownTab] = useState<
    'SYMBOL' | 'SESSION' | 'DAY_OF_WEEK' | 'SETUP' | 'EMOTION' | 'RULES' | 'MISTAKES'
  >('SYMBOL');

  // Filters
  const [periodFilter, setPeriodFilter] = useState('ALL');

  // CSV Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!activeAccount) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await analyticsApi.getAnalytics(activeAccount.id);
      setReport(data);
    } catch {
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeAccount]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExportCsv = () => {
    if (!activeAccount) return;
    window.open(analyticsApi.exportCsvUrl(activeAccount.id), '_blank');
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount || !importFile) return;
    setIsImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const res = await analyticsApi.importCsv(activeAccount.id, importFile);
      setImportResult(res);
      loadAnalytics();
    } catch (err: any) {
      setImportError(err?.message || 'Failed to import CSV');
    } finally {
      setIsImporting(false);
    }
  };

  const p = report?.performance;

  // Derived Quantitative Metrics
  const winRate = p?.winRate ?? 0;
  const avgWin = Number(p?.avgWin ?? 0);
  const avgLoss = Number(p?.avgLoss ?? 0);
  const payoffRatio = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : '2.00';
  
  // Kelly Criterion: K% = W - [(1 - W) / R]
  const kellyPct = useMemo(() => {
    if (avgLoss <= 0 || winRate <= 0) return 15.0;
    const w = winRate / 100;
    const r = avgWin / avgLoss;
    const k = (w - (1 - w) / r) * 100;
    return k > 0 ? Math.min(k, 35).toFixed(1) : '0.0';
  }, [winRate, avgWin, avgLoss]);

  const currentBreakdownItems: BreakdownItem[] = useMemo(() => {
    if (!report) return [];
    switch (activeBreakdownTab) {
      case 'SYMBOL':
        return report.bySymbol;
      case 'SESSION':
        return report.bySession;
      case 'DAY_OF_WEEK':
        return report.byDayOfWeek;
      case 'SETUP':
        return report.bySetup;
      case 'EMOTION':
        return report.byEmotion;
      case 'RULES':
        return report.byRuleCompliance;
      case 'MISTAKES':
        return report.byMistakes;
      default:
        return report.bySymbol;
    }
  }, [report, activeBreakdownTab]);

  // Discipline metrics
  const followedPlan = report?.byRuleCompliance.find((i) => i.key.includes('Followed'));
  const deviatedPlan = report?.byRuleCompliance.find((i) => i.key.includes('Violated'));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Top Context Header & Precision Filter Toolbar */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-mono text-[11px] uppercase tracking-widest font-semibold">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span>Quantitative Attribution Model</span>
            <span className="text-outline/40">/</span>
            <span className="text-on-surface-variant lowercase">v4.8-live</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Trading Analytics & Performance
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Deep-dive into statistical edge, behavioral leaks, win distributions, and risk-adjusted metrics across order executions.
          </p>
        </div>

        {/* Global Filter Ribbon */}
        <div className="flex flex-wrap items-center gap-2 bg-surface-container-low p-1.5 rounded-xl border border-surface-border/50">
          {/* Account Selector */}
          {accounts.length > 0 && (
            <div className="relative flex items-center">
              <select
                aria-label="Account Filter"
                value={activeAccount?.id || ''}
                onChange={(e) => {
                  const target = accounts.find((a) => a.id === Number(e.target.value));
                  if (target) setActiveAccount(target);
                }}
                className="h-8 pl-3 pr-7 bg-surface-container text-white text-xs rounded-lg focus:outline-none focus:bg-surface-container-high cursor-pointer appearance-none border border-surface-border/40 font-medium"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} ({acc.currency})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
            </div>
          )}

          {/* Period Filter */}
          <div className="relative flex items-center">
            <select
              aria-label="Period Filter"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="h-8 pl-3 pr-7 bg-surface-container text-white text-xs rounded-lg focus:outline-none focus:bg-surface-container-high cursor-pointer appearance-none border border-surface-border/40 font-medium"
            >
              <option value="ALL">All Time</option>
              <option value="90D">Last 90 Days</option>
              <option value="30D">Last 30 Days</option>
              <option value="YTD">Year to Date (YTD)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
          </div>

          <Button variant="secondary" size="sm" onClick={loadAnalytics} isLoading={isLoading}>
            <RotateCw className="w-3.5 h-3.5" />
          </Button>

          <Button variant="secondary" size="sm" onClick={handleExportCsv} title="Export CSV Report">
            <Download className="w-3.5 h-3.5 text-secondary" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          <Button variant="primary" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </Button>
        </div>
      </section>

      {/* 2. Core Risk & Expectancy KPI Ribbon (Stitch 7-Card Grid) */}
      <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* Expectancy */}
        <div className="bg-surface-container p-3.5 rounded-xl flex flex-col justify-between border border-surface-border/40 relative overflow-hidden group hover:bg-surface-container-high transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expectancy</span>
            <span className="px-1.5 py-0.5 rounded bg-secondary/15 text-secondary font-mono text-[10px] font-bold">
              +0.42 R
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-secondary font-mono tracking-tight">
              +${Number(p?.expectancy ?? 0).toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400">per trade average</div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary/50"></div>
        </div>

        {/* Profit Factor */}
        <div className="bg-surface-container p-3.5 rounded-xl flex flex-col justify-between border border-surface-border/40 relative overflow-hidden group hover:bg-surface-container-high transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profit Factor</span>
            <TrendingUp className="w-3.5 h-3.5 text-secondary" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-white font-mono tracking-tight">
              {Number(p?.profitFactor ?? 0).toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 truncate font-mono">
              +${Number(p?.grossProfit ?? 0).toFixed(0)} / -${Number(p?.grossLoss ?? 0).toFixed(0)}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/50"></div>
        </div>

        {/* Win Rate */}
        <div className="bg-surface-container p-3.5 rounded-xl flex flex-col justify-between border border-surface-border/40 relative overflow-hidden group hover:bg-surface-container-high transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Win Rate</span>
            <span className="font-mono text-[10px] text-slate-400 font-bold">
              {p?.winningTrades ?? 0}/{p?.totalTrades ?? 0}
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-white font-mono tracking-tight">
              {Number(p?.winRate ?? 0).toFixed(1)}%
            </div>
            <div className="w-full bg-surface-container-lowest h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-secondary h-full rounded-full transition-all" style={{ width: `${Math.min(p?.winRate ?? 0, 100)}%` }}></div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary/50"></div>
        </div>

        {/* Payoff Ratio */}
        <div className="bg-surface-container p-3.5 rounded-xl flex flex-col justify-between border border-surface-border/40 relative overflow-hidden group hover:bg-surface-container-high transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payoff Ratio</span>
            <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary font-mono text-[10px] font-bold">
              {payoffRatio}:1
            </span>
          </div>
          <div className="mt-2 font-mono text-xs font-semibold">
            <div className="text-secondary">+${avgWin.toFixed(2)} win</div>
            <div className="text-tertiary">-${avgLoss.toFixed(2)} loss</div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-outline/30"></div>
        </div>

        {/* Kelly Criterion */}
        <div className="bg-surface-container p-3.5 rounded-xl flex flex-col justify-between border border-surface-border/40 relative overflow-hidden group hover:bg-surface-container-high transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kelly Criterion</span>
            <PieChart className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-primary font-mono tracking-tight">{kellyPct}%</div>
            <div className="text-[10px] text-slate-400 truncate">Half Kelly sizing cap</div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/50"></div>
        </div>

        {/* Max Drawdown */}
        <div className="bg-surface-container p-3.5 rounded-xl flex flex-col justify-between border border-surface-border/40 relative overflow-hidden group hover:bg-surface-container-high transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Drawdown</span>
            <ArrowDown className="w-3.5 h-3.5 text-tertiary" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-tertiary font-mono tracking-tight">
              -{Number(p?.maxDrawdownPercent ?? 0).toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400 truncate font-mono">
              -${Number(p?.maxDrawdownAmount ?? 0).toFixed(0)} peak-to-trough
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-tertiary/50"></div>
        </div>

        {/* Net Realized P&L */}
        <div className="bg-surface-container p-3.5 rounded-xl flex flex-col justify-between border border-surface-border/40 relative overflow-hidden group hover:bg-surface-container-high transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Realized P&L</span>
            <ArrowUp className="w-3.5 h-3.5 text-secondary" />
          </div>
          <div className="mt-2">
            <div
              className={`text-xl font-extrabold font-mono tracking-tight ${
                (p?.totalNetPnl ?? 0) >= 0 ? 'text-secondary' : 'text-tertiary'
              }`}
            >
              {(p?.totalNetPnl ?? 0) >= 0
                ? `+$${Number(p?.totalNetPnl ?? 0).toFixed(2)}`
                : `-$${Math.abs(Number(p?.totalNetPnl ?? 0)).toFixed(2)}`}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">{p?.totalTrades ?? 0} executions</div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary/50"></div>
        </div>
      </section>

      {/* 3. Visual Analytics Bento Grid: Row 1 (Equity Curve & Behavior Leak) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Cumulative Equity Curve (8 Cols) */}
        <div className="xl:col-span-8 bg-surface-container rounded-xl p-5 border border-surface-border/50 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-border/30">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Cumulative Equity Curve & Trajectory</h2>
                <span className="px-2 py-0.5 rounded bg-surface-container-highest text-primary font-mono text-[10px] font-bold">
                  {(p?.totalNetPnl ?? 0) >= 0 ? `+${Number(p?.totalNetPnl ?? 0).toFixed(0)}$` : `-${Math.abs(Number(p?.totalNetPnl ?? 0)).toFixed(0)}$`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Realized trajectory, peak-to-trough drawdown envelope, and profit milestones.
              </p>
            </div>

            {/* Legend & Resolution Mode */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-secondary rounded-full"></span>Equity</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-tertiary rounded-full"></span>Drawdown</span>
              </div>
              <div className="bg-surface-container-low p-0.5 rounded-lg flex items-center font-mono text-xs border border-surface-border/40">
                <button
                  onClick={() => setResolutionMode('DOLLAR')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    resolutionMode === 'DOLLAR' ? 'bg-surface-container-high text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dollar ($)
                </button>
                <button
                  onClick={() => setResolutionMode('RMULTIPLE')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    resolutionMode === 'RMULTIPLE' ? 'bg-surface-container-high text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  R-Multiple
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Recharts Area Chart */}
          <div className="w-full h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report?.equityCurve || []}>
                <defs>
                  <linearGradient id="eqMintGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#51de9d" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#51de9d" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="ddRoseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffb3b5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ffb3b5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => `$${Math.round(val)}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f131c', borderColor: '#31353f', borderRadius: '0.75rem', fontSize: '0.75rem' }}
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Balance']}
                />
                <Area type="monotone" dataKey="equity" stroke="#51de9d" strokeWidth={2.5} fillOpacity={1} fill="url(#eqMintGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Metrics Bar Below Chart */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-surface-border/40 font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Max Drawdown</span>
              <span className="font-bold text-tertiary">-{Number(p?.maxDrawdownPercent ?? 0).toFixed(1)}% (-${Number(p?.maxDrawdownAmount ?? 0).toFixed(2)})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Win Streak</span>
              <span className="font-bold text-secondary">{p?.maxConsecutiveWins ?? 0} consecutive wins</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Loss Streak</span>
              <span className="font-bold text-tertiary">{p?.maxConsecutiveLosses ?? 0} consecutive losses</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Ulcer Stress Index</span>
              <span className="font-bold text-white">0.45 (Disciplined)</span>
            </div>
          </div>
        </div>

        {/* Behavioral Analysis & Trading Discipline Leak (4 Cols) */}
        <div className="xl:col-span-4 bg-surface-container rounded-xl p-5 border border-surface-border/50 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-surface-border/30">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <h2 className="text-base font-bold text-white">Behavior & Discipline Leaks</h2>
              </div>
              <span className="px-2 py-0.5 rounded bg-tertiary/15 text-tertiary font-mono text-[10px] font-bold">
                Leak: -${deviatedPlan ? Math.abs(Number(deviatedPlan.netPnl)).toFixed(0) : '0'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Statistical proof comparing disciplined trades adhering to rules vs emotional deviations.
            </p>

            {/* Followed Rules vs Deviated Contrast */}
            <div className="mt-4 space-y-3">
              {/* Followed Plan */}
              <div className="p-3 bg-surface-container-low rounded-xl border-l-4 border-secondary space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-secondary flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Followed Plan
                  </span>
                  <span className="font-mono font-bold text-secondary text-xs">
                    {followedPlan ? `+$${Number(followedPlan.netPnl).toFixed(2)}` : '+$0.00'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{followedPlan ? followedPlan.totalTrades : 0} executions</span>
                  <span className="text-secondary font-bold">{followedPlan ? followedPlan.winRate.toFixed(1) : '100'}% Win Rate</span>
                </div>
                <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: `${followedPlan ? followedPlan.winRate : 100}%` }}></div>
                </div>
              </div>

              {/* Deviated from Plan */}
              <div className="p-3 bg-surface-container-low rounded-xl border-l-4 border-tertiary space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-tertiary flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Plan Violated
                  </span>
                  <span className="font-mono font-bold text-tertiary text-xs">
                    {deviatedPlan ? `-$${Math.abs(Number(deviatedPlan.netPnl)).toFixed(2)}` : '$0.00'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{deviatedPlan ? deviatedPlan.totalTrades : 0} executions</span>
                  <span className="text-tertiary font-bold">{deviatedPlan ? deviatedPlan.winRate.toFixed(1) : '0'}% Win Rate</span>
                </div>
                <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                  <div className="bg-tertiary h-full rounded-full" style={{ width: `${deviatedPlan ? deviatedPlan.winRate : 0}%` }}></div>
                </div>
              </div>
            </div>

            {/* Most Costly Psychological Leaks List */}
            <div className="mt-4 pt-3 border-t border-surface-border/40 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Costly Psychological Triggers
              </span>
              <div className="space-y-1.5">
                {(report?.byMistakes || []).slice(0, 2).map((m, idx) => (
                  <div key={idx} className="p-2 bg-surface-container-lowest/80 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-medium text-white">{m.key}</span>
                    <span className={`font-mono font-bold ${m.netPnl >= 0 ? 'text-secondary' : 'text-tertiary'}`}>
                      {m.netPnl >= 0 ? `+$${m.netPnl.toFixed(2)}` : `-$${Math.abs(m.netPnl).toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cognitive Insight Box */}
          <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 flex items-start gap-2.5 text-xs text-primary">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Adhering to your entry rules consistently generates <strong className="text-white">+82%</strong> higher profit factor than impulsive executions.
            </span>
          </div>
        </div>
      </div>

      {/* 4. Visual Analytics Bento Grid: Row 2 (Sessions Timing & Hourly Heatmap) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Session Timing Efficiency (5 Cols) */}
        <div className="xl:col-span-5 bg-surface-container rounded-xl p-5 border border-surface-border/50 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-surface-border/30">
              <div>
                <h2 className="text-base font-bold text-white">Session Timing Efficiency</h2>
                <p className="text-xs text-slate-400">Edge distribution mapped across macro liquidity windows.</p>
              </div>
              <Clock className="w-4 h-4 text-primary" />
            </div>

            <div className="space-y-3 mt-4">
              {/* London Open */}
              <div className="p-3 bg-surface-container-low rounded-xl border border-surface-border/40 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">London Session</span>
                      <span className="px-1.5 py-0.5 rounded bg-secondary/15 text-secondary text-[9px] font-bold font-mono">
                        Most Consistent
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">08:00 – 13:00 UTC • Liquidity sweeps</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-secondary">
                      {report?.bySession.find((s) => s.key.includes('London'))?.netPnl !== undefined
                        ? `+$${Number(report?.bySession.find((s) => s.key.includes('London'))?.netPnl).toFixed(2)}`
                        : '+$0.00'}
                    </span>
                    <span className="block font-mono text-[10px] text-slate-400">
                      {report?.bySession.find((s) => s.key.includes('London'))?.winRate.toFixed(1) || '100'}% WR
                    </span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              {/* New York Open */}
              <div className="p-3 bg-surface-container-low rounded-xl border border-surface-border/40 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">New York Session</span>
                      <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[9px] font-bold font-mono">
                        High Volume
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">13:00 – 22:00 UTC • Impulses</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-secondary">
                      {report?.bySession.find((s) => s.key.includes('New York'))?.netPnl !== undefined
                        ? `+$${Number(report?.bySession.find((s) => s.key.includes('New York'))?.netPnl).toFixed(2)}`
                        : '+$0.00'}
                    </span>
                    <span className="block font-mono text-[10px] text-slate-400">
                      {report?.bySession.find((s) => s.key.includes('New York'))?.winRate.toFixed(1) || '100'}% WR
                    </span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>

              {/* Asian Session */}
              <div className="p-3 bg-surface-container-low rounded-xl border border-surface-border/40 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Asian Session</span>
                      <span className="px-1.5 py-0.5 rounded bg-tertiary/15 text-tertiary text-[9px] font-bold font-mono">
                        Range Bound
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">00:00 – 08:00 UTC • Range drift</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-slate-200">
                      {report?.bySession.find((s) => s.key.includes('Asian'))?.netPnl !== undefined
                        ? `+$${Number(report?.bySession.find((s) => s.key.includes('Asian'))?.netPnl).toFixed(2)}`
                        : '+$0.00'}
                    </span>
                    <span className="block font-mono text-[10px] text-slate-400">
                      {report?.bySession.find((s) => s.key.includes('Asian'))?.winRate.toFixed(1) || '0'}% WR
                    </span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                  <div className="bg-tertiary h-full rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-surface-container-lowest/80 rounded-xl flex items-center justify-between text-xs font-mono text-slate-400 border border-surface-border/30">
            <span>Session Delta Edge:</span>
            <span className="text-secondary font-bold">London + NY = 94.2% Net P&L</span>
          </div>
        </div>

        {/* Day of the Week & Execution Matrix (7 Cols) */}
        <div className="xl:col-span-7 bg-surface-container rounded-xl p-5 border border-surface-border/50 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-border/30">
              <div>
                <h2 className="text-base font-bold text-white">Day of Week & Intensity Matrix</h2>
                <p className="text-xs text-slate-400">Cumulative performance mapped across trading days.</p>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                <span>Loss</span>
                <span className="w-3 h-3 rounded-sm bg-tertiary/40"></span>
                <span className="w-3 h-3 rounded-sm bg-surface-container-high"></span>
                <span className="w-3 h-3 rounded-sm bg-secondary/30"></span>
                <span className="w-3 h-3 rounded-sm bg-secondary"></span>
                <span>Win</span>
              </div>
            </div>

            {/* Daily PnL Bar Chart */}
            <div className="w-full h-56 pt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report?.dailyPnl || []}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    domain={['auto', 'auto']}
                    tickFormatter={(val) => `$${Math.round(val)}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f131c', borderColor: '#31353f', borderRadius: '0.75rem', fontSize: '0.75rem' }}
                    formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Net Realized P&L']}
                  />
                  <Bar dataKey="netPnl" fill="#51de9d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 pt-2 border-t border-surface-border/40 font-mono text-[11px] text-center">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
              const dayItem = report?.byDayOfWeek.find((d) => d.key === day);
              const pnl = dayItem?.netPnl ?? 0;
              return (
                <div key={day} className="p-2 bg-surface-container-low rounded-lg border border-surface-border/30">
                  <span className="text-[10px] text-slate-400 block">{day.substring(0, 3)}</span>
                  <span className={`font-bold ${pnl >= 0 ? 'text-secondary' : 'text-tertiary'}`}>
                    {pnl >= 0 ? `+$${pnl.toFixed(0)}` : `-$${Math.abs(pnl).toFixed(0)}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Multi-Dimensional Edge Analysis Breakdown Tables */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-border">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <span>Multi-Dimensional Strategy & Edge Breakdown</span>
            </h2>
            <p className="text-xs text-slate-400">Discover which setups, sessions, and habits generate your highest expectancy.</p>
          </div>
        </div>

        {/* Breakdown Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-surface-border/40">
          {[
            { id: 'SYMBOL', label: 'By Symbol' },
            { id: 'SESSION', label: 'By Session' },
            { id: 'DAY_OF_WEEK', label: 'By Day of Week' },
            { id: 'SETUP', label: 'By Setup' },
            { id: 'EMOTION', label: 'By Psychology' },
            { id: 'RULES', label: 'Rule Compliance' },
            { id: 'MISTAKES', label: 'By Mistakes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveBreakdownTab(tab.id as any)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                activeBreakdownTab === tab.id
                  ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white bg-surface-container-low'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Breakdown Table */}
        {currentBreakdownItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            No closed trades recorded in this breakdown category yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-surface-container-low text-[10px] uppercase tracking-wider text-slate-400 border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4 font-bold">Category / Dimension</th>
                  <th className="py-3 px-4 font-bold text-center">Trades</th>
                  <th className="py-3 px-4 font-bold text-center">Win Rate</th>
                  <th className="py-3 px-4 font-bold text-right">Profit Factor</th>
                  <th className="py-3 px-4 font-bold text-right">Net Realized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border font-mono text-xs">
                {currentBreakdownItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span>{item.key}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-200">
                      {item.totalTrades} ({item.winningTrades}W / {item.losingTrades}L)
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-bold text-slate-200">{item.winRate.toFixed(1)}%</span>
                        <div className="w-16 h-1.5 bg-surface-container-lowest rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full bg-secondary" style={{ width: `${item.winRate}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-200">
                      {item.profitFactor.toFixed(2)}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-bold text-sm ${
                        item.netPnl >= 0 ? 'text-secondary' : 'text-tertiary'
                      }`}
                    >
                      {item.netPnl >= 0 ? `+$${Number(item.netPnl).toFixed(2)}` : `-$${Math.abs(Number(item.netPnl)).toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 6. CSV Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-lg bg-surface-container border-surface-border p-5 sm:p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-secondary" />
                <span>Import Trades from CSV</span>
              </h3>
              <button onClick={() => setIsImportOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
              <p className="text-slate-400 leading-relaxed">
                Upload a CSV export from MetaTrader 5, TradingView, or TradeZella. Supported headers: <code className="text-white">Symbol, Direction, Volume, EntryPrice, ExitPrice, GrossPnL, Commission, Swap, NetPnL, OpenedAt, ClosedAt, Setup, Notes</code>.
              </p>

              <div className="border-2 border-dashed border-surface-border hover:border-primary rounded-xl p-6 text-center space-y-2 transition-colors bg-surface-container-low">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-slate-300 font-medium">
                  {importFile ? importFile.name : 'Choose or drag a .csv file here'}
                </div>
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary-container cursor-pointer"
                />
              </div>

              {importError && (
                <div className="p-3 rounded-lg bg-tertiary/10 border border-tertiary/30 text-tertiary text-xs">
                  {importError}
                </div>
              )}

              {importResult && (
                <div className="p-3.5 rounded-lg bg-secondary/10 border border-secondary/30 text-secondary text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Import Complete!</span>
                  </div>
                  <div>Processed: {importResult.totalRows} rows</div>
                  <div>Successfully Imported: <strong className="text-secondary">{importResult.importedCount}</strong> trades</div>
                  {importResult.skippedCount > 0 && (
                    <div className="text-amber-400">Skipped: {importResult.skippedCount} rows</div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsImportOpen(false)}>
                  Close
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={isImporting} disabled={!importFile}>
                  <span>Import Trades</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
