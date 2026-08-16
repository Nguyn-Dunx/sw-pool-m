package com.dunx.swpoolm.common.excel;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.DefaultIndexedColorMap;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class ExcelExportHelper {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final XSSFWorkbook workbook;
    private final Sheet sheet;
    private final CellStyle titleStyle;
    private final CellStyle subtitleStyle;
    private final CellStyle headerStyle;
    private final CellStyle textLeftStyle;
    private final CellStyle textCenterStyle;
    private final CellStyle textRightStyle;
    private final CellStyle dateStyle;
    private final CellStyle zebraTextLeftStyle;
    private final CellStyle zebraTextCenterStyle;
    private final CellStyle zebraDateStyle;
    private final CellStyle summaryStyle;
    private final CellStyle statusActiveStyle;
    private final CellStyle statusCompletedStyle;
    private final CellStyle statusExpiredStyle;
    private final CellStyle statusPendingStyle;
    private final CellStyle statusApprovedStyle;
    private final CellStyle statusRejectedStyle;

    private int currentRowIndex = 0;
    private int columnCount = 0;

    public ExcelExportHelper(String sheetName) {
        this.workbook = new XSSFWorkbook();
        this.sheet = workbook.createSheet(sheetName);
        this.sheet.setDisplayGridlines(true);

        // Fonts
        Font titleFont = createFont(16, true, IndexedColors.BLACK.getIndex());
        Font subtitleFont = createFont(10, false, IndexedColors.GREY_50_PERCENT.getIndex());
        Font headerFont = createFont(11, true, IndexedColors.WHITE.getIndex());
        Font regularFont = createFont(11, false, IndexedColors.BLACK.getIndex());
        Font boldFont = createFont(11, true, IndexedColors.BLACK.getIndex());
        Font summaryFont = createFont(11, true, IndexedColors.BLACK.getIndex());

        // Header Background Color (#0284C7 - Ocean Blue)
        byte[] headerRgb = new byte[]{(byte) 2, (byte) 132, (byte) 199};
        XSSFColor headerColor = new XSSFColor(headerRgb, new DefaultIndexedColorMap());

        // Zebra Background Color (#F8FAFC - Light Slate)
        byte[] zebraRgb = new byte[]{(byte) 248, (byte) 250, (byte) 252};
        XSSFColor zebraColor = new XSSFColor(zebraRgb, new DefaultIndexedColorMap());

        // Title Style
        this.titleStyle = workbook.createCellStyle();
        this.titleStyle.setFont(titleFont);
        this.titleStyle.setAlignment(HorizontalAlignment.CENTER);
        this.titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);

        // Subtitle Style
        this.subtitleStyle = workbook.createCellStyle();
        this.subtitleStyle.setFont(subtitleFont);
        this.subtitleStyle.setAlignment(HorizontalAlignment.CENTER);
        this.subtitleStyle.setVerticalAlignment(VerticalAlignment.CENTER);

        // Header Style
        this.headerStyle = workbook.createCellStyle();
        this.headerStyle.setFont(headerFont);
        this.headerStyle.setFillForegroundColor(headerColor);
        this.headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        this.headerStyle.setAlignment(HorizontalAlignment.CENTER);
        this.headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyBorders(this.headerStyle);

        // Text Left Style
        this.textLeftStyle = workbook.createCellStyle();
        this.textLeftStyle.setFont(regularFont);
        this.textLeftStyle.setAlignment(HorizontalAlignment.LEFT);
        this.textLeftStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyBorders(this.textLeftStyle);

        // Text Center Style
        this.textCenterStyle = workbook.createCellStyle();
        this.textCenterStyle.setFont(regularFont);
        this.textCenterStyle.setAlignment(HorizontalAlignment.CENTER);
        this.textCenterStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyBorders(this.textCenterStyle);

        // Text Right Style
        this.textRightStyle = workbook.createCellStyle();
        this.textRightStyle.setFont(regularFont);
        this.textRightStyle.setAlignment(HorizontalAlignment.RIGHT);
        this.textRightStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyBorders(this.textRightStyle);

        // Date Style
        this.dateStyle = workbook.createCellStyle();
        this.dateStyle.setFont(regularFont);
        this.dateStyle.setAlignment(HorizontalAlignment.CENTER);
        this.dateStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyBorders(this.dateStyle);

        // Zebra Text Left Style
        this.zebraTextLeftStyle = workbook.createCellStyle();
        this.zebraTextLeftStyle.cloneStyleFrom(this.textLeftStyle);
        this.zebraTextLeftStyle.setFillForegroundColor(zebraColor);
        this.zebraTextLeftStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        // Zebra Text Center Style
        this.zebraTextCenterStyle = workbook.createCellStyle();
        this.zebraTextCenterStyle.cloneStyleFrom(this.textCenterStyle);
        this.zebraTextCenterStyle.setFillForegroundColor(zebraColor);
        this.zebraTextCenterStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        // Zebra Date Style
        this.zebraDateStyle = workbook.createCellStyle();
        this.zebraDateStyle.cloneStyleFrom(this.dateStyle);
        this.zebraDateStyle.setFillForegroundColor(zebraColor);
        this.zebraDateStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        // Summary Style
        this.summaryStyle = workbook.createCellStyle();
        this.summaryStyle.setFont(summaryFont);
        this.summaryStyle.setAlignment(HorizontalAlignment.LEFT);
        this.summaryStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        this.summaryStyle.setBorderTop(BorderStyle.MEDIUM);
        this.summaryStyle.setBorderBottom(BorderStyle.DOUBLE);

        // Status Styles with distinct fonts
        this.statusActiveStyle = createStatusStyle(IndexedColors.GREEN.getIndex(), regularFont);
        this.statusCompletedStyle = createStatusStyle(IndexedColors.ROYAL_BLUE.getIndex(), regularFont);
        this.statusExpiredStyle = createStatusStyle(IndexedColors.GREY_50_PERCENT.getIndex(), regularFont);
        this.statusPendingStyle = createStatusStyle(IndexedColors.DARK_YELLOW.getIndex(), regularFont);
        this.statusApprovedStyle = createStatusStyle(IndexedColors.GREEN.getIndex(), regularFont);
        this.statusRejectedStyle = createStatusStyle(IndexedColors.RED.getIndex(), regularFont);
    }

    private Font createFont(int size, boolean bold, short colorIndex) {
        Font font = workbook.createFont();
        font.setFontName("Segoe UI");
        font.setFontHeightInPoints((short) size);
        font.setBold(bold);
        font.setColor(colorIndex);
        return font;
    }

    private CellStyle createStatusStyle(short colorIndex, Font baseFont) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontName("Segoe UI");
        font.setFontHeightInPoints(baseFont.getFontHeightInPoints());
        font.setBold(true);
        font.setColor(colorIndex);

        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyBorders(style);
        return style;
    }

    private void applyBorders(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setTopBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setBottomBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setLeftBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setRightBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
    }

    /**
     * Tạo tiêu đề lớn và thông tin ngày giờ xuất báo cáo
     */
    public void addHeaderBanner(String title, String subtitle) {
        // Title Row
        Row titleRow = sheet.createRow(currentRowIndex++);
        titleRow.setHeightInPoints(28);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue(title);
        titleCell.setCellStyle(titleStyle);

        // Subtitle Row
        Row subtitleRow = sheet.createRow(currentRowIndex++);
        subtitleRow.setHeightInPoints(18);
        Cell subtitleCell = subtitleRow.createCell(0);
        String sub = (subtitle != null && !subtitle.isBlank()) ? subtitle : 
                "Thời gian xuất: " + LocalDateTime.now().format(DATETIME_FORMATTER);
        subtitleCell.setCellValue(sub);
        subtitleCell.setCellStyle(subtitleStyle);

        // Empty spacer row
        sheet.createRow(currentRowIndex++).setHeightInPoints(8);
    }

    /**
     * Tạo Header các cột dữ liệu
     */
    public void setColumnHeaders(String[] headers) {
        this.columnCount = headers.length;

        // Merge title & subtitle across columns
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, columnCount - 1));
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, columnCount - 1));

        Row headerRow = sheet.createRow(currentRowIndex++);
        headerRow.setHeightInPoints(24);

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
    }

    /**
     * Tạo dòng dữ liệu mới
     */
    public Row createDataRow(boolean isZebra) {
        Row row = sheet.createRow(currentRowIndex++);
        row.setHeightInPoints(20);
        return row;
    }

    public void addTextCell(Row row, int colIndex, String value, boolean isZebra, HorizontalAlignment alignment) {
        Cell cell = row.createCell(colIndex);
        cell.setCellValue(value != null ? value : "—");
        if (alignment == HorizontalAlignment.CENTER) {
            cell.setCellStyle(isZebra ? zebraTextCenterStyle : textCenterStyle);
        } else if (alignment == HorizontalAlignment.RIGHT) {
            cell.setCellStyle(textRightStyle);
        } else {
            cell.setCellStyle(isZebra ? zebraTextLeftStyle : textLeftStyle);
        }
    }

    public void addNumberCell(Row row, int colIndex, Number value, boolean isZebra) {
        Cell cell = row.createCell(colIndex);
        if (value != null) {
            cell.setCellValue(value.doubleValue());
        } else {
            cell.setCellValue(0);
        }
        cell.setCellStyle(isZebra ? zebraTextCenterStyle : textCenterStyle);
    }

    public void addDateCell(Row row, int colIndex, LocalDate date, boolean isZebra) {
        Cell cell = row.createCell(colIndex);
        if (date != null) {
            cell.setCellValue(date.format(DATE_FORMATTER));
        } else {
            cell.setCellValue("—");
        }
        cell.setCellStyle(isZebra ? zebraDateStyle : dateStyle);
    }

    public void addStatusCell(Row row, int colIndex, String status) {
        Cell cell = row.createCell(colIndex);
        cell.setCellValue(status != null ? status : "—");

        if (status == null) {
            cell.setCellStyle(textCenterStyle);
            return;
        }

        switch (status) {
            case "Đang học", "Hoạt động", "Đã duyệt" -> cell.setCellStyle(statusActiveStyle);
            case "Hoàn thành" -> cell.setCellStyle(statusCompletedStyle);
            case "Hết hạn", "Ngừng", "Ngừng hoạt động" -> cell.setCellStyle(statusExpiredStyle);
            case "Chờ duyệt" -> cell.setCellStyle(statusPendingStyle);
            case "Từ chối" -> cell.setCellStyle(statusRejectedStyle);
            default -> cell.setCellStyle(textCenterStyle);
        }
    }

    /**
     * Dòng tổng kết ở cuối bảng
     */
    public void addSummaryRow(String summaryText) {
        Row row = sheet.createRow(currentRowIndex++);
        row.setHeightInPoints(22);
        Cell cell = row.createCell(0);
        cell.setCellValue(summaryText);
        cell.setCellStyle(summaryStyle);

        for (int i = 1; i < columnCount; i++) {
            Cell emptyCell = row.createCell(i);
            emptyCell.setCellStyle(summaryStyle);
        }

        sheet.addMergedRegion(new CellRangeAddress(row.getRowNum(), row.getRowNum(), 0, columnCount - 1));
    }

    /**
     * Tự động co giãn kích thước cột và xuất ra mảng byte
     */
    public byte[] exportToByteArray() throws IOException {
        for (int i = 0; i < columnCount; i++) {
            sheet.autoSizeColumn(i);
            // Thêm padding cho các cột để không bị sát mép
            int currentWidth = sheet.getColumnWidth(i);
            sheet.setColumnWidth(i, Math.min(Math.max(currentWidth + 1200, 3000), 12000));
        }

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            workbook.write(outputStream);
            workbook.close();
            return outputStream.toByteArray();
        }
    }
}
