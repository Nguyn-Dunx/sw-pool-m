package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.excel.ExcelExportHelper;
import com.dunx.swpoolm.common.exception.ResourceNotFoundException;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.operation.entity.EnrollmentRequest;
import com.dunx.swpoolm.operation.enums.RequestStatus;
import com.dunx.swpoolm.operation.enums.RequestType;
import com.dunx.swpoolm.operation.enums.SwimStyle;
import com.dunx.swpoolm.operation.repository.EnrollmentRequestRepository;
import com.dunx.swpoolm.teacher.entity.Teacher;
import com.dunx.swpoolm.teacher.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.Row;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnrollmentRequestExcelService {

    private final EnrollmentRequestRepository enrollmentRequestRepository;
    private final TeacherRepository teacherRepository;

    private static final String[] REQUEST_HEADERS = {
            "STT", "Học viên", "Số điện thoại", "Giáo viên đề xuất", "Kiểu bơi",
            "Loại khóa", "Loại yêu cầu", "Trạng thái", "Ghi chú Admin", "Ngày gửi"
    };

    @Transactional(readOnly = true)
    public byte[] exportAdminRequests(RequestStatus status, RequestType requestType, SwimStyle swimStyle,
                                      Boolean isGuaranteed, String studentName) throws IOException {
        List<EnrollmentRequest> list = enrollmentRequestRepository.exportAdminRequests(
                status, requestType, swimStyle, isGuaranteed, studentName);

        ExcelExportHelper helper = new ExcelExportHelper("Yêu cầu đăng ký");
        helper.addHeaderBanner("BÁO CÁO DANH SÁCH YÊU CẦU ĐĂNG KÝ KHÓA HỌC", null);
        helper.setColumnHeaders(REQUEST_HEADERS);

        long pendingCount = 0;
        long approvedCount = 0;
        long rejectedCount = 0;

        for (int i = 0; i < list.size(); i++) {
            EnrollmentRequest r = list.get(i);
            boolean isZebra = (i % 2 == 1);
            Row row = helper.createDataRow(isZebra);

            String statusStr = mapStatus(r.getStatus());
            if (r.getStatus() == RequestStatus.PENDING) pendingCount++;
            else if (r.getStatus() == RequestStatus.APPROVED) approvedCount++;
            else if (r.getStatus() == RequestStatus.REJECTED) rejectedCount++;

            String typeStr = (r.getRequestType() == RequestType.CREATE) ? "Tạo mới" : "Cập nhật";
            String teacherName = (r.getTeacher() != null) ? r.getTeacher().getFullName() : "—";
            String studentNameVal = (r.getStudent() != null) ? r.getStudent().getFullName() : "—";
            String phone = (r.getStudent() != null) ? r.getStudent().getPhoneNumber() : "—";

            LocalDate createdDate = null;
            if (r.getCreatedAt() != null) {
                createdDate = r.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
            }

            helper.addNumberCell(row, 0, i + 1, isZebra);
            helper.addTextCell(row, 1, studentNameVal, isZebra, HorizontalAlignment.LEFT);
            helper.addTextCell(row, 2, phone, isZebra, HorizontalAlignment.CENTER);
            helper.addTextCell(row, 3, teacherName, isZebra, HorizontalAlignment.LEFT);
            helper.addTextCell(row, 4, mapSwimStyle(r.getSwimStyle()), isZebra, HorizontalAlignment.CENTER);
            helper.addTextCell(row, 5, Boolean.TRUE.equals(r.getIsGuaranteed()) ? "Cam kết" : "Thường", isZebra, HorizontalAlignment.CENTER);
            helper.addTextCell(row, 6, typeStr, isZebra, HorizontalAlignment.CENTER);
            helper.addStatusCell(row, 7, statusStr);
            helper.addTextCell(row, 8, r.getAdminNote() != null ? r.getAdminNote() : "—", isZebra, HorizontalAlignment.LEFT);
            helper.addDateCell(row, 9, createdDate, isZebra);
        }

        String summary = String.format("Tổng cộng: %d yêu cầu (Chờ duyệt: %d | Đã duyệt: %d | Từ chối: %d)",
                list.size(), pendingCount, approvedCount, rejectedCount);
        helper.addSummaryRow(summary);

        log.info("Đã xuất file Excel {} yêu cầu đăng ký cho Admin", list.size());
        return helper.exportToByteArray();
    }

    @Transactional(readOnly = true)
    public byte[] exportTeacherRequests(UUID userId, RequestStatus status, RequestType requestType) throws IOException {
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Teacher.NOT_FOUND));

        List<EnrollmentRequest> list = enrollmentRequestRepository.exportTeacherRequests(
                teacher.getId(), status, requestType);

        ExcelExportHelper helper = new ExcelExportHelper("Yêu cầu của tôi");
        helper.addHeaderBanner("BÁO CÁO YÊU CẦU ĐĂNG KÝ - GIÁO VIÊN: " + teacher.getFullName().toUpperCase(), null);
        helper.setColumnHeaders(REQUEST_HEADERS);

        long pendingCount = 0;
        long approvedCount = 0;
        long rejectedCount = 0;

        for (int i = 0; i < list.size(); i++) {
            EnrollmentRequest r = list.get(i);
            boolean isZebra = (i % 2 == 1);
            Row row = helper.createDataRow(isZebra);

            String statusStr = mapStatus(r.getStatus());
            if (r.getStatus() == RequestStatus.PENDING) pendingCount++;
            else if (r.getStatus() == RequestStatus.APPROVED) approvedCount++;
            else if (r.getStatus() == RequestStatus.REJECTED) rejectedCount++;

            String typeStr = (r.getRequestType() == RequestType.CREATE) ? "Tạo mới" : "Cập nhật";
            String studentNameVal = (r.getStudent() != null) ? r.getStudent().getFullName() : "—";
            String phone = (r.getStudent() != null) ? r.getStudent().getPhoneNumber() : "—";

            LocalDate createdDate = null;
            if (r.getCreatedAt() != null) {
                createdDate = r.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
            }

            helper.addNumberCell(row, 0, i + 1, isZebra);
            helper.addTextCell(row, 1, studentNameVal, isZebra, HorizontalAlignment.LEFT);
            helper.addTextCell(row, 2, phone, isZebra, HorizontalAlignment.CENTER);
            helper.addTextCell(row, 3, teacher.getFullName(), isZebra, HorizontalAlignment.LEFT);
            helper.addTextCell(row, 4, mapSwimStyle(r.getSwimStyle()), isZebra, HorizontalAlignment.CENTER);
            helper.addTextCell(row, 5, Boolean.TRUE.equals(r.getIsGuaranteed()) ? "Cam kết" : "Thường", isZebra, HorizontalAlignment.CENTER);
            helper.addTextCell(row, 6, typeStr, isZebra, HorizontalAlignment.CENTER);
            helper.addStatusCell(row, 7, statusStr);
            helper.addTextCell(row, 8, r.getAdminNote() != null ? r.getAdminNote() : "—", isZebra, HorizontalAlignment.LEFT);
            helper.addDateCell(row, 9, createdDate, isZebra);
        }

        String summary = String.format("Tổng cộng: %d yêu cầu (Chờ duyệt: %d | Đã duyệt: %d | Từ chối: %d)",
                list.size(), pendingCount, approvedCount, rejectedCount);
        helper.addSummaryRow(summary);

        log.info("Đã xuất file Excel {} yêu cầu đăng ký cho Giáo viên {}", list.size(), teacher.getFullName());
        return helper.exportToByteArray();
    }

    private String mapSwimStyle(SwimStyle style) {
        if (style == null) return "—";
        return switch (style) {
            case FROG -> "Bơi ếch";
            case FREE -> "Bơi sải";
            case BACK -> "Bơi ngửa";
            case FLY -> "Bơi bướm";
        };
    }

    private String mapStatus(RequestStatus status) {
        if (status == null) return "—";
        return switch (status) {
            case PENDING -> "Chờ duyệt";
            case APPROVED -> "Đã duyệt";
            case REJECTED -> "Từ chối";
        };
    }
}
