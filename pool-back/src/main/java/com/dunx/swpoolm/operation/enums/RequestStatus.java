package com.dunx.swpoolm.operation.enums;

public enum RequestStatus {
    PENDING,    // Chờ Admin duyệt
    APPROVED,   // Đã duyệt → Enrollment được tạo tự động
    REJECTED    // Bị từ chối
}
