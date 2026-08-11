package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.operation.dto.AlertResponse;

import java.util.List;
import java.util.UUID;

public interface AlertService {
    List<AlertResponse> getAlerts(UUID userId, boolean isAdmin);
}
