import React, { useState, useEffect, useCallback } from 'react';
import {
  Key,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  Power,
  RotateCw,
  Clock,
  Layers,
  ChevronDown,
  Server,
  Wallet,
  Activity,
  Database,
  Link as LinkIcon,
  BookOpen,
  X,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mt5Api } from '../api/mt5';
import { Mt5ConnectionResponse, SyncBatch } from '../types';

export const Mt5ConnectionsPage: React.FC = () => {
  const { accounts, activeAccount, setActiveAccount } = useAuth();

  const [connection, setConnection] = useState<Mt5ConnectionResponse | null>(null);
  const [batches, setBatches] = useState<SyncBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeNewToken, setActiveNewToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [showFullId, setShowFullId] = useState(false);

  const backendApiUrl = window.location.origin.includes('5173')
    ? 'http://localhost:8080'
    : window.location.origin;

  const loadConnectionData = useCallback(async () => {
    if (!activeAccount) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const connData = await mt5Api.getConnection(activeAccount.id);
      setConnection(connData);
      try {
        const batchData = await mt5Api.getRecentBatches(activeAccount.id);
        setBatches(batchData);
      } catch {
        setBatches([]);
      }
    } catch (err: any) {
      if (err?.status === 404 || err?.errorCode === 'NOT_FOUND') {
        setConnection(null);
        setBatches([]);
      } else {
        setErrorMsg(err?.message || 'Failed to fetch MT5 connection status');
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeAccount]);

  useEffect(() => {
    loadConnectionData();
  }, [loadConnectionData]);

  const handleGenerateOrRotateToken = async () => {
    if (!activeAccount) return;
    setIsRotating(true);
    setErrorMsg(null);
    try {
      const res = await mt5Api.createOrRotateToken(activeAccount.id);
      setConnection(res);
      if (res.rawToken) {
        setActiveNewToken(res.rawToken);
      }
      setIsTokenModalOpen(true);
      const batchData = await mt5Api.getRecentBatches(activeAccount.id);
      setBatches(batchData);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate token');
    } finally {
      setIsRotating(false);
    }
  };

  const handleDisconnect = async () => {
    if (!activeAccount) return;
    if (!window.confirm('Are you sure you want to disconnect? Active EA synchronizations will be stopped.')) {
      return;
    }
    setIsDisconnecting(true);
    setErrorMsg(null);
    try {
      const res = await mt5Api.disconnect(activeAccount.id);
      setConnection(res);
      setActiveNewToken(null);
      setIsTokenModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to disconnect MT5');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const copyToClipboard = (text: string, type: 'token' | 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const formatRelativeTime = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    return date.toLocaleDateString();
  };

  const isConnected = connection && connection.connectionStatus === 'CONNECTED';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Status Notice Banner (Stitch Style) */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-4 sm:p-5 border border-surface-border/50 shadow-sm">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-secondary font-bold">
                  Real-Time Sync Protocol
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Real-time sync requires MetaTrader 5 desktop terminal running with TradeFlow EA attached. Historical deals sync automatically every 60 seconds.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/mt5-guide"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-slate-300 hover:text-white hover:bg-surface-container-high text-xs font-medium transition-colors"
            >
              <span>Installation Guide</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <button
              onClick={() => {
                if (connection) {
                  setIsTokenModalOpen(true);
                } else {
                  handleGenerateOrRotateToken();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-slate-950 text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{connection ? 'Manage EA Token' : 'Connect New MT5'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Header Section with Clean Typography */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] uppercase tracking-wider mb-1">
            <span>Terminal Bridge</span>
            <span>/</span>
            <span className="text-primary font-semibold">EA_GATEWAY_v2.4</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            MetaTrader 5 Connections
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Automatically sync your trading history from MetaTrader 5 terminals via lightweight Expert Advisor (EA).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Account Selector */}
          {accounts.length > 0 && (
            <div className="relative">
              <select
                aria-label="Active Account"
                value={activeAccount?.id || ''}
                onChange={(e) => {
                  const target = accounts.find((a) => a.id === Number(e.target.value));
                  if (target) {
                    setActiveAccount(target);
                    setActiveNewToken(null);
                  }
                }}
                className="h-9 pl-3 pr-8 bg-surface-container-low text-white text-xs rounded-lg font-medium border border-surface-border/50 appearance-none cursor-pointer focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} ({acc.currency})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <Link
            to="/mt5-guide"
            className="h-9 px-3.5 rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-border/50 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Setup Documentation</span>
          </Link>

          <button
            onClick={loadConnectionData}
            disabled={isLoading}
            className="h-9 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-border/50 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 text-secondary ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-tertiary/10 border border-tertiary/20 text-tertiary text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. Overview Metrics (4-card row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Connected Accounts */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-border/40 shadow-sm flex flex-col justify-between group hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">
            <span>Connected Accounts</span>
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {isConnected ? '1 Active' : '0 Active'}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-secondary' : 'bg-slate-500'}`}></span>
            <span className={isConnected ? 'text-secondary font-medium' : 'text-slate-400'}>
              {isConnected ? 'Terminal bridge ready' : 'Awaiting EA connection'}
            </span>
          </div>
        </div>

        {/* Card 2: Total Deals Imported */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-border/40 shadow-sm flex flex-col justify-between group hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">
            <span>Total Deals Imported</span>
            <Database className="w-4 h-4 text-secondary" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {Number(connection?.totalDealsImported ?? 0).toLocaleString()}
            </div>
            <span className="text-xs text-slate-400 font-mono">deals</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono text-secondary font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Integrity verified</span>
          </div>
        </div>

        {/* Card 3: Normalized Trades */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-border/40 shadow-sm flex flex-col justify-between group hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">
            <span>Normalized Trades</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {Number(connection?.totalTradesNormalized ?? 0).toLocaleString()}
            </div>
            <span className="text-xs text-slate-400 font-mono">trades</span>
          </div>
          <div className="text-xs text-slate-400 font-mono truncate">
            Reconciled positions & orders
          </div>
        </div>

        {/* Card 4: Last Sync Pulse */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-border/40 shadow-sm flex flex-col justify-between group hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">
            <span>Last Sync Pulse</span>
            <Clock className="w-4 h-4 text-secondary" />
          </div>
          <div className="my-2">
            <div className={`text-2xl font-extrabold font-mono tracking-tight ${isConnected ? 'text-secondary' : 'text-slate-400'}`}>
              {formatRelativeTime(connection?.lastHeartbeatAt || connection?.lastSyncSuccessAt)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                </span>
                <span className="text-secondary font-medium">Live Heartbeat Active</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                <span>Standby mode</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4. Configured MT5 Terminals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white">Configured MT5 Terminal</h2>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-slate-400 font-mono text-xs">
              {activeAccount?.accountName}
            </span>
          </div>
        </div>

        {!connection ? (
          <div className="rounded-xl bg-surface-container-low border border-dashed border-surface-border/60 p-8 sm:p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
              <Server className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-white">No MT5 Bridge Active</h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Account <strong className="text-slate-200">{activeAccount?.accountName}</strong> is not yet connected to MetaTrader 5. Generate an integration token to activate automatic trade synchronization.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleGenerateOrRotateToken}
                disabled={isRotating}
                className="px-5 py-2.5 rounded-lg bg-primary text-slate-950 font-bold text-xs hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 mx-auto"
              >
                <Key className="w-4 h-4" />
                <span>Initialize Connection & Generate EA Token</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Terminal Card */}
            <div className="rounded-xl bg-surface-container-low border border-surface-border/50 p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                {/* Badge Row */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-surface-border/30">
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary/15 text-secondary border border-secondary/30 text-xs font-mono font-bold">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                        </span>
                        CONNECTED & SYNCING
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-slate-400 border border-surface-border/40 text-xs font-mono">
                        <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                        {connection.connectionStatus}
                      </span>
                    )}
                  </div>

                  {connection.mt5Balance !== undefined && (
                    <div className="text-right font-mono">
                      <div className="text-[10px] text-slate-400 uppercase">Balance</div>
                      <div className="text-sm font-extrabold text-secondary">
                        ${Number(connection.mt5Balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Account info */}
                <div className="mt-3">
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {connection.mt5AccountName || connection.mt5Server || activeAccount?.accountName}
                  </h3>
                  <p className="text-xs text-primary font-mono mt-0.5">
                    {activeAccount?.accountType} Account • {activeAccount?.currency}
                  </p>
                </div>

                {/* Meta Key-Value List */}
                <div className="mt-3 space-y-1.5 bg-surface-container-lowest/60 p-3.5 rounded-lg font-mono text-xs border border-surface-border/30">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Server:</span>
                    <span className="text-slate-200 font-semibold">{connection.mt5Server || activeAccount?.mt5Server || 'MetaTrader 5'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Token Prefix:</span>
                    <span className="text-slate-200 flex items-center gap-1.5">
                      <span>{showFullId ? connection.tokenPrefix : `${connection.tokenPrefix.substring(0, 6)}••••`}</span>
                      <button
                        onClick={() => setShowFullId(!showFullId)}
                        className="text-slate-400 hover:text-white"
                        title={showFullId ? 'Mask' : 'Show'}
                      >
                        {showFullId ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Last Pulse:</span>
                    <span className="text-secondary font-medium">{formatRelativeTime(connection.lastHeartbeatAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Full Sync:</span>
                    <span className="text-slate-200">
                      {connection.lastSyncSuccessAt ? new Date(connection.lastSyncSuccessAt).toLocaleTimeString() : 'Awaiting sync'}
                    </span>
                  </div>
                </div>

                {/* Stats Pill */}
                <div className="mt-3 p-2 rounded bg-surface-container flex items-center justify-between font-mono text-xs text-slate-300">
                  <span className="text-secondary font-bold">{connection.totalDealsImported ?? 0} deals</span>
                  <span className="text-outline">•</span>
                  <span>{connection.totalTradesNormalized ?? 0} trades</span>
                  <span className="text-outline">•</span>
                  <span className="text-secondary">0 errors</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-surface-border/30">
                <button
                  onClick={loadConnectionData}
                  disabled={isLoading}
                  className="h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Sync Now</span>
                </button>
                <button
                  onClick={() => setIsTokenModalOpen(true)}
                  className="h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>EA Token</span>
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="h-8 rounded-lg bg-surface-container hover:bg-rose-500/10 text-tertiary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>

            {/* Quick Setup Instructions Card */}
            <div className="rounded-xl bg-surface-container-low border border-surface-border/50 p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-surface-border/30">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-secondary" />
                    <span>Quick MT5 Setup Checklist</span>
                  </h3>
                  <Link to="/mt5-guide" className="text-xs text-primary hover:underline">Full Guide</Link>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-surface-container text-primary flex items-center justify-center font-mono font-bold text-[10px] shrink-0">1</span>
                    <p>Open MT5 <strong>Tools → Options → Expert Advisors</strong> and check <em>Allow WebRequest for listed URL</em>.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-surface-container text-primary flex items-center justify-center font-mono font-bold text-[10px] shrink-0">2</span>
                    <div className="flex-1 space-y-1">
                      <p>Add the server URL to allowed list:</p>
                      <div className="flex items-center gap-2 bg-surface-container px-2 py-1 rounded font-mono text-[11px] text-secondary">
                        <span className="truncate">{backendApiUrl}</span>
                        <button onClick={() => copyToClipboard(backendApiUrl, 'url')} className="ml-auto text-slate-400 hover:text-white">
                          {copiedUrl ? <Check className="w-3 h-3 text-secondary" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-surface-container text-primary flex items-center justify-center font-mono font-bold text-[10px] shrink-0">3</span>
                    <p>Attach <code>TradingJournalSync.ex5</code> to any chart and paste your EA Token into <code>InpApiToken</code>.</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border/30 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">Sync Interval: 60s auto</span>
                <button
                  onClick={() => setIsTokenModalOpen(true)}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  View Token Credentials →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Recent Synchronization Batches Ledger */}
      <div className="rounded-xl bg-surface-container-low border border-surface-border/40 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-surface-border/40">
          <div>
            <h3 className="text-base font-bold text-white">Recent Sync Audit Batches</h3>
            <p className="text-xs text-slate-400">Incoming payloads dispatched by MT5 WebRequest</p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-surface-container text-slate-400 font-mono text-xs">
            {batches.length} Recent
          </span>
        </div>

        {batches.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            No sync batches received yet. As soon as MT5 sends deals, audit records will show up here in real time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 font-mono">
              <thead className="bg-surface-container-lowest/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-surface-border/40">
                <tr>
                  <th className="py-3 px-4">Batch ID</th>
                  <th className="py-3 px-4">Received Time</th>
                  <th className="py-3 px-4">Received</th>
                  <th className="py-3 px-4">Inserted</th>
                  <th className="py-3 px-4">Duplicated</th>
                  <th className="py-3 px-4 text-right">HTTP Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/30">
                {batches.slice(0, 8).map((b) => (
                  <tr key={b.id} className="hover:bg-surface-container/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-primary truncate max-w-[150px]">{b.batchId}</td>
                    <td className="py-3 px-4 text-slate-400">{new Date(b.receivedAt).toLocaleTimeString()}</td>
                    <td className="py-3 px-4 text-white">{b.recordsReceived}</td>
                    <td className="py-3 px-4 text-secondary font-semibold">+{b.recordsInserted}</td>
                    <td className="py-3 px-4 text-slate-400">{b.recordsDuplicated}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-1.5 py-0.5 rounded bg-secondary/15 text-secondary border border-secondary/30 text-[10px] font-bold">
                        {b.httpStatus || 200} OK
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. EA Token Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-surface-container-low border border-surface-border rounded-xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border/40">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-white">MT5 EA Integration Token</h3>
              </div>
              <button
                onClick={() => setIsTokenModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-container transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeNewToken && (
              <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/30 text-secondary text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>New token created! Copy it into MT5 now.</span>
              </div>
            )}

            {/* InpApiToken Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                InpApiToken
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-surface-container px-3 py-2 rounded-lg font-mono text-xs text-white select-all border border-surface-border/40 truncate">
                  {activeNewToken || (connection ? `${connection.tokenPrefix}••••••••••••••••••••••••••••••••` : 'Not generated')}
                </div>
                <button
                  onClick={() => copyToClipboard(activeNewToken || connection?.tokenPrefix || '', 'token')}
                  className="h-9 px-3 rounded-lg bg-primary text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* InpApiUrl Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                InpApiUrl & WebRequest Allowed URL
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-surface-container px-3 py-2 rounded-lg font-mono text-xs text-white select-all border border-surface-border/40 truncate">
                  {backendApiUrl}
                </div>
                <button
                  onClick={() => copyToClipboard(backendApiUrl, 'url')}
                  className="h-9 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container text-white font-semibold text-xs flex items-center gap-1.5 transition-colors border border-surface-border/50"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-secondary" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={handleGenerateOrRotateToken}
                disabled={isRotating}
                className="text-xs text-primary hover:underline font-mono"
              >
                {isRotating ? 'Rotating...' : 'Re-issue / Rotate Token'}
              </button>
              <button
                onClick={() => setIsTokenModalOpen(false)}
                className="h-8 px-4 rounded-lg bg-surface-container-high hover:bg-surface-container text-white text-xs font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
