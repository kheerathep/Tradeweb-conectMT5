//+------------------------------------------------------------------+
//|                                           TradingJournalSync.mq5 |
//|                                 Copyright 2026, TradeJournal App |
//|                                        https://www.tradejournal.io |
//+------------------------------------------------------------------+
#property copyright   "Copyright 2026, TradeJournal App"
#property link        "https://www.tradejournal.io"
#property version     "1.00"
#property description "Automated Trade Synchronizer for MetaTrader 5"
#property description "Synchronizes closed deal history & account metrics to TradeJournal web backend"

//--- Inputs
input group "=== Server Configuration ==="
input string   InpApiUrl                   = "http://localhost:8080";  // Backend API Base URL
input string   InpApiToken                 = "";                       // Integration Token (tj_...)
input int      InpTimeoutMs                = 10000;                    // Request Timeout (ms)

input group "=== Synchronization Settings ==="
input int      InpSyncIntervalSeconds      = 10;                       // Sync Check Interval (seconds)
input int      InpHeartbeatMinutes         = 5;                        // Heartbeat Interval (minutes)
input int      InpInitialLookbackDays      = 90;                       // Lookback History Days (first run)
input int      InpOverlapSeconds           = 120;                      // Time Overlap Buffer (seconds)
input int      InpMaxBatchSize             = 100;                      // Max Deals per Batch

//--- Global State
datetime       g_lastCheckpoint            = 0;
datetime       g_lastHeartbeatTime         = 0;
bool           g_pendingSyncFlag           = true;
int            g_consecutiveErrors         = 0;
string         g_checkpointKey             = "";
const string   EA_VERSION                  = "1.0.0";

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   PrintFormat("[TradeJournal] Initializing TradingJournalSync v%s...", EA_VERSION);

   // Validate Token
   if(StringLen(InpApiToken) < 8 || StringSubstr(InpApiToken, 0, 3) != "tj_")
     {
      Alert("[TradeJournal] Invalid API Token! Please generate a token starting with 'tj_' from TradeJournal Web.");
      return(INIT_PARAMETERS_INCORRECT);
     }

   // Format storage key for checkpoint: TJ_CKPT_<Login>
   g_checkpointKey = StringFormat("TJ_CKPT_%I64d", AccountInfoInteger(ACCOUNT_LOGIN));

   // Load checkpoint if exists
   if(GlobalVariableCheck(g_checkpointKey))
     {
      g_lastCheckpoint = (datetime)GlobalVariableGet(g_checkpointKey);
      PrintFormat("[TradeJournal] Restored checkpoint from GlobalVariable: %s", TimeToString(g_lastCheckpoint, TIME_DATE|TIME_SECONDS));
     }
   else
     {
      g_lastCheckpoint = TimeCurrent() - (InpInitialLookbackDays * 86400);
      PrintFormat("[TradeJournal] First time sync. Lookback checkpoint set to: %s", TimeToString(g_lastCheckpoint, TIME_DATE|TIME_SECONDS));
     }

   // Setup timer for periodic sync & heartbeat
   EventSetTimer(InpSyncIntervalSeconds);

   // Trigger initial sync and heartbeat
   g_pendingSyncFlag = true;
   SendHeartbeat();

   Print("[TradeJournal] Initialized successfully. WebRequest URL must be allowed in Tools -> Options -> Expert Advisors.");
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   EventKillTimer();
   PrintFormat("[TradeJournal] Deinitialized. Reason code: %d", reason);
  }

//+------------------------------------------------------------------+
//| Trade transaction listener                                       |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest &request,
                        const MqlTradeResult &result)
  {
   // Whenever a new deal is added to MT5 history, trigger sync immediately on next timer tick
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
     {
      PrintFormat("[TradeJournal] New deal transaction detected (Deal #%I64d). Queueing sync.", trans.deal);
      g_pendingSyncFlag = true;
     }
  }

//+------------------------------------------------------------------+
//| Timer event function                                             |
//+------------------------------------------------------------------+
void OnTimer()
  {
   datetime now = TimeCurrent();

   // 1. Check Heartbeat
   if(now - g_lastHeartbeatTime >= (InpHeartbeatMinutes * 60))
     {
      SendHeartbeat();
     }

   // 2. Perform Sync if pending or periodically
   if(g_pendingSyncFlag)
     {
      SyncDeals();
     }
  }

