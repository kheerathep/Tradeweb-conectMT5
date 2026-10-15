package com.tradeweb.trade.service;

import com.tradeweb.account.repository.TradingAccountRepository;
import com.tradeweb.common.exception.ResourceNotFoundException;
import com.tradeweb.trade.dto.CsvImportResultDto;
import com.tradeweb.trade.entity.EmotionAfter;
import com.tradeweb.trade.entity.EmotionBefore;
import com.tradeweb.trade.entity.Trade;
import com.tradeweb.trade.entity.TradeDirection;
import com.tradeweb.trade.entity.TradeSource;
import com.tradeweb.trade.entity.TradeStatus;
import com.tradeweb.trade.repository.TradeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Service
public class CsvTradeService {

    private final TradeRepository tradeRepository;
    private final TradingAccountRepository tradingAccountRepository;

    public CsvTradeService(TradeRepository tradeRepository, TradingAccountRepository tradingAccountRepository) {
        this.tradeRepository = tradeRepository;
        this.tradingAccountRepository = tradingAccountRepository;
    }

    @Transactional(readOnly = true)
    public String exportTradesToCsv(Long userId, Long accountId) {
        verifyAccountOwnership(userId, accountId);
        List<Trade> trades = tradeRepository.findByTradingAccountIdOrderByOpenedAtDesc(accountId);

        StringBuilder sb = new StringBuilder();
        sb.append("ID,Symbol,Direction,Source,Status,Volume,EntryPrice,ExitPrice,GrossPnL,Commission,Swap,Fee,NetPnL,OpenedAt,ClosedAt,Setup,Mistakes,EmotionBefore,EmotionAfter,FollowedRules,Rating,Notes\r\n");

        for (Trade t : trades) {
            sb.append(t.getId() != null ? t.getId() : "").append(",");
            sb.append(escapeCsv(t.getSymbol())).append(",");
            sb.append(t.getDirection() != null ? t.getDirection().name() : "").append(",");
            sb.append(t.getTradeSource() != null ? t.getTradeSource().name() : "").append(",");
            sb.append(t.getTradeStatus() != null ? t.getTradeStatus().name() : "").append(",");
            sb.append(t.getTotalVolume() != null ? t.getTotalVolume().toPlainString() : "0").append(",");
            sb.append(t.getEntryPrice() != null ? t.getEntryPrice().toPlainString() : "").append(",");
            sb.append(t.getExitPrice() != null ? t.getExitPrice().toPlainString() : "").append(",");
            sb.append(t.getGrossPnl() != null ? t.getGrossPnl().toPlainString() : "").append(",");
            sb.append(t.getCommissionTotal() != null ? t.getCommissionTotal().toPlainString() : "").append(",");
            sb.append(t.getSwapTotal() != null ? t.getSwapTotal().toPlainString() : "").append(",");
            sb.append(t.getFeeTotal() != null ? t.getFeeTotal().toPlainString() : "").append(",");
            sb.append(t.getNetPnl() != null ? t.getNetPnl().toPlainString() : "").append(",");
            sb.append(t.getOpenedAt() != null ? t.getOpenedAt().toString() : "").append(",");
            sb.append(t.getClosedAt() != null ? t.getClosedAt().toString() : "").append(",");
            sb.append(escapeCsv(t.getSetupName())).append(",");
            sb.append(escapeCsv(t.getMistakes())).append(",");
            sb.append(t.getEmotionBefore() != null ? t.getEmotionBefore().name() : "").append(",");
            sb.append(t.getEmotionAfter() != null ? t.getEmotionAfter().name() : "").append(",");
            sb.append(t.getFollowedRules() != null ? t.getFollowedRules().toString() : "").append(",");
            sb.append(t.getRating() != null ? t.getRating().toString() : "").append(",");
            sb.append(escapeCsv(t.getNotes())).append("\r\n");
        }

        return sb.toString();
    }

