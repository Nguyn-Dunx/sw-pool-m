package com.dunx.swpoolm.common.dto;

import com.dunx.swpoolm.common.exception.AppException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit test cho PageRequestValidator — không cần Spring context.
 */
class PageRequestValidatorTest {

    @Test
    @DisplayName("page=null → default page 1")
    void nullPage_defaultsToOne() {
        var pageable = PageRequestValidator.validate(null, 10);
        assertEquals(0, pageable.getPageNumber()); // 0-based internal
        assertEquals(10, pageable.getPageSize());
    }

    @Test
    @DisplayName("size=null → default size 10")
    void nullSize_defaultsToTen() {
        var pageable = PageRequestValidator.validate(1, null);
        assertEquals(0, pageable.getPageNumber());
        assertEquals(10, pageable.getPageSize());
    }

    @Test
    @DisplayName("page=2 → internal page 1 (0-based)")
    void pageTwo_mapsToZeroBasedOne() {
        var pageable = PageRequestValidator.validate(2, 20);
        assertEquals(1, pageable.getPageNumber());
        assertEquals(20, pageable.getPageSize());
    }

    @Test
    @DisplayName("page=0 → throw AppException")
    void pageZero_throwsException() {
        AppException ex = assertThrows(AppException.class,
                () -> PageRequestValidator.validate(0, 10));
        assertEquals("validation.page_invalid", ex.getMessageKey());
    }

    @Test
    @DisplayName("page=-1 → throw AppException")
    void pageNegative_throwsException() {
        assertThrows(AppException.class,
                () -> PageRequestValidator.validate(-1, 10));
    }

    @Test
    @DisplayName("size=0 → throw AppException")
    void sizeZero_throwsException() {
        AppException ex = assertThrows(AppException.class,
                () -> PageRequestValidator.validate(1, 0));
        assertEquals("validation.size_invalid", ex.getMessageKey());
    }

    @Test
    @DisplayName("size=101 → throw AppException (max 100)")
    void sizeOverMax_throwsException() {
        assertThrows(AppException.class,
                () -> PageRequestValidator.validate(1, 101));
    }

    @Test
    @DisplayName("size=100 → OK (boundary)")
    void sizeMaxBoundary_ok() {
        var pageable = PageRequestValidator.validate(1, 100);
        assertEquals(100, pageable.getPageSize());
    }
}
