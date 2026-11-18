package com.carhealth.api;

import com.carhealth.api.domain.User;
import com.carhealth.api.repository.UserRepository;
import com.carhealth.api.service.VerificationEmailSender;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(ApiFlowIntegrationTest.MailTestConfig.class)
class ApiFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecordingVerificationEmailSender emailSender;

    @Autowired
    private UserRepository userRepository;

    @Test
    void fullVehicleFuelAndMaintenanceFlow() throws Exception {
        String email = "integration-" + UUID.randomUUID() + "@carhealth.test";
        String auth = "Bearer " + registerAndVerify(email, "Integración");

        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));

        mockMvc.perform(get("/api/v1/vehicles"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/vehicles").header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        String vehicleBody = """
                {"brand":"Seat","model":"León","year":2021,"nickname":"Test","currentOdometer":10000,
                 "fuelType":"GASOLINE_95","licensePlate":"TEST 001",
                 "photoData":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="}
                """;
        MvcResult vehicleResult = mockMvc.perform(post("/api/v1/vehicles")
                        .header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vehicleBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Test"))
                .andExpect(jsonPath("$.currentOdometer").value(10000))
                .andExpect(jsonPath("$.photoData").value("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="))
                .andReturn();
        long vehicleId = ((Number) JsonPath.read(vehicleResult.getResponse().getContentAsString(), "$.id")).longValue();

        mockMvc.perform(get("/api/v1/vehicles/{vehicleId}/maintenance-rules", vehicleId)
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(6))
                .andExpect(jsonPath("$[0].name").value("Aceite y filtro"));

        DateTimeFormatter dateTime = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
        LocalDateTime firstDate = LocalDateTime.now().minusDays(10).withHour(18).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime secondDate = LocalDateTime.now().minusDays(5).withHour(18).withMinute(0).withSecond(0).withNano(0);

        String firstFuel = """
                {"date":"%s","odometer":10500,"liters":40.0,"pricePerLiter":1.600,
                 "stationName":"Estación A","stationLocation":"Estación A · Madrid",
                 "fullTank":true,"boardComputerAvg":6.4,"clientMutationId":"fuel-first"}
                """.formatted(dateTime.format(firstDate));

        MvcResult firstFuelResult = mockMvc.perform(post("/api/v1/vehicles/{vehicleId}/fuel-logs", vehicleId)
                        .header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(firstFuel))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalCost").value(64.0))
                .andExpect(jsonPath("$.savings").doesNotExist())
                .andExpect(jsonPath("$.consumption").doesNotExist())
                .andReturn();
        long firstFuelId = ((Number) JsonPath.read(firstFuelResult.getResponse().getContentAsString(), "$.id")).longValue();

        String secondFuel = """
                {"date":"%s","odometer":11000,"liters":31.0,"pricePerLiter":1.500,
                 "stationName":"Estación A","stationLocation":"Estación A · Madrid",
                 "fullTank":true,"boardComputerAvg":6.2,"clientMutationId":"fuel-second"}
                """.formatted(dateTime.format(secondDate));

        MvcResult secondFuelResult = mockMvc.perform(post("/api/v1/vehicles/{vehicleId}/fuel-logs", vehicleId)
                        .header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(secondFuel))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalCost").value(46.5))
                .andExpect(jsonPath("$.consumption").value(6.2))
                .andExpect(jsonPath("$.savings.comparisonType").value("STATION_AVERAGE"))
                .andExpect(jsonPath("$.savings.savingsAmount").value(3.1))
                .andExpect(jsonPath("$.savings.referencePrice").value(1.6))
                .andReturn();
        long secondFuelId = ((Number) JsonPath.read(secondFuelResult.getResponse().getContentAsString(), "$.id")).longValue();
        assertThat(secondFuelId).isGreaterThan(firstFuelId);

        mockMvc.perform(post("/api/v1/vehicles/{vehicleId}/fuel-logs", vehicleId)
                        .header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(secondFuel))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(secondFuelId));

        mockMvc.perform(get("/api/v1/vehicles/{vehicleId}/fuel-logs", vehicleId)
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(post("/api/v1/vehicles/{vehicleId}/fuel-logs", vehicleId)
                        .header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"date":"%s","odometer":10000,"liters":10.0,"pricePerLiter":1.5}
                                """.formatted(dateTime.format(LocalDateTime.now()))))
                .andExpect(status().isBadRequest());

        String serviceBody = """
                {"date":"%s","odometer":11100,"category":"PREVENTIVE","title":"Cambio de aceite",
                 "laborCost":30.00,"performedBy":"WORKSHOP",
                 "parts":[{"partName":"Filtro de aceite","quantity":1,"unitPrice":20.00},
                          {"partName":"Aceite 5W30","brand":"Castrol","quantity":2,"unitPrice":15.00}],
                 "clientMutationId":"service-first"}
                """.formatted(LocalDate.now());

        MvcResult serviceResult = mockMvc.perform(post("/api/v1/vehicles/{vehicleId}/service-records", vehicleId)
                        .header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(serviceBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalCost").value(80.0))
                .andExpect(jsonPath("$.partsCost").value(50.0))
                .andExpect(jsonPath("$.parts.length()").value(2))
                .andReturn();
        long serviceId = ((Number) JsonPath.read(serviceResult.getResponse().getContentAsString(), "$.id")).longValue();

        mockMvc.perform(post("/api/v1/vehicles/{vehicleId}/service-records", vehicleId)
                        .header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(serviceBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(serviceId));

        mockMvc.perform(get("/api/v1/vehicles/{vehicleId}/dashboard", vehicleId)
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vehicle.currentOdometer").value(11100))
                .andExpect(jsonPath("$.kpis.avgConsumption").value(6.2))
                .andExpect(jsonPath("$.kpis.totalFuelSpent").value(110.5))
                .andExpect(jsonPath("$.kpis.totalServiceSpent").value(80.0))
                .andExpect(jsonPath("$.kpis.totalFuelLogs").value(2))
                .andExpect(jsonPath("$.kpis.totalServiceRecords").value(1))
                .andExpect(jsonPath("$.upcomingMaintenance.length()").value(4))
                .andExpect(jsonPath("$.recentActivity.length()").value(3));

        mockMvc.perform(get("/api/v1/vehicles/{vehicleId}/stats", vehicleId)
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totals.fillCount").value(2))
                .andExpect(jsonPath("$.totals.serviceCount").value(1))
                .andExpect(jsonPath("$.totals.totalSpent").value(190.5))
                .andExpect(jsonPath("$.monthly.length()").value(12))
                .andExpect(jsonPath("$.stations.length()").value(1))
                .andExpect(jsonPath("$.categories.length()").value(1));

        mockMvc.perform(get("/api/v1/vehicles/{vehicleId}/fuel-logs/stats", vehicleId)
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totals.fillCount").value(2))
                .andExpect(jsonPath("$.totals.totalSavings").value(3.1));

        MvcResult pdfResult = mockMvc.perform(get("/api/v1/vehicles/{vehicleId}/dossier.pdf", vehicleId)
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        org.hamcrest.Matchers.containsString("carhealth-dossier-TEST001.pdf")))
                .andReturn();
        byte[] pdf = pdfResult.getResponse().getContentAsByteArray();
        assertThat(pdf.length).isGreaterThan(1000);
        assertThat(new String(pdf, 0, 4)).isEqualTo("%PDF");

        mockMvc.perform(delete("/api/v1/vehicles/{vehicleId}", vehicleId)
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/vehicles")
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void keepsIdempotencyAndVehicleDataScopedToTheOwner() throws Exception {
        String emailA = "owner-" + UUID.randomUUID() + "@carhealth.test";
        String emailB = "outsider-" + UUID.randomUUID() + "@carhealth.test";

        String tokenA = registerAndVerify(emailA, "Dueña");
        String tokenB = registerAndVerify(emailB, "Intruso");

        long vehicleA = ((Number) JsonPath.read(mockMvc.perform(post("/api/v1/vehicles")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"brand":"Seat","model":"León","year":2021,"nickname":"Privado",
                                 "currentOdometer":10000,"fuelType":"GASOLINE_95"}
                                """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "$.id")).longValue();
        long vehicleB = ((Number) JsonPath.read(mockMvc.perform(post("/api/v1/vehicles")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"brand":"Toyota","model":"Corolla","year":2022,"nickname":"Ajeno",
                                 "currentOdometer":20000,"fuelType":"HYBRID"}
                                """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "$.id")).longValue();

        String fuelBody = """
                {"date":"%s","odometer":10100,"liters":40.0,"pricePerLiter":1.600,
                 "stationName":"Estación A","fullTank":true,"clientMutationId":"scope-check"}
                """.formatted(LocalDateTime.now().minusDays(1).withHour(18).withMinute(0).withSecond(0).withNano(0));

        long fuelId = ((Number) JsonPath.read(mockMvc.perform(post("/api/v1/vehicles/{vehicleId}/fuel-logs", vehicleA)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(fuelBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "$.id")).longValue();

        mockMvc.perform(get("/api/v1/vehicles/{vehicleId}/fuel-logs", vehicleA)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenB))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/vehicles/{vehicleId}/fuel-logs", vehicleB)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(fuelBody.replace("10100", "20100")))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/vehicles/{vehicleId}/fuel-logs", vehicleA)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(fuelBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(fuelId));
    }

    @Test
    void rejectsDuplicatedEmailAndInvalidLogin() throws Exception {
        String email = "duplicate-" + UUID.randomUUID() + "@carhealth.test";
        String body = """
                {"email":"%s","password":"password123","displayName":"Duplicada"}
                """.formatted(email);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"wrong-password"}
                                """.formatted(email)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requiresEmailVerificationAndRejectsInvalidOrExpiredCodes() throws Exception {
        String email = "verify-" + UUID.randomUUID() + "@carhealth.test";
        String registerBody = """
                {"email":"%s","password":"password123","displayName":"Verificación"}
                """.formatted(email);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.verificationRequired").value(true))
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.token").doesNotExist());

        String code = emailSender.codeFor(email);
        assertThat(code).matches("\\d{6}");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"password123"}
                                """.formatted(email)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.verificationRequired").value(true))
                .andExpect(jsonPath("$.email").value(email));

        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","code":"000000"}
                                """.formatted(email)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","code":"%s"}
                                """.formatted(email, code)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"password123"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());

        String expiredEmail = "expired-" + UUID.randomUUID() + "@carhealth.test";
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"password123","displayName":"Caducado"}
                                """.formatted(expiredEmail)))
                .andExpect(status().isCreated());
        String expiredCode = emailSender.codeFor(expiredEmail);

        User expiredUser = userRepository.findByEmailIgnoreCase(expiredEmail).orElseThrow();
        expiredUser.setEmailVerificationExpiresAt(Instant.now().minusSeconds(1));
        userRepository.save(expiredUser);

        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","code":"%s"}
                                """.formatted(expiredEmail, expiredCode)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resendsVerificationWithCooldownAndAllowsVerificationAfterIt() throws Exception {
        String email = "resend-" + UUID.randomUUID() + "@carhealth.test";
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"password123","displayName":"Reenvío"}
                                """.formatted(email)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s"}
                                """.formatted(email)))
                .andExpect(status().isTooManyRequests());

        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        user.setEmailVerificationSentAt(Instant.now().minusSeconds(61));
        userRepository.save(user);

        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verificationRequired").value(true));

        String code = emailSender.codeFor(email);
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","code":"%s"}
                                """.formatted(email, code)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    private String registerAndVerify(String email, String displayName) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"password123","displayName":"%s"}
                                """.formatted(email, displayName)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.verificationRequired").value(true));

        String code = emailSender.codeFor(email);
        assertThat(code).matches("\\d{6}");

        MvcResult verifyResult = mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","code":"%s"}
                                """.formatted(email, code)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value(email))
                .andReturn();
        return JsonPath.read(verifyResult.getResponse().getContentAsString(), "$.token");
    }

    @TestConfiguration
    static class MailTestConfig {

        @Bean
        @Primary
        RecordingVerificationEmailSender recordingVerificationEmailSender() {
            return new RecordingVerificationEmailSender();
        }
    }

    static class RecordingVerificationEmailSender implements VerificationEmailSender {

        private final Map<String, String> codes = new ConcurrentHashMap<>();

        @Override
        public void sendVerificationCode(
                String email,
                String displayName,
                String code,
                Instant expiresAt,
                Locale locale) {
            codes.put(email.toLowerCase(Locale.ROOT), code);
        }

        String codeFor(String email) {
            String code = codes.get(email.toLowerCase(Locale.ROOT));
            assertThat(code).as("verification code for " + email).isNotNull();
            return code;
        }
    }
}