//+------------------------------------------------------------------+
//| Synchronize deals from MT5 history                               |
//+------------------------------------------------------------------+
void SyncDeals()
  {
   datetime toTime = TimeCurrent() + 60;
   datetime fromTime = g_lastCheckpoint - InpOverlapSeconds;
   if(fromTime < 0) fromTime = 0;

   if(!HistorySelect(fromTime, toTime))
     {
      Print("[TradeJournal] Warning: Failed to query HistorySelect.");
      return;
     }

   int totalDeals = HistoryDealsTotal();
   if(totalDeals == 0)
     {
      g_pendingSyncFlag = false;
      return;
     }

   // Collect deals in batches
   string dealsJsonArray = "";
   int countInBatch = 0;
   datetime maxDealTime = g_lastCheckpoint;

   for(int i = 0; i < totalDeals; i++)
     {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;

      datetime dealTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
      if(dealTime > maxDealTime) maxDealTime = dealTime;

      string dealJson = FormatDealJson(ticket);
      if(dealJson == "") continue;

      if(dealsJsonArray != "") dealsJsonArray += ",";
      dealsJsonArray += dealJson;
      countInBatch++;

      // When batch limit reached, send batch
      if(countInBatch >= InpMaxBatchSize)
        {
         bool sent = SendBatchPayload(dealsJsonArray, countInBatch, maxDealTime);
         if(!sent) return; // Wait for next tick if failed

         dealsJsonArray = "";
         countInBatch = 0;
        }
     }

   // Send remaining deals
   if(countInBatch > 0)
     {
      bool sent = SendBatchPayload(dealsJsonArray, countInBatch, maxDealTime);
      if(!sent) return;
     }

   // If all batches sent successfully, update checkpoint
   if(maxDealTime > g_lastCheckpoint)
     {
      g_lastCheckpoint = maxDealTime;
      GlobalVariableSet(g_checkpointKey, (double)g_lastCheckpoint);
      PrintFormat("[TradeJournal] Checkpoint advanced to %s", TimeToString(g_lastCheckpoint, TIME_DATE|TIME_SECONDS));
     }

   g_pendingSyncFlag = false;
   g_consecutiveErrors = 0;
  }

//+------------------------------------------------------------------+
//| Send Batch JSON payload via WebRequest                           |
//+------------------------------------------------------------------+
bool SendBatchPayload(const string &dealsJsonArray, int dealCount, datetime batchCheckpoint)
  {
   string batchId = GenerateUniqueId();
   string accountJson = FormatAccountInfoJson();
   string isoCheckpoint = FormatIsoTime(batchCheckpoint);

   string payload = StringFormat(
      "{\"apiVersion\":\"1.0\",\"batchId\":\"%s\",\"checkpoint\":\"%s\",\"accountInfo\":%s,\"deals\":[%s]}",
      batchId, isoCheckpoint, accountJson, dealsJsonArray
   );

   string endpoint = InpApiUrl + "/api/v1/mt5/sync/batch";
   string headers = StringFormat("Content-Type: application/json\r\nAuthorization: Bearer %s\r\n", InpApiToken);

   char postData[];
   char resultData[];
   string resultHeaders;
   StringToCharArray(payload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(postData, ArraySize(postData) - 1); // remove null terminator

   ResetLastError();
   int res = WebRequest("POST", endpoint, headers, InpTimeoutMs, postData, resultData, resultHeaders);

   if(res == -1)
     {
      int err = GetLastError();
      PrintFormat("[TradeJournal] WebRequest failed! Error code: %d. Check Tools->Options->Expert Advisors->Allow WebRequest for '%s'", err, InpApiUrl);
      g_consecutiveErrors++;
      return false;
     }

   if(res == 200)
     {
      string responseText = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);
      PrintFormat("[TradeJournal] Batch sent successfully (%d deals). Response: %s", dealCount, responseText);
      return true;
     }
   else if(res == 401)
     {
      Alert("[TradeJournal] FATAL: API Token is revoked or invalid! Disabling auto-sync until updated.");
      g_pendingSyncFlag = false;
      return false;
     }
   else
     {
      string responseText = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);
      PrintFormat("[TradeJournal] Server returned HTTP %d: %s", res, responseText);
      g_consecutiveErrors++;
      return false;
     }
  }

