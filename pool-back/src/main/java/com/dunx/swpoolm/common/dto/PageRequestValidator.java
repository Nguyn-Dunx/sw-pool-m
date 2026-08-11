package com.dunx.swpoolm.common.dto;

import com.dunx.swpoolm.common.exception.AppException;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Utility chuẩn hóa và validate tham số phân trang từ client.
 * <p>
 * Giới hạn: page >= 1, size 1-100. Tránh IllegalArgumentException không thân thiện
 * khi client gửi page=0 hoặc size=99999.
 */
public final class PageRequestValidator {

    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_SIZE = 10;
    private static final int MAX_SIZE = 100;

    private PageRequestValidator() {}

    /**
     * Validate và tạo Pageable từ tham số raw của client.
     *
     * @param page  1-based page number (null → default 1)
     * @param size  page size (null → default 10, max 100)
     * @param sort  Sort object (nullable)
     * @return Pageable đã validate
     * @throws AppException nếu page < 1 hoặc size < 1
     */
    public static Pageable validate(Integer page, Integer size, Sort sort) {
        int safePage = (page == null) ? DEFAULT_PAGE : page;
        int safeSize = (size == null) ? DEFAULT_SIZE : size;

        if (safePage < 1) {
            throw new AppException(MessageKeys.Common.PAGE_INVALID);
        }
        if (safeSize < 1 || safeSize > MAX_SIZE) {
            throw new AppException(MessageKeys.Common.SIZE_INVALID);
        }

        return (sort != null)
                ? PageRequest.of(safePage - 1, safeSize, sort)
                : PageRequest.of(safePage - 1, safeSize);
    }

    public static Pageable validate(Integer page, Integer size) {
        return validate(page, size, null);
    }
}
