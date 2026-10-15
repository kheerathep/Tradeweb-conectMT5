# TradeJournal REST API Documentation

Base URL: `/api/v1`
Authentication:
1. **User Web Session**: JWT Cookie (`access_token`) or `Authorization: Bearer <jwt_token>`
2. **MT5 EA Bridge**: `Authorization: Bearer tj_<hex_token>`

---

## 1. Authentication Endpoints

### Register User
* **Endpoint**: `POST /api/v1/auth/register`
* **Access**: Public
* **Request Body**:
```json
{
  "email": "trader@example.com",
  "username": "trader_alpha",
  "password": "StrongPassword123!",
  "displayName": "Trader Alpha",
  "timezone": "Asia/Bangkok"
}
```
* **Response** (`201 Created`):
```json
{
  "token": "eyJhbGciOiJIUz...",
  "user": {
    "id": 1,
    "email": "trader@example.com",
    "username": "trader_alpha",
    "displayName": "Trader Alpha",
    "timezone": "Asia/Bangkok"
  }
}
```

### Login
* **Endpoint**: `POST /api/v1/auth/login`
* **Access**: Public
* **Request Body**:
```json
{
  "username": "trader_alpha",
  "password": "StrongPassword123!"
}
```
* **Response** (`200 OK`): Sets HttpOnly `access_token` cookie and returns token + user payload.

### Current User
* **Endpoint**: `GET /api/v1/auth/me`
* **Access**: Authenticated

---

## 2. Trading Accounts Endpoints

### List Accounts
* **Endpoint**: `GET /api/v1/accounts`
* **Access**: Authenticated

### Create Trading Account
* **Endpoint**: `POST /api/v1/accounts`
* **Access**: Authenticated
* **Request Body**:
```json
{
  "accountName": "FTMO 100K Challenge",
  "broker": "FTMO",
  "mt5Server": "FTMO-Server-Demo",
  "accountType": "PROP",
  "currency": "USD",
  "initialBalance": 100000.00
}
```

### Archive Account
* **Endpoint**: `DELETE /api/v1/accounts/{id}`
* **Access**: Authenticated

---

## 3. MT5 Synchronization Endpoints

### MT5 EA Batch Ingestion
* **Endpoint**: `POST /api/v1/mt5/sync/batch`
* **Access**: MT5 EA Bearer Token (`Authorization: Bearer tj_...`)
* **Request Body**:
```json
{
  "apiVersion": "1.0",
  "batchId": "b1820468-6d27-4180-8798-2bcfead91c78",
  "checkpoint": "2026-10-12T10:30:00Z",
  "accountInfo": {
    "login": 12345678,
    "name": "Demo Trader",
    "company": "MetaQuotes Software Corp.",
    "server": "MetaQuotes-Demo",
    "currency": "USD",
    "balance": 10125.00,
    "equity": 10125.00
  },
  "deals": [
    {
      "ticket": 2001,
      "positionId": 101,
      "orderTicket": 301,
      "symbol": "EURUSD",
      "dealType": "DEAL_TYPE_BUY",
      "entryType": "ENTRY_IN",
      "volume": 0.50,
      "price": 1.08500,
      "dealTime": "2026-10-12T10:00:00Z",
      "profit": 0.00,
      "commission": -3.50,
      "swap": 0.00,
      "fee": 0.00
    }
  ]
}
```
* **Response** (`200 OK`):
```json
{
  "batchId": "b1820468-6d27-4180-8798-2bcfead91c78",
  "totalReceived": 1,
  "insertedCount": 1,
  "duplicateCount": 0,
  "rejectedCount": 0,
  "rejectionReasons": [],
  "newCheckpoint": "2026-10-12T10:00:00Z",
  "status": "SUCCESS",
  "message": "Processed 1 deals (1 inserted, 0 duplicates)"
}
```

### MT5 EA Heartbeat
* **Endpoint**: `POST /api/v1/mt5/sync/heartbeat`
* **Access**: MT5 EA Bearer Token

### Get Sync Status
* **Endpoint**: `GET /api/v1/mt5/sync/status`
* **Access**: MT5 EA Bearer Token

### Manage Connection (User Web App)
* **Generate / Rotate Token**: `POST /api/v1/mt5/connections/{tradingAccountId}/token`
* **Get Connection Details**: `GET /api/v1/mt5/connections/{tradingAccountId}`
* **Disconnect Bridge**: `POST /api/v1/mt5/connections/{tradingAccountId}/disconnect`
* **Get Recent Batches**: `GET /api/v1/mt5/connections/{tradingAccountId}/batches`
* **Get Synced Deals**: `GET /api/v1/mt5/connections/{tradingAccountId}/deals`

---

## 4. Trades & Journaling Endpoints

### List Trades
* **Endpoint**: `GET /api/v1/trades?accountId={id}&status={OPEN|CLOSED}&symbol={SYM}&fromTime={ISO}&toTime={ISO}`
* **Access**: Authenticated

### Get Trade Details
* **Endpoint**: `GET /api/v1/trades/{id}`
* **Access**: Authenticated
* **Response**: Returns trade record + underlying `Mt5Deal` list.

### Update Trade Journal
* **Endpoint**: `PUT /api/v1/trades/{id}/journal`
* **Access**: Authenticated
* **Request Body**:
```json
{
  "setupName": "Bull Flag Breakout",
  "entryReason": "Clean H1 retest",
  "notes": "Followed rules strictly",
  "emotionBefore": "CONFIDENT",
  "emotionAfter": "SATISFIED",
  "followedRules": true,
  "mistakes": "None",
  "rating": 5,
  "riskAmount": 100.00
}
```

### Log Manual Trade
* **Endpoint**: `POST /api/v1/trades`
* **Access**: Authenticated

### Delete Trade
* **Endpoint**: `DELETE /api/v1/trades/{id}`
* **Access**: Authenticated

### Export Trades to CSV
* **Endpoint**: `GET /api/v1/trades/export/csv?accountId={id}`
* **Access**: Authenticated
* **Response**: `text/csv; charset=UTF-8` file download.

### Import Trades from CSV
* **Endpoint**: `POST /api/v1/trades/import/csv`
* **Access**: Authenticated
* **Form Parameters**: `accountId` (Long), `file` (MultipartFile)
* **Response**:
```json
{
  "totalRows": 15,
  "importedCount": 15,
  "skippedCount": 0,
  "errors": []
}
```

---

## 5. Analytics & Performance Endpoints

### Get Analytics Report
* **Endpoint**: `GET /api/v1/analytics?accountId={id}&fromTime={ISO}&toTime={ISO}`
* **Access**: Authenticated
* **Response**:
```json
{
  "performance": {
    "totalNetPnl": 200.00,
    "grossProfit": 200.00,
    "grossLoss": 0.00,
    "profitFactor": 99.00,
    "winRate": 100.0,
    "totalTrades": 1,
    "winningTrades": 1,
    "losingTrades": 0,
    "breakEvenTrades": 0,
    "avgWin": 200.00,
    "avgLoss": 0.00,
    "winLossRatio": 0.00,
    "expectancy": 200.00,
    "maxDrawdownAmount": 0.00,
    "maxDrawdownPercent": 0.0,
    "maxConsecutiveWins": 1,
    "maxConsecutiveLosses": 0
  },
  "equityCurve": [...],
  "dailyPnl": [...],
  "bySymbol": [...],
  "bySession": [...],
  "byDayOfWeek": [...],
  "bySetup": [...],
  "byEmotion": [...],
  "byRuleCompliance": [...],
  "byMistakes": [...]
}
```
