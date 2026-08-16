package com.dunx.swpoolm.teacher.service;

import com.dunx.swpoolm.common.excel.ExcelExportHelper;
import com.dunx.swpoolm.teacher.entity.Teacher;
import com.dunx.swpoolm.teacher.enums.TeacherStatus;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class TeacherExcelService {

    private final TeacherRepository teacherRepository;

    private static final String[] TEACHER_HEADERS = {
            "STT", "Họ và tên", "Số điện thoại", "Chuyên môn", "Trạng thái", "Ngày tham gia"
    };

    @Transactional(readOnly = true)
    public byte[] exportTeachers(String keyword, TeacherStatus status) throws IOException {
        List<Teacher> list = teacherRepository.exportTeachers(keyword, status);

        ExcelExportHelper helper = new ExcelExportHelper("Danh sách giáo viên");
        helper.addHeaderBanner("BÁO CÁO DANH SÁCH GIÁO VIÊN", null);
        helper.setColumnHeaders(TEACHER_HEADERS);

        long activeCount = 0;
        long inactiveCount = 0;

        for (int i = 0; i < list.size(); i++) {
            Teacher t = list.get(i);
            boolean isZebra = (i % 2 == 1);
            Row row = helper.createDataRow(isZebra);

            String statusStr = (t.getStatus() == TeacherStatus.ACTIVE) ? "Hoạt động" : "Ngừng";
            if (t.getStatus() == TeacherStatus.ACTIVE) activeCount++;
            else inactiveCount++;

            String phone = (t.getUser() != null) ? t.getUser().getPhoneNumber() : "—";

            LocalDate createdDate = null;
            if (t.getCreatedAt() != null) {
                createdDate = t.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
            }

            helper.addNumberCell(row, 0, i + 1, isZebra);
            helper.addTextCell(row, 1, t.getFullName() != null ? t.getFullName() : "—", isZebra, HorizontalAlignment.LEFT);
            helper.addTextCell(row, 2, phone, isZebra, HorizontalAlignment.CENTER);
            helper.addTextCell(row, 3, t.getSpecialty() != null ? t.getSpecialty() : "—", isZebra, HorizontalAlignment.LEFT);
            helper.addStatusCell(row, 4, statusStr);
            helper.addDateCell(row, 5, createdDate, isZebra);
        }

        String summary = String.format("Tổng cộng: %d giáo viên (Hoạt động: %d | Ngừng hoạt động: %d)",
                list.size(), activeCount, inactiveCount);
        helper.addSummaryRow(summary);

        log.info("Đã xuất file Excel {} giáo viên", list.size());
        return helper.exportToByteArray();
    }
}
