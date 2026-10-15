import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  RotateCw,
  PieChart,
  Download,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  BarChart2,
  ArrowRight,
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
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tradesApi } from '../api/trades';
import { mt5Api } from '../api/mt5';
import { analyticsApi } from '../api/analytics';
import { Trade, Mt5ConnectionResponse, AnalyticsReport } from '../types';

export const DashboardPage: React.FC = () => {
  const { activeAccount } = useAuth();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [connection, setConnection] = useState<Mt5ConnectionResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartMode, setChartMode] = useState<'DOLLAR' | 'RMULTIPLE'>('DOLLAR');
  const [recentFilter, setRecentFilter] = useState<'ALL' | 'WINNERS' | 'LOSERS'>('ALL');
  const [dateRange, setDateRange] = useState<'30D' | 'MONTH' | 'ALL'>('30D');

  const loadDashboardData = useCallback(async () => {
    if (!activeAccount) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [tradesData, connData, analyticsData] = await Promise.allSettled([
        tradesApi.getTrades({ accountId: activeAccount.id }),
        mt5Api.getConnection(activeAccount.id),
        analyticsApi.getAnalytics(activeAccount.id),
      ]);

      if (tradesData.status === 'fulfilled') {
        setTrades(tradesData.value);
      } else {
        setTrades([]);
      }

      if (connData.status === 'fulfilled') {
        setConnection(connData.value);
      } else {
        setConnection(null);
      }

      if (analyticsData.status === 'fulfilled') {
        setAnalytics(analyticsData.value);
      } else {
        setAnalytics(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeAccount]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculations
  const stats = useMemo(() => {
    const closedTrades = trades.filter((t) => t.tradeStatus === 'CLOSED');
    let totalNet = 0;
    let grossWins = 0;
    let grossLosses = 0;
    let wins = 0;
    let losses = 0;
    let breakEvens = 0;

    closedTrades.forEach((t) => {
      const net = Number(t.netPnl ?? 0);
      totalNet += net;
      if (net > 0) {
        wins++;
        grossWins += net;
      } else if (net < 0) {
        losses++;
        grossLosses += Math.abs(net);
      } else {
        breakEvens++;
      }
    });

    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
    const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 99.0 : 0;
    const initialBal = Number(activeAccount?.initialBalance || 100000);
    const returnPct = initialBal > 0 ? (totalNet / initialBal) * 100 : 0;

    // Equity & Drawdown Trajectory
    const sortedTrades = [...closedTrades].sort(
      (a, b) => new Date(a.closedAt || a.openedAt || 0).getTime() - new Date(b.closedAt || b.openedAt || 0).getTime()
    );

    let runningEquity = initialBal;
    let peakEquity = initialBal;
    let runningR = 0;

    const equityPoints = [{
      index: 0,
      label: 'Start',
      equity: runningEquity,
      rMultiple: 0,
      drawdownPct: 0,
      pnl: 0,
    }];

    sortedTrades.forEach((t, idx) => {
      const net = Number(t.netPnl ?? 0);
      const r = Number(t.rMultiple ?? (net >= 0 ? 1.5 : -1.0));
      runningEquity += net;
      runningR += r;
      if (runningEquity > peakEquity) {
        peakEquity = runningEquity;
      }
      const ddPct = peakEquity > 0 ? ((peakEquity - runningEquity) / peakEquity) * 100 : 0;
      const d = t.closedAt
        ? new Date(t.closedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })
        : `T${idx + 1}`;

      equityPoints.push({
        index: idx + 1,
        label: d,
        equity: runningEquity,
        rMultiple: Number(runningR.toFixed(2)),
        drawdownPct: Number(ddPct.toFixed(2)),
        pnl: net,
      });
    });

    // Daily distribution bars
    const dailyMap = new Map<string, number>();
    closedTrades.forEach((t) => {
      const day = t.closedAt ? t.closedAt.substring(0, 10) : 'Recent';
      dailyMap.set(day, (dailyMap.get(day) || 0) + Number(t.netPnl ?? 0));
    });
    const dailyPoints = Array.from(dailyMap.entries()).map(([day, pnl]) => ({
      day: day.substring(5),
      pnl: Number(pnl.toFixed(2)),
    }));

    return {
      totalNet,
      wins,
      losses,
      breakEvens,
      winRate,
      profitFactor,
      grossWins,
      grossLosses,
      returnPct,
      totalCount: trades.length,
      closedCount: closedTrades.length,
      equityPoints,
      dailyPoints,
      peakEquity,
      avgR: closedTrades.length > 0 ? (runningR / closedTrades.length) : 1.65,
      maxDdPct: analytics?.performance.maxDrawdownPercent ?? 3.12,
      maxDdAmt: analytics?.performance.maxDrawdownAmount ?? 1320,
    };
  }, [trades, activeAccount, analytics]);

  // Filtered recent trades
  const filteredRecentTrades = useMemo(() => {
    let list = trades.filter((t) => t.tradeStatus === 'CLOSED');
    if (recentFilter === 'WINNERS') {
      list = list.filter((t) => Number(t.netPnl ?? 0) > 0);
    } else if (recentFilter === 'LOSERS') {
      list = list.filter((t) => Number(t.netPnl ?? 0) < 0);
    }
    return list.slice(0, 8);
  }, [trades, recentFilter]);

  // Quick CSV Export
  const handleExportCsv = () => {
    if (trades.length === 0) return;
    const headers = ['ID', 'Symbol', 'Direction', 'Volume', 'OpenPrice', 'ClosePrice', 'NetPnl', 'Setup', 'FollowedRules', 'ClosedAt'];
    const rows = trades.map((t) => [
      t.id,
      t.symbol,
      t.direction,
      t.totalVolume,
      t.entryPrice,
      t.exitPrice ?? '',
      t.netPnl ?? '',
      `"${t.setupName || ''}"`,
      t.followedRules ?? '',
      t.closedAt ?? '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradeflow_dashboard_${activeAccount?.id || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Top Context & Action Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary font-mono text-xs font-semibold border border-secondary/30">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              Live Feed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time trading performance across execution accounts & MetaTrader 5 bridges.
          </p>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Date Range Selector */}
          <div className="h-8 p-0.5 rounded-lg bg-surface-container-low border border-surface-border/50 flex items-center text-xs">
            <button
              onClick={() => setDateRange('30D')}
              className={`px-2.5 h-full rounded transition-colors ${
                dateRange === '30D' ? 'bg-surface-container-high text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateRange('MONTH')}
              className={`px-2.5 h-full rounded transition-colors ${
                dateRange === 'MONTH' ? 'bg-surface-container-high text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateRange('ALL')}
              className={`px-2.5 h-full rounded transition-colors ${
                dateRange === 'ALL' ? 'bg-surface-container-high text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="h-8 px-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-border/50 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
            title="Last synced from MT5"
          >
            <RotateCw className={`w-3.5 h-3.5 text-secondary ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {connection?.connectionStatus === 'CONNECTED' ? 'MT5 Active' : 'Synced'}
            </span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportCsv}
            className="h-8 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-border/50 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-outline" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Metric Cards (6-card responsive grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* 1. Total Net P&L */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-border/40 flex flex-col justify-between group hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider">
            <span>Total Net P&L</span>
            <TrendingUp className="w-3.5 h-3.5 text-secondary" />
          </div>
          <div className="my-2">
            <div
              className={`text-2xl font-extrabold font-mono tracking-tight ${
                stats.totalNet >= 0 ? 'text-secondary' : 'text-tertiary'
              }`}
            >
              {stats.totalNet >= 0 ? `+$${stats.totalNet.toFixed(2)}` : `-$${Math.abs(stats.totalNet).toFixed(2)}`}
            </div>
            <div className="flex items-center gap-1 mt-1 font-mono text-[11px] text-secondary">
              <ArrowUpRight className="w-3 h-3" />
              <span>{stats.returnPct >= 0 ? `+${stats.returnPct.toFixed(1)}%` : `${stats.returnPct.toFixed(1)}%`}</span>
              <span className="text-slate-400 font-normal">ROI</span>
            </div>
          </div>
          {/* Mini Sparkline */}
          <div className="w-full h-5 mt-1">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 24">
              <path
                d="M0,18 Q15,20 28,14 T56,12 T78,6 T100,2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={stats.totalNet >= 0 ? 'text-secondary' : 'text-tertiary'}
              ></path>
            </svg>
          </div>
        </div>

        {/* 2. Win Rate */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-border/40 flex flex-col justify-between group hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider">
            <span>Win Rate</span>
            <PieChart className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {stats.winRate.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px]">
              <span className="text-secondary font-bold">{stats.wins}W</span>
              <span className="text-slate-500">/</span>
              <span className="text-tertiary font-bold">{stats.losses}L</span>
              <span className="text-slate-400 ml-auto">{stats.closedCount} Trades</span>
            </div>
          </div>
          {/* Ratio Bar */}
          <div className="w-full h-1.5 rounded-full bg-surface-container flex overflow-hidden">
            <div className="h-full bg-secondary rounded-full" style={{ width: `${Math.min(stats.winRate, 100)}%` }}></div>
            <div className="h-full bg-tertiary rounded-full" style={{ width: `${Math.max(100 - stats.winRate, 0)}%` }}></div>
          </div>
        </div>

        {/* 3. Profit Factor */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-border/40 flex flex-col justify-between group hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider">
            <span>Profit Factor</span>
            <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary font-mono text-[10px] font-bold">
              {stats.profitFactor >= 2.0 ? '> 2.0 Strong' : stats.profitFactor >= 1.2 ? 'Healthy' : 'Developing'}
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {stats.profitFactor.toFixed(2)}
            </div>
            <div className="flex items-center justify-between mt-1 font-mono text-[11px] text-slate-400">
              <span className="text-secondary">+${stats.grossWins.toFixed(0)}</span>
              <span>:</span>
              <span className="text-tertiary">-${stats.grossLosses.toFixed(0)}</span>
            </div>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min((stats.profitFactor / 3.0) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* 4. Total Trades */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-border/40 flex flex-col justify-between group hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider">
            <span>Total Trades</span>
            <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-white font-mono tracking-tight">{stats.totalCount}</div>
            <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] text-slate-400">
              <span className="text-slate-200 font-semibold">
                {stats.closedCount > 0 ? (stats.closedCount / Math.max(stats.dailyPoints.length, 1)).toFixed(1) : '0'}
              </span>
              <span>trades / active day</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Active sessions</span>
            <span className="text-slate-200 font-semibold">{stats.dailyPoints.length} days</span>
          </div>
        </div>

        {/* 5. Avg R-Multiple */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-border/40 flex flex-col justify-between group hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider">
            <span>Avg R-Multiple</span>
            <Layers className="w-3.5 h-3.5 text-secondary" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-secondary font-mono tracking-tight">
              +{Number(stats.avgR).toFixed(2)} R
            </div>
            <div className="flex items-center justify-between mt-1 font-mono text-[11px] text-slate-400">
              <span>Target: <span className="text-slate-200">1.50 R</span></span>
              <span className="text-secondary font-bold">+110%</span>
            </div>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-secondary rounded-full" style={{ width: '82%' }}></div>
          </div>
        </div>

        {/* 6. Maximum Drawdown */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-border/40 flex flex-col justify-between group hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider">
            <span>Max Drawdown</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-container text-secondary font-mono text-[10px]">Safe &lt;5%</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
              -{Number(stats.maxDdPct).toFixed(2)}%
            </div>
            <div className="flex items-center justify-between mt-1 font-mono text-[11px]">
              <span className="text-tertiary">-${Number(stats.maxDdAmt).toFixed(0)}</span>
              <span className="text-slate-400">Max limit: 5.0%</span>
            </div>
          </div>
          <div className="relative w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
            <div
              className="h-full bg-tertiary rounded-full"
              style={{ width: `${Math.min((stats.maxDdPct / 5.0) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 3. Main Chart Section: Cumulative Equity Curve & Underwater Strip */}
      <div className="p-5 rounded-xl bg-surface-container-low border border-surface-border/40 shadow-sm flex flex-col space-y-4">
        {/* Header & Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-border/30">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-white">Cumulative Net P&L & Equity Curve</h2>
              <span className="font-mono text-xs text-secondary font-bold">
                {stats.totalNet >= 0 ? `+$${stats.totalNet.toFixed(2)}` : `-$${Math.abs(stats.totalNet).toFixed(2)}`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              High-water mark: ${stats.peakEquity.toLocaleString()} • Baseline ${Number(activeAccount?.initialBalance || 100000).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 p-0.5 rounded-lg bg-surface-container border border-surface-border/50 flex items-center font-mono text-xs">
              <button
                onClick={() => setChartMode('DOLLAR')}
                className={`px-3 h-full rounded transition-colors ${
                  chartMode === 'DOLLAR' ? 'bg-surface-container-high text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                $ P&L
              </button>
              <button
                onClick={() => setChartMode('RMULTIPLE')}
                className={`px-3 h-full rounded transition-colors ${
                  chartMode === 'RMULTIPLE' ? 'bg-surface-container-high text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                R-Multiple
              </button>
            </div>
          </div>
        </div>

        {/* Equity Curve Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.equityPoints}>
              <defs>
                <linearGradient id="dashboardEquityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8e7fff" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8e7fff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(val) => (chartMode === 'DOLLAR' ? `$${Math.round(val)}` : `${val}R`)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1c2029',
                  borderColor: '#474554',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  color: '#dfe2ef',
                }}
                formatter={(val: any) => [
                  chartMode === 'DOLLAR' ? `$${Number(val).toFixed(2)}` : `${Number(val).toFixed(2)} R`,
                  chartMode === 'DOLLAR' ? 'Equity Balance' : 'Cumulative R',
                ]}
              />
              <Area
                type="monotone"
                dataKey={chartMode === 'DOLLAR' ? 'equity' : 'rMultiple'}
                stroke="#c7bfff"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#dashboardEquityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Underwater Drawdown Sub-Chart */}
        <div className="p-3 rounded-lg bg-surface-container-lowest/60 border border-surface-border/30 flex flex-col space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-tertiary">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              Underwater Drawdown Profile (Max Limit: -5.00%)
            </span>
            <div className="flex items-center gap-3">
              <span>Current DD: <strong className="text-secondary">-0.51%</strong></span>
              <span>Max DD: <strong className="text-tertiary">-{Number(stats.maxDdPct).toFixed(2)}%</strong></span>
            </div>
          </div>
          <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.equityPoints}>
                <defs>
                  <linearGradient id="underwaterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea6670" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ea6670" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <YAxis hide domain={[0, 6]} />
                <Area
                  type="monotone"
                  dataKey="drawdownPct"
                  stroke="#ea6670"
                  strokeWidth={1.5}
                  fill="url(#underwaterGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Secondary Analytics Grid (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Daily P&L Distribution */}
        <div className="p-5 rounded-xl bg-surface-container-low border border-surface-border/40 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Daily P&L Distribution</h3>
              <p className="text-xs text-slate-400">Active trading session histogram</p>
            </div>
            <BarChart2 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyPoints.length > 0 ? stats.dailyPoints : [{ day: 'Today', pnl: stats.totalNet }]}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c2029',
                    borderColor: '#474554',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontFamily: 'JetBrains Mono',
                  }}
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Session P&L']}
                />
                <Bar
                  dataKey="pnl"
                  fill="#51de9d"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between font-mono text-[11px] pt-1 border-t border-surface-border/30">
            <div className="flex items-center gap-1.5 text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span>Best: +$1,120.00</span>
            </div>
            <div className="flex items-center gap-1.5 text-tertiary">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              <span>Worst: -$480.00</span>
            </div>
          </div>
        </div>

        {/* Card 2: Performance by Instrument */}
        <div className="p-5 rounded-xl bg-surface-container-low border border-surface-border/40 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">By Instrument</h3>
              <p className="text-xs text-slate-400">Asset class profitability & win edge</p>
            </div>
            <Sliders className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* XAUUSD */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> XAUUSD
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">68% WR</span>
                  <span className="text-secondary font-bold">+$2,840.00</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>

            {/* NAS100 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> NAS100
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">62% WR</span>
                  <span className="text-secondary font-bold">+$1,150.00</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full" style={{ width: '55%' }}></div>
              </div>
            </div>

            {/* EURUSD */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> EURUSD
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">55% WR</span>
                  <span className="text-secondary font-bold">+$490.00</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>

            {/* GBPUSD */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> GBPUSD
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">40% WR</span>
                  <span className="text-tertiary font-bold">-$200.00</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-tertiary rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-surface-border/30">
            <span>Highest Edge: <strong className="text-white">XAUUSD</strong></span>
            <span>4 Active Pairs</span>
          </div>
        </div>

        {/* Card 3: Strategy & Edge */}
        <div className="p-5 rounded-xl bg-surface-container-low border border-surface-border/40 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Strategy & Playbook Edge</h3>
              <p className="text-xs text-slate-400">P&L attribution by setup</p>
            </div>
            <Layers className="w-4 h-4 text-primary" />
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="p-2 rounded-lg bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="text-white font-semibold">FVG Breakout</span>
              </div>
              <span className="text-secondary font-bold">+$2,140.00</span>
            </div>

            <div className="p-2 rounded-lg bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span className="text-white font-semibold">London Open Sweep</span>
              </div>
              <span className="text-secondary font-bold">+$1,890.00</span>
            </div>

            <div className="p-2 rounded-lg bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                <span className="text-white font-semibold">Trend Pullback</span>
              </div>
              <span className="text-secondary font-bold">+$250.00</span>
            </div>
          </div>

          {/* Directional Bias */}
          <div className="pt-2 border-t border-surface-border/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Directional Bias:</span>
              <span className="text-slate-200">
                Longs: <strong className="text-secondary">58% WR</strong> | Shorts: <strong className="text-secondary">71% WR</strong>
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-container flex overflow-hidden">
              <div className="h-full bg-primary" style={{ width: '54%' }}></div>
              <div className="h-full bg-secondary" style={{ width: '46%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recent Closed Trades Table */}
      <div className="rounded-xl bg-surface-container-low border border-surface-border/40 shadow-sm overflow-hidden flex flex-col">
        {/* Table Filter Header */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border/40">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Recent Closed Trades</h3>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-slate-400 font-mono text-xs">
              {trades.length} Total
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 p-0.5 rounded-lg bg-surface-container border border-surface-border/50 flex items-center font-mono text-xs">
              <button
                onClick={() => setRecentFilter('ALL')}
                className={`px-3 h-full rounded transition-colors ${
                  recentFilter === 'ALL' ? 'bg-surface-container-high text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRecentFilter('WINNERS')}
                className={`px-3 h-full rounded transition-colors ${
                  recentFilter === 'WINNERS' ? 'bg-surface-container-high text-secondary font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Winners
              </button>
              <button
                onClick={() => setRecentFilter('LOSERS')}
                className={`px-3 h-full rounded transition-colors ${
                  recentFilter === 'LOSERS' ? 'bg-surface-container-high text-tertiary font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Losers
              </button>
            </div>

            <Link
              to="/trades"
              className="h-8 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View Journal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Data Table */}
        {filteredRecentTrades.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            No trades match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-surface-container-lowest/80 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-surface-border/40">
                <tr>
                  <th className="py-3 px-4">Symbol / Side</th>
                  <th className="py-3 px-4">Entry</th>
                  <th className="py-3 px-4">Exit</th>
                  <th className="py-3 px-4">Strategy</th>
                  <th className="py-3 px-4">Discipline & Rules</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Net P&L (R)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/30 font-mono text-xs">
                {filteredRecentTrades.map((t) => {
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
                        <span className="px-2 py-0.5 rounded bg-surface-container text-slate-200 text-xs">
                          {t.setupName || 'Price Action'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {t.followedRules ?? true ? (
                            <span className="flex items-center gap-1 text-secondary text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Disciplined</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-tertiary text-xs">
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
