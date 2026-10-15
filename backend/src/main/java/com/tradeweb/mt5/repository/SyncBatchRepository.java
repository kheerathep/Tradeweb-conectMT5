package com.tradeweb.mt5.repository;

import com.tradeweb.mt5.entity.SyncBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SyncBatchRepository extends JpaRepository<SyncBatch, Long> {
    List<SyncBatch> findByIntegrationIdOrderByReceivedAtDesc(Long integrationId);
}