//+------------------------------------------------------------------+
//| Send Heartbeat ping to server                                    |
//+------------------------------------------------------------------+
void SendHeartbeat()
  {
   long login = AccountInfoInteger(ACCOUNT_LOGIN);
   string name = EscapeJsonString(AccountInfoString(ACCOUNT_NAME));
   string company = EscapeJsonString(AccountInfoString(ACCOUNT_COMPANY));
   string server = EscapeJsonString(AccountInfoString(ACCOUNT_SERVER));
   string currency = AccountInfoString(ACCOUNT_CURRENCY);
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);

   string payload = StringFormat(
      "{\"accountLogin\":%I64d,\"accountName\":\"%s\",\"company\":\"%s\",\"server\":\"%s\",\"currency\":\"%s\",\"balance\":%.2f,\"equity\":%.2f,\"eaVersion\":\"%s\"}",
      login, name, company, server, currency, balance, equity, EA_VERSION
   );

   string endpoint = InpApiUrl + "/api/v1/mt5/sync/heartbeat";
   string headers = StringFormat("Content-Type: application/json\r\nAuthorization: Bearer %s\r\n", InpApiToken);

   char postData[];
   char resultData[];
   string resultHeaders;
   StringToCharArray(payload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(postData, ArraySize(postData) - 1);

   ResetLastError();
   int res = WebRequest("POST", endpoint, headers, InpTimeoutMs, postData, resultData, resultHeaders);
   if(res == 200)
     {
      g_lastHeartbeatTime = TimeCurrent();
     }
   else if(res == 401)
     {
      Alert("[TradeJournal] Heartbeat 401 Unauthorized: Check API Token in Inputs.");
     }
  }

//+------------------------------------------------------------------+
//| Format a Deal into JSON                                          |
//+------------------------------------------------------------------+
string FormatDealJson(ulong ticket)
  {
   long positionId   = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
   long orderTicket  = HistoryDealGetInteger(ticket, DEAL_ORDER);
   string symbol     = HistoryDealGetString(ticket, DEAL_SYMBOL);
   long dealTypeEnum = HistoryDealGetInteger(ticket, DEAL_TYPE);
   long entryEnum    = HistoryDealGetInteger(ticket, DEAL_ENTRY);
   double volume     = HistoryDealGetDouble(ticket, DEAL_VOLUME);
   double price      = HistoryDealGetDouble(ticket, DEAL_PRICE);
   datetime dealTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
   double profit     = HistoryDealGetDouble(ticket, DEAL_PROFIT);
   double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
   double swap       = HistoryDealGetDouble(ticket, DEAL_SWAP);
   double fee        = HistoryDealGetDouble(ticket, DEAL_FEE);
   long reason       = HistoryDealGetInteger(ticket, DEAL_REASON);
   long magic        = HistoryDealGetInteger(ticket, DEAL_MAGIC);
   string comment    = EscapeJsonString(HistoryDealGetString(ticket, DEAL_COMMENT));

   string dealTypeStr = GetDealTypeString(dealTypeEnum);
   string entryTypeStr = GetEntryTypeString(entryEnum);
   string isoDealTime = FormatIsoTime(dealTime);

   return StringFormat(
      "{\"ticket\":%I64d,\"positionId\":%I64d,\"orderTicket\":%I64d,\"symbol\":\"%s\",\"dealType\":\"%s\",\"entryType\":\"%s\",\"volume\":%.4f,\"price\":%.5f,\"dealTime\":\"%s\",\"profit\":%.2f,\"commission\":%.2f,\"swap\":%.2f,\"fee\":%.2f,\"reason\":%d,\"magicNumber\":%I64d,\"comment\":\"%s\"}",
      ticket, positionId, orderTicket, symbol, dealTypeStr, entryTypeStr, volume, price, isoDealTime, profit, commission, swap, fee, (int)reason, magic, comment
   );
  }

