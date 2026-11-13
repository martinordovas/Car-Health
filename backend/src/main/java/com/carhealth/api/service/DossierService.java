package com.carhealth.api.service;

import com.carhealth.api.domain.FuelLog;
import com.carhealth.api.domain.PartItem;
import com.carhealth.api.domain.ServiceRecord;
import com.carhealth.api.domain.Vehicle;
import com.carhealth.api.dto.StatsDtos;
import com.carhealth.api.dto.VehicleDtos;
import com.carhealth.api.repository.FuelLogRepository;
import com.carhealth.api.repository.ServiceRecordRepository;
import org.openpdf.text.Document;
import org.openpdf.text.DocumentException;
import org.openpdf.text.Element;
import org.openpdf.text.Font;
import org.openpdf.text.FontFactory;
import org.openpdf.text.PageSize;
import org.openpdf.text.Paragraph;
import org.openpdf.text.Phrase;
import org.openpdf.text.pdf.PdfPCell;
import org.openpdf.text.pdf.PdfPTable;
import org.openpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
public class DossierService {

    private static final Color BRAND = new Color(22, 61, 44);
    private static final Color INK = new Color(17, 24, 21);
    private static final Color MUTED = new Color(104, 115, 109);
    private static final Color LINE = new Color(230, 233, 226);
    private static final Color SOFT = new Color(245, 248, 243);
    private static final Color ACCENT = new Color(199, 242, 91);
    private static final Locale ES = Locale.forLanguageTag("es-ES");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final VehicleService vehicleService;
    private final FuelLogRepository fuelLogRepository;
    private final ServiceRecordRepository serviceRecordRepository;
    private final AnalyticsService analyticsService;

    public DossierService(VehicleService vehicleService,
                          FuelLogRepository fuelLogRepository,
                          ServiceRecordRepository serviceRecordRepository,
                          AnalyticsService analyticsService) {
        this.vehicleService = vehicleService;
        this.fuelLogRepository = fuelLogRepository;
        this.serviceRecordRepository = serviceRecordRepository;
        this.analyticsService = analyticsService;
    }

