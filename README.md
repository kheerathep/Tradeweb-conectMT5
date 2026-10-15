# TradeJournal - Automated Trading Journal & MT5 Sync Platform

A high-performance, modern web platform designed for forex and futures traders. Features **real-time MT5 Auto-Synchronization**, automated trade normalization, in-depth psychological journaling, multi-dimensional performance edge analytics, and CSV import/export.

---

## 🌟 Key Features

1. **MetaTrader 5 Native Synchronization**:
   - Production MQL5 Expert Advisor (`TradingJournalSync.mq5`) with event-driven sync (`OnTradeTransaction`).
   - Checkpoint persistence in terminal global variables to prevent duplicate history pulls across reboots.
   - Secure token-based authentication (`tj_...` prefixes with SHA-256 hash validation).
   - Batch ingestion API with **Partial Success Policy** and audit trail logging.
   - Heartbeat monitoring for account balance, equity, and connectivity status.

2. **Trade Ingestion & Normalization Engine**:
   - Intelligent position aggregation: pairs MT5 `ENTRY_IN` and `ENTRY_OUT` deals by position ID into single consolidated trade records.
   - Accurate volume-weighted average price (VWAP) calculation for scaling in and out.
   - Automated Gross and Net P&L computation incorporating commissions, swaps, and broker fees.
   - Supports manual trade logging and CSV trade imports.

3. **Psychology & Trading Journal**:
   - Emotional state tracking before and after trades (Confident, FOMO, Revenge, etc.).
   - Rule adherence checkboxes, mistake classification, and custom setup tagging.
   - Automated **R-Multiple** computation based on planned risk amount.
   - 1-5 Star trade satisfaction ratings and detailed post-trade reviews.

4. **Multi-Dimensional Edge Analytics**:
   - Realized Cumulative Equity Curve and underwater Drawdown (%) curves.
   - Key performance indicators: Win Rate, Profit Factor, Expectancy ($ / trade), Win/Loss Ratio, and Streaks.
   - Detailed edge breakdowns:
     - By Symbol (EURUSD, XAUUSD, etc.)
     - By Trading Session (Asian, London, London/NY Overlap, New York)
     - By Day of Week (Monday to Friday)
     - By Setup / Strategy
     - By Emotional State
     - By Rule Compliance
     - By Mistake Category

5. **Responsive Modern UI**:
   - Sleek dark theme tailored for financial terminals.
   - Seamless responsive experience across Mobile (360px+), Tablet (768px+), and Desktop (1024px+).

---

## 🏗️ Architecture & Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Backend** | Spring Boot 3.3.4 (Java 21/23) | RESTful API, Spring Security, JWT stateless auth, Spring Data JPA |
| **Database** | MySQL 8.0 (Flyway migrations) / H2 in-memory | Relational database with full normalization and audit logging |
| **Frontend** | React 18 + Vite + TypeScript | Modern SPA, TailwindCSS, Lucide React icons, Recharts |
| **MQL5 EA** | MetaTrader 5 MQL5 | Native Expert Advisor sending JSON via HTTP WebRequest |

---

## 📁 Repository Directory Structure

```
d:/tradeweb/
├── backend/                       # Spring Boot Backend API
│   ├── src/main/java/com/tradeweb/
│   │   ├── account/              # Trading account management
│   │   ├── analytics/            # Performance analytics & reporting engine
│   │   ├── auth/                 # Authentication, JWT, and User management
│   │   ├── config/               # Security and application configurations
│   │   ├── mt5/                  # MT5 sync service, controllers, and filters
│   │   └── trade/                # Trade normalization, journaling & CSV
│   └── src/main/resources/
│       ├── db/migration/         # Flyway SQL migrations (V001 - V010)
│       └── application.yml       # Profile-based configurations
├── frontend/                      # React + Vite Frontend SPA
│   ├── src/
│   │   ├── api/                  # Typed API clients (auth, accounts, mt5, trades, analytics)
│   │   ├── components/           # Reusable UI components & layouts
│   │   ├── context/              # Auth & Account contexts
│   │   ├── pages/                # Dashboard, Trades, Analytics, MT5 Sync, Accounts, Guide
│   │   └── types/                # Shared TypeScript definitions
├── mt5/                           # MetaTrader 5 Artifacts
│   └── Experts/
│       └── TradingJournalSync.mq5 # Production MT5 synchronization Expert Advisor
└── docs/                          # Comprehensive Documentation
    ├── MT5_INTEGRATION_GUIDE_TH.md # Thai installation guide for traders
    ├── API_DOCUMENTATION.md      # Full REST API specifications
    └── architecture.md           # System design and database schema
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Java 21** or later
- **Node.js 18+** and **npm**
- **MetaTrader 5** desktop terminal

### 2. Running the Backend
```bash
cd backend
# Run locally (uses file/in-memory database with pre-configured settings)
mvnw spring-boot:run -Dspring-boot.run.profiles=local
```
The backend server starts on `http://localhost:8080`.

### 3. Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend SPA starts on `http://localhost:5173`.

### 4. Running the MT5 Expert Advisor
1. In MT5, open `File -> Open Data Folder -> MQL5/Experts/` and copy [`TradingJournalSync.mq5`](file:///d:/tradeweb/mt5/Experts/TradingJournalSync.mq5).
2. Go to `Tools -> Options -> Expert Advisors`, enable **Allow WebRequest for listed URL**, and add `http://localhost:8080`.
3. In the TradeJournal web app, navigate to **MT5 Sync** (`/mt5-connections`), generate your EA Token (`tj_...`), and paste it into the EA inputs.
4. Attach the EA to any active chart and turn on **Algo Trading**.

---

## 🧪 Testing

Run the automated integration test suite:
```bash
cd backend
mvnw test
```
The test suite validates:
- `AuthAndAccountIntegrationTest`: Authentication, JWT issuance, multi-user data isolation.
- `Mt5SyncIntegrationTest`: Bearer token authorization, batch deduplication, partial success policy, token rotation and immediate invalidation.
- `TradeNormalizationAndJournalIntegrationTest`: Deal aggregation, weighted entry/exit calculation, journal evaluation, R-multiple calculation.
- `AnalyticsAndCsvIntegrationTest`: Performance KPIs, drawdown calculation, multi-dimensional breakdowns, CSV export and import.

---

## 📖 Documentation
- [Thai MT5 EA Installation Manual](file:///d:/tradeweb/docs/MT5_INTEGRATION_GUIDE_TH.md)
- [REST API Specifications](file:///d:/tradeweb/docs/API_DOCUMENTATION.md)
- [Architecture & System Design](file:///d:/tradeweb/docs/architecture.md)
"# Tradeweb-conectMT5" 
