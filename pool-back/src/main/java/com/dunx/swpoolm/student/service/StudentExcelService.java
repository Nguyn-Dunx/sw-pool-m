package com.dunx.swpoolm.student.service;

import com.dunx.swpoolm.common.excel.ExcelExportHelper;
import com.dunx.swpoolm.student.entity.Student;
import com.dunx.swpoolm.student.enums.SourceType;
import com.dunx.swpoolm.student.repository.StudentRepository;
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
public class StudentExcelService {

    private final StudentRepository studentRepository;

    private static final String[] STUDENT_HEADERS = {
            "STT", "Họ và tên", "Số điện thoại", "Ngày sinh", "Nguồn học viên", "Ngày tham gia"
    };

    @Transactional(readOnly = true)
    public byte[] exportStudents(String keyword, SourceType sourceType) throws IOException {
        List<Student> list = studentRepository.exportStudents(keyword, sourceType);

        ExcelExportHelper helper = new ExcelExportHelper("Danh sách học viên");
        helper.addHeaderBanner("BÁO CÁO DANH SÁCH HỌC VIÊN", null);
        helper.setColumnHeaders(STUDENT_HEADERS);

        long poolCount = 0;
        long teacherCount = 0;

        for (int i = 0; i < list.size(); i++) {
            Student s = list.get(i);
            boolean isZebra = (i % 2 == 1);
            Row row = helper.createDataRow(isZebra);

            String sourceStr = (s.getSourceType() == SourceType.TEACHER) ? "GV giới thiệu" : "Tự đến";
            if (s.getSourceType() == SourceType.TEACHER) teacherCount++;
            else poolCount++;

            LocalDate createdDate = null;
            if (s.getCreatedAt() != null) {
                createdDate = s.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
            }

            helper.addNumberCell(row, 0, i + 1, isZebra);
            helper.addTextCell(row, 1, s.getFullName() != null ? s.getFullName() : "—", isZebra, HorizontalAlignment.LEFT);
            helper.addTextCell(row, 2, s.getPhoneNumber() != null ? s.getPhoneNumber() : "—", isZebra, HorizontalAlignment.CENTER);
            helper.addDateCell(row, 3, s.getDob(), isZebra);
            helper.addTextCell(row, 4, sourceStr, isZebra, HorizontalAlignment.CENTER);
            helper.addDateCell(row, 5, createdDate, isZebra);
        }

        String summary = String.format("Tổng cộng: %d học viên (Tự đến: %d | GV giới thiệu: %d)",
                list.size(), poolCount, teacherCount);
        helper.addSummaryRow(summary);

        log.info("Đã xuất file Excel {} học viên", list.size());
        return helper.exportToByteArray();
    }
}
