package com.tradeweb.trade.dto;

import com.tradeweb.trade.entity.EmotionAfter;
import com.tradeweb.trade.entity.EmotionBefore;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.math.BigDecimal;

public class UpdateJournalRequest {

    private String setupName;
    private String entryReason;
    private String exitReason;
    private String notes;
    private EmotionBefore emotionBefore;
    private EmotionAfter emotionAfter;
    private Boolean followedRules;
    private String mistakes;
    private String postTradeReview;

    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    private BigDecimal riskAmount;

    public UpdateJournalRequest() {}

    public String getSetupName() {
        return setupName;
    }

    public void setSetupName(String setupName) {
        this.setupName = setupName;
    }

    public String getEntryReason() {
        return entryReason;
    }

    public void setEntryReason(String entryReason) {
        this.entryReason = entryReason;
    }

    public String getExitReason() {
        return exitReason;
    }

    public void setExitReason(String exitReason) {
        this.exitReason = exitReason;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public EmotionBefore getEmotionBefore() {
        return emotionBefore;
    }

    public void setEmotionBefore(EmotionBefore emotionBefore) {
        this.emotionBefore = emotionBefore;
    }

    public EmotionAfter getEmotionAfter() {
        return emotionAfter;
    }

    public void setEmotionAfter(EmotionAfter emotionAfter) {
        this.emotionAfter = emotionAfter;
    }

    public Boolean getFollowedRules() {
        return followedRules;
    }

    public void setFollowedRules(Boolean followedRules) {
        this.followedRules = followedRules;
    }

    public String getMistakes() {
        return mistakes;
    }

    public void setMistakes(String mistakes) {
        this.mistakes = mistakes;
    }

    public String getPostTradeReview() {
        return postTradeReview;
    }

    public void setPostTradeReview(String postTradeReview) {
        this.postTradeReview = postTradeReview;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public BigDecimal getRiskAmount() {
        return riskAmount;
    }

    public void setRiskAmount(BigDecimal riskAmount) {
        this.riskAmount = riskAmount;
    }
}