    @Transactional(readOnly = true)
    public byte[] generate(Long vehicleId, Long userId) {
        Vehicle vehicle = vehicleService.requireVehicle(vehicleId, userId);
        List<ServiceRecord> services = serviceRecordRepository.findByVehicleIdOrderByDateDescOdometerDesc(vehicleId);
        List<FuelLog> fuelLogs = fuelLogRepository.findByVehicleIdOrderByDateDescOdometerDesc(vehicleId);
        StatsDtos.VehicleStatsDto stats = analyticsService.vehicleStats(vehicleId, userId);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 42, 42, 42, 46);
        try {
            PdfWriter.getInstance(document, out);
            document.open();
            render(document, vehicle, stats, services, fuelLogs);
        } catch (DocumentException ex) {
            throw new IllegalStateException("No se pudo generar el dossier PDF", ex);
        } finally {
            document.close();
        }
        return out.toByteArray();
    }

    private void render(Document document, Vehicle vehicle, StatsDtos.VehicleStatsDto stats,
                        List<ServiceRecord> services, List<FuelLog> fuelLogs) throws DocumentException {
        Font brandFont = font(9, Font.BOLD, BRAND);
        Font titleFont = font(24, Font.BOLD, INK);
        Font subtitleFont = font(11, Font.NORMAL, MUTED);
        Font sectionFont = font(14, Font.BOLD, INK);
        Font bodyFont = font(9.5f, Font.NORMAL, INK);
        Font smallFont = font(8, Font.NORMAL, MUTED);
        Font whiteSmall = font(8, Font.BOLD, Color.WHITE);
        Font whiteValue = font(15, Font.BOLD, Color.WHITE);

        Paragraph eyebrow = new Paragraph("CAR HEALTH · DOSSIER DEL VEHÍCULO", brandFont);
        eyebrow.setSpacingAfter(8);
        document.add(eyebrow);

        String vehicleName = vehicle.getNickname() != null && !vehicle.getNickname().isBlank()
                ? vehicle.getNickname() + " · " + vehicle.getBrand() + " " + vehicle.getModel()
                : vehicle.getBrand() + " " + vehicle.getModel();
        Paragraph title = new Paragraph(vehicleName, titleFont);
        title.setSpacingAfter(4);
        document.add(title);
        Paragraph subtitle = new Paragraph(String.format("%s · %s · %s km",
                vehicle.getLicensePlate() != null ? vehicle.getLicensePlate() : "Sin matrícula",
                String.valueOf(vehicle.getYear()),
                formatInteger(vehicle.getCurrentOdometer())), subtitleFont);
        subtitle.setSpacingAfter(18);
        document.add(subtitle);

        PdfPTable summary = new PdfPTable(4);
        summary.setWidthPercentage(100);
        summary.setSpacingAfter(22);
        summary.setWidths(new float[]{1, 1, 1, 1});
        addMetric(summary, "GASTO TOTAL", money(stats.totals().totalSpent()), whiteSmall, whiteValue);
        addMetric(summary, "CONSUMO MEDIO", stats.totals().avgConsumption() == null ? "—"
                : number(stats.totals().avgConsumption()) + " L/100", whiteSmall, whiteValue);
        addMetric(summary, "AHORRO", money(stats.totals().totalSavings()), whiteSmall, whiteValue);
        addMetric(summary, "COSTE / KM", stats.totals().costPerKm() == null ? "—"
                : number(stats.totals().costPerKm()) + " €", whiteSmall, whiteValue);
        document.add(summary);

        document.add(section("Datos del vehículo"));
        PdfPTable data = new PdfPTable(2);
        data.setWidthPercentage(100);
        data.setSpacingAfter(20);
        data.setWidths(new float[]{1, 2});
        addDataRow(data, "Marca y modelo", vehicle.getBrand() + " " + vehicle.getModel(), bodyFont, smallFont);
        addDataRow(data, "Año", String.valueOf(vehicle.getYear()), bodyFont, smallFont);
        addDataRow(data, "Matrícula", valueOrDash(vehicle.getLicensePlate()), bodyFont, smallFont);
        addDataRow(data, "VIN", valueOrDash(vehicle.getVin()), bodyFont, smallFont);
        addDataRow(data, "Motor", valueOrDash(vehicle.getEngineCode()), bodyFont, smallFont);
        addDataRow(data, "Combustible", vehicle.getFuelType().name().replace('_', ' '), bodyFont, smallFont);
        addDataRow(data, "Compra", vehicle.getPurchaseDate() != null ? DATE.format(vehicle.getPurchaseDate()) : "—",
                bodyFont, smallFont);
        document.add(data);

        document.add(section("Historial de mantenimiento"));
        PdfPTable maintenance = new PdfPTable(new float[]{1.1f, 0.8f, 2.6f, 1.5f, 1.1f});
        maintenance.setWidthPercentage(100);
        maintenance.setHeaderRows(1);
        maintenance.setSpacingAfter(20);
        for (String header : List.of("FECHA", "KM", "INTERVENCIÓN", "TIPO", "COSTE")) {
            maintenance.addCell(headerCell(header, whiteSmall));
        }
        if (services.isEmpty()) {
            PdfPCell empty = new PdfPCell(new Phrase("Todavía no hay intervenciones registradas.", smallFont));
            empty.setColspan(5);
            empty.setPadding(12);
            empty.setBorderColor(LINE);
            maintenance.addCell(empty);
        } else {
            for (ServiceRecord record : services) {
                maintenance.addCell(textCell(DATE.format(record.getDate()), bodyFont));
                maintenance.addCell(textCell(formatInteger(record.getOdometer()), bodyFont));
                maintenance.addCell(textCell(record.getTitle(), bodyFont));
                maintenance.addCell(textCell(categoryLabel(record.getCategory()), bodyFont));
                maintenance.addCell(textCell(money(record.getTotalCost()), bodyFont));
                if (!record.getParts().isEmpty()) {
                    String parts = record.getParts().stream()
                            .map(part -> "· " + part.getPartName() + " × " + number(part.getQuantity())
                                    + " — " + money(part.lineTotal()))
                            .reduce((a, b) -> a + "\n" + b)
                            .orElse("");
                    PdfPCell partsCell = new PdfPCell(new Phrase(parts, smallFont));
                    partsCell.setColspan(5);
                    partsCell.setPadding(8);
                    partsCell.setBackgroundColor(SOFT);
                    partsCell.setBorderColor(LINE);
                    maintenance.addCell(partsCell);
                }
            }
        }
        document.add(maintenance);

        document.add(section("Últimos repostajes"));
        PdfPTable fuelTable = new PdfPTable(new float[]{1.1f, 2.4f, 1f, 1f, 1.1f});
        fuelTable.setWidthPercentage(100);
        fuelTable.setHeaderRows(1);
        fuelTable.setSpacingAfter(20);
        for (String header : List.of("FECHA", "GASOLINERA", "LITROS", "€/L", "TOTAL")) {
            fuelTable.addCell(headerCell(header, whiteSmall));
        }
        fuelLogs.stream().limit(10).forEach(log -> {
            fuelTable.addCell(textCell(DATE.format(log.getDate().toLocalDate()), bodyFont));
            fuelTable.addCell(textCell(log.getStationName() != null ? log.getStationName() : "—", bodyFont));
            fuelTable.addCell(textCell(number(log.getLiters()) + " L", bodyFont));
            fuelTable.addCell(textCell(number(log.getPricePerLiter()) + " €", bodyFont));
            fuelTable.addCell(textCell(money(log.getTotalCost()), bodyFont));
        });
        if (fuelLogs.isEmpty()) {
            PdfPCell empty = new PdfPCell(new Phrase("Todavía no hay repostajes registrados.", smallFont));
            empty.setColspan(5);
            empty.setPadding(12);
            empty.setBorderColor(LINE);
            fuelTable.addCell(empty);
        }
        document.add(fuelTable);

        Paragraph footer = new Paragraph("Documento generado el " + DATE.format(LocalDate.now())
                + " · Car Health · Datos del vehículo y su mantenimiento", smallFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(8);
        document.add(footer);
    }

    private Paragraph section(String text) {
        Paragraph paragraph = new Paragraph(text, font(14, Font.BOLD, INK));
        paragraph.setSpacingBefore(4);
        paragraph.setSpacingAfter(10);
        return paragraph;
    }

    private void addMetric(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(BRAND);
        cell.setBorderColor(BRAND);
        cell.setPadding(12);
        Paragraph labelParagraph = new Paragraph(label, labelFont);
        labelParagraph.setSpacingAfter(5);
        cell.addElement(labelParagraph);
        cell.addElement(new Paragraph(value, valueFont));
        table.addCell(cell);
    }

    private void addDataRow(PdfPTable table, String label, String value, Font bodyFont, Font labelFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setPadding(7);
        labelCell.setBorderColor(LINE);
        labelCell.setBackgroundColor(SOFT);
        PdfPCell valueCell = new PdfPCell(new Phrase(value, bodyFont));
        valueCell.setPadding(7);
        valueCell.setBorderColor(LINE);
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private PdfPCell headerCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(BRAND);
        cell.setBorderColor(BRAND);
        cell.setPadding(8);
        return cell;
    }

    private PdfPCell textCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(7);
        cell.setBorderColor(LINE);
        return cell;
    }

    private Font font(float size, int style, Color color) {
        return FontFactory.getFont(FontFactory.HELVETICA, size, style, color);
    }

    private String categoryLabel(com.carhealth.api.domain.ServiceCategory category) {
        return switch (category) {
            case PREVENTIVE -> "Preventivo";
            case CORRECTIVE -> "Reparación";
            case MODIFICATION -> "Mejora";
            case LEGAL -> "Legal";
        };
    }

    private String money(BigDecimal value) {
        if (value == null) {
            return "—";
        }
        return String.format(ES, "%,.2f €", value);
    }

    private String number(BigDecimal value) {
        if (value == null) {
            return "—";
        }
        return value.stripTrailingZeros().toPlainString().replace('.', ',');
    }

    private String formatInteger(Integer value) {
        return String.format(ES, "%,d", value);
    }

    private String valueOrDash(String value) {
        return value != null && !value.isBlank() ? value : "—";
    }
}