//+------------------------------------------------------------------+
//| Format Account Info into JSON                                    |
//+------------------------------------------------------------------+
string FormatAccountInfoJson()
  {
   long login = AccountInfoInteger(ACCOUNT_LOGIN);
   string name = EscapeJsonString(AccountInfoString(ACCOUNT_NAME));
   string company = EscapeJsonString(AccountInfoString(ACCOUNT_COMPANY));
   string server = EscapeJsonString(AccountInfoString(ACCOUNT_SERVER));
   string currency = AccountInfoString(ACCOUNT_CURRENCY);
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);

   return StringFormat(
      "{\"login\":%I64d,\"name\":\"%s\",\"company\":\"%s\",\"server\":\"%s\",\"currency\":\"%s\",\"balance\":%.2f,\"equity\":%.2f}",
      login, name, company, server, currency, balance, equity
   );
  }

//+------------------------------------------------------------------+
//| Helper: Format MT5 datetime to ISO-8601 (YYYY-MM-DDTHH:MM:SSZ)   |
//+------------------------------------------------------------------+
string FormatIsoTime(datetime time)
  {
   MqlDateTime dt;
   TimeToStruct(time, dt);
   return StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ", dt.year, dt.mon, dt.day, dt.hour, dt.min, dt.sec);
  }

//+------------------------------------------------------------------+
//| Helper: Deal Type enumeration to String                          |
//+------------------------------------------------------------------+
string GetDealTypeString(long dealType)
  {
   switch(dealType)
     {
      case DEAL_TYPE_BUY:                      return "DEAL_TYPE_BUY";
      case DEAL_TYPE_SELL:                     return "DEAL_TYPE_SELL";
      case DEAL_TYPE_BALANCE:                  return "DEAL_TYPE_BALANCE";
      case DEAL_TYPE_CREDIT:                   return "DEAL_TYPE_CREDIT";
      case DEAL_TYPE_CHARGE:                   return "DEAL_TYPE_CHARGE";
      case DEAL_TYPE_CORRECTION:               return "DEAL_TYPE_CORRECTION";
      case DEAL_TYPE_BONUS:                    return "DEAL_TYPE_BONUS";
      case DEAL_TYPE_COMMISSION:               return "DEAL_TYPE_COMMISSION";
      case DEAL_TYPE_COMMISSION_DAILY:         return "DEAL_TYPE_COMMISSION_DAILY";
      case DEAL_TYPE_COMMISSION_MONTHLY:       return "DEAL_TYPE_COMMISSION_MONTHLY";
      case DEAL_TYPE_INTEREST:                 return "DEAL_TYPE_INTEREST";
      default:                                 return "DEAL_TYPE_UNKNOWN";
     }
  }

//+------------------------------------------------------------------+
//| Helper: Entry Type enumeration to String                         |
//+------------------------------------------------------------------+
string GetEntryTypeString(long entryType)
  {
   switch(entryType)
     {
      case DEAL_ENTRY_IN:    return "ENTRY_IN";
      case DEAL_ENTRY_OUT:   return "ENTRY_OUT";
      case DEAL_ENTRY_INOUT: return "ENTRY_INOUT";
      case DEAL_ENTRY_OUT_BY:return "ENTRY_OUT_BY";
      default:               return "ENTRY_STATE";
     }
  }

//+------------------------------------------------------------------+
//| Helper: Escape characters for JSON string                        |
//+------------------------------------------------------------------+
string EscapeJsonString(string text)
  {
   StringReplace(text, "\\", "\\\\");
   StringReplace(text, "\"", "\\\"");
   StringReplace(text, "\r", "");
   StringReplace(text, "\n", "\\n");
   StringReplace(text, "\t", " ");
   return text;
  }

//+------------------------------------------------------------------+
//| Helper: Generate pseudo-random UUID                              |
//+------------------------------------------------------------------+
string GenerateUniqueId()
  {
   return StringFormat("%08X-%04X-%04X-%04X-%012I64X",
      MathRand() * 65536 + MathRand(),
      MathRand(),
      0x4000 | (MathRand() & 0x0FFF),
      0x8000 | (MathRand() & 0x3FFF),
      (ulong)TimeCurrent() * 1000 + (MathRand() % 1000)
   );
  }
//+------------------------------------------------------------------+
