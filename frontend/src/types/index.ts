export type AccountType = 'PERSONAL' | 'DEMO' | 'PROP' | 'OTHER';
export type AccountStatus = 'ACTIVE' | 'ARCHIVED';

export type ConnectionStatus =
  | 'NOT_CONNECTED'
  | 'PENDING'
  | 'CONNECTED'
  | 'SYNCING'
  | 'ERROR'
  | 'DISCONNECTED';

export type TradeDirection = 'BUY' | 'SELL';
export type TradeSource = 'MT5_SYNC' | 'MANUAL' | 'CSV_IMPORT';
export type TradeStatus = 'OPEN' | 'CLOSED' | 'PARTIALLY_CLOSED';

export interface User {
  id: number;
  email: string;
  username: string;
  displayName: string;
  timezone: string;
}

export interface TradingAccount {
  id: number;
  userId: number;
  accountName: string;
  broker?: string;
  mt5Server?: string;
  accountType: AccountType;
  currency: string;
  initialBalance: number;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Mt5Integration {
  id: number;
  tradingAccountId: number;
  tokenPrefix: string;
  connectionStatus: ConnectionStatus;
  mt5AccountName?: string;
  mt5Company?: string;
  mt5Server?: string;
  mt5Currency?: string;
  mt5Balance?: number;
  mt5Equity?: number;
  lastHeartbeatAt?: string;
  lastSyncSuccessAt?: string;
  lastSyncErrorAt?: string;
  lastErrorMessage?: string;
  totalDealsImported: number;
  totalTradesNormalized: number;
  syncCheckpoint?: string;
  createdAt: string;
}

export interface Trade {
  id: number;
  tradingAccountId: number;
  symbol: string;
  direction: TradeDirection;
  tradeSource: TradeSource;
  tradeStatus: TradeStatus;
  entryPrice?: number;
  exitPrice?: number;
  totalVolume: number;
  closedVolume: number;
  remainingVolume: number;
  grossPnl?: number;
  commissionTotal: number;
  swapTotal: number;
  feeTotal: number;
  netPnl?: number;
  riskAmount?: number;
  rMultiple?: number;
  openedAt?: string;
  closedAt?: string;
  entryReason?: string;
  exitReason?: string;
  notes?: string;
  setupName?: string;
  emotionBefore?: string;
  emotionAfter?: string;
  followedRules?: boolean;
  mistakes?: string;
  postTradeReview?: string;
  rating?: number;
}

export interface PerformanceSummary {
  totalNetPnl: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  expectancy: number;
  maxDrawdownPercent: number;
}

export interface Mt5ConnectionResponse {
  id: number;
  tradingAccountId: number;
  connectionStatus: ConnectionStatus;
  tokenPrefix: string;
  rawToken?: string;
  mt5AccountName?: string;
  mt5Company?: string;
  mt5Server?: string;
  mt5Currency?: string;
  mt5Balance?: number;
  mt5Equity?: number;
  lastHeartbeatAt?: string;
  lastSyncSuccessAt?: string;
  lastSyncErrorAt?: string;
  lastErrorMessage?: string;
  totalDealsImported: number;
  totalTradesNormalized: number;
  syncCheckpoint?: string;
  createdAt: string;
}

export interface SyncBatch {
  id: number;
  integrationId: number;
  batchId: string;
  recordsReceived: number;
  recordsInserted: number;
  recordsDuplicated: number;
  recordsRejected: number;
  rejectionDetails?: string;
  checkpointBefore?: string;
  checkpointAfter?: string;
  httpStatus?: number;
  receivedAt: string;
  processedAt?: string;
}

export interface Mt5Deal {
  id: number;
  integrationId: number;
  externalDealTicket: number;
  externalPositionId?: number;
  externalOrderTicket?: number;
  symbol: string;
  dealType: string;
  entryType?: string;
  volume: number;
  price: number;
  dealTime: string;
  profit: number;
  commission: number;
  swap: number;
  fee: number;
  dealReason?: number;
  magicNumber?: number;
  dealComment?: string;
  receivedAt: string;
}

export interface PerformanceMetrics {
  totalNetPnl: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  avgWin: number;
  avgLoss: number;
  winLossRatio: number;
  expectancy: number;
  maxDrawdownAmount: number;
  maxDrawdownPercent: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  avgHoldingSeconds: number;
}

export interface BreakdownItem {
  key: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
}

export interface EquityPoint {
  timestamp: string;
  label: string;
  equity: number;
  netPnl: number;
  drawdownAmount: number;
  drawdownPercent: number;
}

export interface DailyPnl {
  date: string;
  netPnl: number;
  tradesCount: number;
  wins: number;
  losses: number;
}

export interface AnalyticsReport {
  performance: PerformanceMetrics;
  equityCurve: EquityPoint[];
  dailyPnl: DailyPnl[];
  bySymbol: BreakdownItem[];
  byDayOfWeek: BreakdownItem[];
  bySession: BreakdownItem[];
  byDirection: BreakdownItem[];
  bySetup: BreakdownItem[];
  byEmotion: BreakdownItem[];
  byRuleCompliance: BreakdownItem[];
  byMistakes: BreakdownItem[];
}

export interface CsvImportResult {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errors: string[];
}