    @Transactional
    public CsvImportResultDto importTradesFromCsv(Long userId, Long accountId, MultipartFile file) {
        verifyAccountOwnership(userId, accountId);

        int total = 0;
        int imported = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            Map<String, Integer> headerMap = null;

            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) continue;

                String[] cols = parseCsvLine(line);

                if (headerMap == null) {
                    // Try to detect header
                    boolean looksLikeHeader = false;
                    for (String col : cols) {
                        String clean = col.trim().toUpperCase();
                        if (clean.equals("SYMBOL") || clean.equals("DIRECTION") || clean.equals("SIDE") || clean.equals("TYPE") || clean.equals("PRICE")) {
                            looksLikeHeader = true;
                            break;
                        }
                    }

                    if (looksLikeHeader) {
                        headerMap = new HashMap<>();
                        for (int i = 0; i < cols.length; i++) {
                            String normKey = cols[i].trim().toLowerCase().replaceAll("[^a-z0-9]", "");
                            headerMap.put(normKey, i);
                        }
                        continue;
                    } else {
                        // Use default header layout
                        headerMap = new HashMap<>();
                        headerMap.put("symbol", 0);
                        headerMap.put("direction", 1);
                        headerMap.put("volume", 2);
                        headerMap.put("entryprice", 3);
                        headerMap.put("exitprice", 4);
                        headerMap.put("grosspnl", 5);
                        headerMap.put("commission", 6);
                        headerMap.put("swap", 7);
                        headerMap.put("fee", 8);
                        headerMap.put("netpnl", 9);
                    }
                }

