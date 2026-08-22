package com.campus.campuserrand.dto;

import java.util.List;

public class InviteRecordResponse {

    private String inviteCode;
    private Integer totalInvites;
    private Integer totalRewardPoints;
    private List<InviteRecordItem> records;

    public String getInviteCode() {
        return inviteCode;
    }

    public void setInviteCode(String inviteCode) {
        this.inviteCode = inviteCode;
    }

    public Integer getTotalInvites() {
        return totalInvites;
    }

    public void setTotalInvites(Integer totalInvites) {
        this.totalInvites = totalInvites;
    }

    public Integer getTotalRewardPoints() {
        return totalRewardPoints;
    }

    public void setTotalRewardPoints(Integer totalRewardPoints) {
        this.totalRewardPoints = totalRewardPoints;
    }

    public List<InviteRecordItem> getRecords() {
        return records;
    }

    public void setRecords(List<InviteRecordItem> records) {
        this.records = records;
    }
}
