package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.excel.ExcelExportHelper;
import com.dunx.swpoolm.common.exception.ResourceNotFoundException;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.operation.entity.AttendanceRecord;
import com.dunx.swpoolm.operation.entity.Enrollment;
import com.dunx.swpoolm.operation.enums.EnrollmentStatus;
import com.dunx.swpoolm.operation.enums.SwimStyle;
import com.dunx.swpoolm.operation.repository.AttendanceRecordRepository;
import com.dunx.swpoolm.operation.repository.EnrollmentRepository;
import com.dunx.swpoolm.teacher.entity.Teacher;
import com.dunx.swpoolm.teacher.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.Row;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnrollmentExcelService {

    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final TeacherRepository teacherRepository;

    private static final String[] ENROLLMENT_HEADERS = {
            "STT", "Tên học viên", "Số điện thoại", "Giáo viên phụ trách",
            "Kiểu bơi", "Loại khóa", "Số buổi quy định", "Số buổi đã học",
            "Ngày bắt đầu", "Hạn thẻ", "Trạng thái"
    };

    private static final String[] HISTORY_HEADERS = {
            "STT", "Ngày điểm danh", "Khung giờ (Ca bơi)", "Giáo viên điểm danh", "Ghi chú"
    };

    /**
     * Admin: Xuất danh sách khóa học kèm bộ lọc
     */
    @Transactional(readOnly = true)
    public byte[] exportAdminEnrollments(EnrollmentStatus status, SwimStyle swimStyle, Boolean isGuaranteed,
                                         String studentName, UUID teacherId) throws IOException {
        List<Enrollment> list;
        if (teacherId != null) {
            list = enrollmentRepository.exportAllByTeacherWithFilters(teacherId, status);
        } else {
            list = enrollmentRepository.exportAllWithFilters(status, swimStyle, isGuaranteed, studentName);
        }

        ExcelExportHelper helper = new ExcelExportHelper("Danh sách khóa học");
        helper.addHeaderBanner("BÁO CÁO DANH SÁCH KHÓA HỌC BƠI", null);
        helper.setColumnHeaders(ENROLLMENT_HEADERS);

        long activeCount = 0;
        long completedCount = 0;
        long expiredCount = 0;

        for (int i = 0; i < list.size(); i++) {
            Enrollment e = list.get(i);
            boolean isZebra = (i % 2 == 1);
            Row row = helper.createDataRow(isZebra);

            String teachers = e.getTeachers().stream().map(Teacher::getFullName).collect(Collectors.joining(", "));
            int attended = (int) attendanceRecordRepository.countByEnrollmentId(e.getId());

            String statusStr = mapStatus(e.getStatus());
            if (e.getStatus() == EnrollmentStatus.ACTIVE) activeCount++;
            else if (e.getStatus() == EnrollmentStatus.COMPLETED) completedCount++;
            else if (e.getStatus() == EnrollmentStatus.EXPIRED) expiredCount++;

            helper.addNumberCell(row, 0, i + 1, isZebra);
            helper.addTextCell(row, 1, e.getStudent() != null ? e.getStudent().getFullName() : "—", isZebra, HorizontalAlignment.LEFT);
            helper.addTextCell(row, 2, e.getStudent() != null ? e.getStudent().getPhoneNumber() : "—", isZebra, HorizontalAlignment.CENTER);
            helper.addTextCell(row, 3, !teachers.isBlank() ? teachers : "—", isZebra, HorizontalAlignment.LEFT);
            helper.addTextCell(row, 4, mapSwimStyle(e.getSwimStyle()), isZebra, HorizontalAlignment.CENTER);
            helper.addTextCell(row, 5, Boolean.TRUE.equals(e.getIsGuaranteed()) ? "Cam kết" : "Thường", isZebra, HorizontalAlignment.CENTER);
            helper.addNumberCell(row, 6, e.getTotalQuota(), isZebra);
            helper.addNumberCell(row, 7, attended, isZebra);
            helper.addDateCell(row, 8, e.getStartDate(), isZebra);
            helper.addDateCell(row, 9, e.getExpireDate(), isZebra);
            helper.addStatusCell(row, 10, statusStr);
        }

        String summary = String.format("Tổng cộng: %d khóa học (Đang học: %d | Hoàn thành: %d | Hết hạn: %d)",
                list.size(), activeCount, completedCount, expiredCount);
        helper.addSummaryRow(summary);

        log.info("Đã xuất file Excel {} khóa học cho Admin", list.size());
        return helper.exportToByteArray();
    }

    /**
     * Teacher: Xuất danh sách học viên phụ trách
     */
    @Transactional(readOnly = true)
    public byte[] exportTeacherStudents(UUID userId, String searchName, SwimStyle swimStyle,
                                        EnrollmentStatus status, Boolean isGuaranteed) throws IOException {
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Teacher.NOT_FOUND));

        List<Enrollment> list = enrollmentRepository.exportTeacherEnrollmentsWithFilters(
                teacher.getId(), status, swimStyle, isGuaranteed, searchName);

        ExcelExportHelper helper = new ExcelExportHelper("Học viên phụ trách");
        helper.addHeaderBanner("DANH SÁCH HỌC VIÊN PHỤ TRÁCH - GIÁO VIÊN: " + teacher.getFullName().toUpperCase(), null);
        helper.setColumnHeaders(ENROLLMENT_HEADERS);

        long activeCount = 0;
        long completedCount = 0;
        long expiredCount = 0;

        for (int i = 0; i < list.size(); i++) {
            Enrollment e = list.get(i);
            boolean isZebra = (i % 2 == 1);
            Row row = helper.createDataRow(isZebra);

            String teachers = e.getTeachers().stream().map(Teacher::getFullName).collect(Collectors.joining(", "));
            int attended = (int) attendanceRecordRepository.countByEnrollmentId(e.getId());

            String statusStr = mapStatus(e.getStatus());
            if (e.getStatus() == EnrollmentStatus.ACTIVE) activeCount++;
            else if (e.getStatus() == EnrollmentStatus.COMPLETED) completedCount++;
            else if (e.getStatus() == EnrollmentStatus.EXPIRED) expiredCount++;

            helper.addNumberCell(row, 0, i + 1, isZebra);
            helper.addTextCell(row, 1, e.getStudent() != null ? e.getStudent().getFullName() : "—", isZebra, HorizontalAlignment.LEFT);
            helper.addTextCell(row, 2, e.getStudent() != null ? e.getStudent().getPhoneNumber() : "—", isZebra, HorizontalAlignment.CENTER);
            helper.addTextCell(row, 3, !teachers.isBlank() ? teachers : "—", isZebra, HorizontalAlignment.LEFT);
            helper.addTextCell(row, 4, mapSwimStyle(e.getSwimStyle()), isZebra, HorizontalAlignment.CENTER);
            helper.addTextCell(row, 5, Boolean.TRUE.equals(e.getIsGuaranteed()) ? "Cam kết" : "Thường", isZebra, HorizontalAlignment.CENTER);
            helper.addNumberCell(row, 6, e.getTotalQuota(), isZebra);
            helper.addNumberCell(row, 7, attended, isZebra);
            helper.addDateCell(row, 8, e.getStartDate(), isZebra);
            helper.addDateCell(row, 9, e.getExpireDate(), isZebra);
            helper.addStatusCell(row, 10, statusStr);
        }

        String summary = String.format("Tổng cộng: %d học viên (Đang học: %d | Hoàn thành: %d | Hết hạn: %d)",
                list.size(), activeCount, completedCount, expiredCount);
        helper.addSummaryRow(summary);

        log.info("Đã xuất file Excel {} học viên cho Giáo viên {}", list.size(), teacher.getFullName());
        return helper.exportToByteArray();
    }

    /**
     * Xuất lịch sử điểm danh của 1 khóa học
     */
    @Transactional(readOnly = true)
    public byte[] exportStudentHistory(UUID enrollmentId) throws IOException {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Common.NOT_FOUND));

        List<AttendanceRecord> records = attendanceRecordRepository.findByEnrollmentIdOrderByAttendDateDesc(enrollmentId);

        String studentName = enrollment.getStudent() != null ? enrollment.getStudent().getFullName() : "Học viên";
        String subtitle = String.format("Học viên: %s | Kiểu bơi: %s | Loại khóa: %s",
                studentName, mapSwimStyle(enrollment.getSwimStyle()), Boolean.TRUE.equals(enrollment.getIsGuaranteed()) ? "Cam kết" : "Thường");

        ExcelExportHelper helper = new ExcelExportHelper("Lịch sử điểm danh");
        helper.addHeaderBanner("BÁO CÁO LỊCH SỬ ĐIỂM DANH KHÓA HỌC", subtitle);
        helper.setColumnHeaders(HISTORY_HEADERS);

        for (int i = 0; i < records.size(); i++) {
            AttendanceRecord r = records.get(i);
            boolean isZebra = (i % 2 == 1);
            Row row = helper.createDataRow(isZebra);

            String shiftTime = (r.getShift() != null) ? (r.getShift().getStartTime() + " - " + r.getShift().getEndTime()) : "—";
            String teacherName = (r.getTeacher() != null) ? r.getTeacher().getFullName() : "—";

            helper.addNumberCell(row, 0, i + 1, isZebra);
            helper.addDateCell(row, 1, r.getAttendDate(), isZebra);
            helper.addTextCell(row, 2, shiftTime, isZebra, HorizontalAlignment.CENTER);
            helper.addTextCell(row, 3, teacherName, isZebra, HorizontalAlignment.LEFT);
            helper.addTextCell(row, 4, r.getNote() != null ? r.getNote() : "—", isZebra, HorizontalAlignment.LEFT);
        }

        helper.addSummaryRow(String.format("Tổng cộng: %d buổi điểm danh", records.size()));

        log.info("Đã xuất file Excel lịch sử điểm danh cho học viên {}", studentName);
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

    private String mapStatus(EnrollmentStatus status) {
        if (status == null) return "—";
        return switch (status) {
            case ACTIVE -> "Đang học";
            case COMPLETED -> "Hoàn thành";
            case EXPIRED -> "Hết hạn";
        };
    }
}