                total++;
                try {
                    String symbol = getColValue(cols, headerMap, "symbol");
                    if (symbol == null || symbol.isEmpty()) {
                        skipped++;
                        errors.add("Row " + total + ": Missing symbol");
                        continue;
                    }
                    symbol = symbol.toUpperCase();

                    String dirStr = getColValue(cols, headerMap, "direction", "side", "type");
                    TradeDirection direction = (dirStr != null && dirStr.toUpperCase().contains("SELL"))
                            ? TradeDirection.SELL
                            : TradeDirection.BUY;

                    BigDecimal volume = parseDecimal(getColValue(cols, headerMap, "volume", "lots", "size"), new BigDecimal("0.1"));
                    BigDecimal entryPrice = parseDecimal(getColValue(cols, headerMap, "entryprice", "openprice", "price"), BigDecimal.ZERO);
                    BigDecimal exitPrice = parseDecimal(getColValue(cols, headerMap, "exitprice", "closeprice"), null);

                    BigDecimal grossPnl = parseDecimal(getColValue(cols, headerMap, "grosspnl", "gross", "profit"), BigDecimal.ZERO);
                    BigDecimal commission = parseDecimal(getColValue(cols, headerMap, "commission"), BigDecimal.ZERO);
                    BigDecimal swap = parseDecimal(getColValue(cols, headerMap, "swap"), BigDecimal.ZERO);
                    BigDecimal fee = parseDecimal(getColValue(cols, headerMap, "fee"), BigDecimal.ZERO);

                    BigDecimal netPnl;
                    String netPnlStr = getColValue(cols, headerMap, "netpnl", "net");
                    if (netPnlStr != null && !netPnlStr.isEmpty()) {
                        netPnl = parseDecimal(netPnlStr, grossPnl.add(commission).add(swap).add(fee));
                    } else {
                        netPnl = grossPnl.add(commission).add(swap).add(fee);
                    }

                    Instant openedAt = parseInstant(getColValue(cols, headerMap, "openedat", "opentime", "date"), Instant.now());
                    Instant closedAt = parseInstant(getColValue(cols, headerMap, "closedat", "closetime"), null);

                    String setup = getColValue(cols, headerMap, "setup", "setupname", "strategy");
                    String mistakes = getColValue(cols, headerMap, "mistakes", "mistake");
                    String notes = getColValue(cols, headerMap, "notes", "comment");

                    EmotionBefore emotionBefore = parseEnum(EmotionBefore.class, getColValue(cols, headerMap, "emotionbefore"));
                    EmotionAfter emotionAfter = parseEnum(EmotionAfter.class, getColValue(cols, headerMap, "emotionafter"));

                    Boolean followedRules = null;
                    String rulesStr = getColValue(cols, headerMap, "followedrules");
                    if (rulesStr != null && !rulesStr.isEmpty()) {
                        followedRules = Boolean.parseBoolean(rulesStr);
                    }

                    Integer rating = null;
                    String ratingStr = getColValue(cols, headerMap, "rating");
                    if (ratingStr != null && !ratingStr.isEmpty()) {
                        try {
                            rating = Integer.parseInt(ratingStr);
                        } catch (Exception ignored) {}
                    }

                    Trade trade = new Trade(accountId, symbol, direction, TradeSource.CSV_IMPORT);
                    trade.setTotalVolume(volume);
                    trade.setEntryPrice(entryPrice);
                    trade.setExitPrice(exitPrice);
                    trade.setGrossPnl(grossPnl);
                    trade.setCommissionTotal(commission);
                    trade.setSwapTotal(swap);
                    trade.setFeeTotal(fee);
                    trade.setNetPnl(netPnl);
                    trade.setOpenedAt(openedAt);
                    trade.setClosedAt(closedAt);
                    trade.setSetupName(setup);
                    trade.setMistakes(mistakes);
                    trade.setEmotionBefore(emotionBefore);
                    trade.setEmotionAfter(emotionAfter);
                    trade.setFollowedRules(followedRules);
                    trade.setRating(rating);
                    trade.setNotes(notes);

                    if (exitPrice != null || closedAt != null) {
                        trade.setTradeStatus(TradeStatus.CLOSED);
                        trade.setClosedVolume(volume);
                        trade.setRemainingVolume(BigDecimal.ZERO);
                    } else {
                        trade.setTradeStatus(TradeStatus.OPEN);
                        trade.setClosedVolume(BigDecimal.ZERO);
                        trade.setRemainingVolume(volume);
                    }

                    tradeRepository.save(trade);
                    imported++;
                } catch (Exception e) {
                    skipped++;
                    errors.add("Row " + total + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            errors.add("Failed to read CSV file: " + e.getMessage());
        }

        return new CsvImportResultDto(total, imported, skipped, errors);
    }

    private String getColValue(String[] cols, Map<String, Integer> headerMap, String... keys) {
        if (headerMap == null) return null;
        for (String key : keys) {
            String norm = key.toLowerCase().replaceAll("[^a-z0-9]", "");
            Integer idx = headerMap.get(norm);
            if (idx != null && idx < cols.length) {
                String val = cols[idx].trim();
                return val.isEmpty() ? null : val;
            }
        }
        return null;
    }

    private BigDecimal parseDecimal(String str, BigDecimal defaultVal) {
        if (str == null || str.trim().isEmpty()) return defaultVal;
        try {
            return new BigDecimal(str.trim());
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private Instant parseInstant(String str, Instant defaultVal) {
        if (str == null || str.trim().isEmpty()) return defaultVal;
        try {
            return Instant.parse(str.trim());
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private <E extends Enum<E>> E parseEnum(Class<E> enumClass, String val) {
        if (val == null || val.trim().isEmpty()) return null;
        try {
            return Enum.valueOf(enumClass, val.trim().toUpperCase());
        } catch (Exception e) {
            return null;
        }
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n") || val.contains("\r")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }

    private String[] parseCsvLine(String line) {
        List<String> tokens = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '\"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '\"') {
                    sb.append('\"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                tokens.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        tokens.add(sb.toString().trim());
        return tokens.toArray(new String[0]);
    }

    private void verifyAccountOwnership(Long userId, Long accountId) {
        tradingAccountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Trading account not found or access denied"));
    }
}
