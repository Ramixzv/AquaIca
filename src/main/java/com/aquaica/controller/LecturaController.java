package com.aquaica.controller;

import org.springframework.web.bind.annotation.PatchMapping;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.LecturaDTO;
import com.aquaica.dto.MedidorLecturaResumenDTO;
import com.aquaica.security.CustomUserDetails;
import com.aquaica.service.LecturaService;

/**
 * Lecturas de medidores.
 * Consultar y registrar: ADMIN, SOPORTE y TECNICO. Anular: ADMIN y SOPORTE.
 * El ciudadano no entra aquí: tendrá endpoints propios con solo sus datos.
 */
@RestController
@RequestMapping("/api/lecturas")
public class LecturaController {

    private final LecturaService lecturaService;

    public LecturaController(LecturaService lecturaService) {
        this.lecturaService = lecturaService;
    }

    // Medidores activos con su última lectura
    @GetMapping("/medidores")
    public ResponseEntity<List<MedidorLecturaResumenDTO>> medidores() {
        return ResponseEntity.ok(lecturaService.resumenMedidoresActivos());
    }

    // Historial de lecturas de un medidor
    @GetMapping("/medidor/{medidorId}")
    public ResponseEntity<List<LecturaDTO>> porMedidor(@PathVariable Long medidorId) {
        return ResponseEntity.ok(lecturaService.listarPorMedidor(medidorId));
    }

    // Última lectura de un medidor
    @GetMapping("/medidor/{medidorId}/ultima")
    public ResponseEntity<LecturaDTO> ultima(@PathVariable Long medidorId) {
        return ResponseEntity.ok(lecturaService.ultimaDelMedidor(medidorId));
    }

    // Lecturas de todos los medidores que ha tenido un suministro
    @GetMapping("/suministro/{suministroId}")
    public ResponseEntity<List<LecturaDTO>> porSuministro(@PathVariable Long suministroId) {
        return ResponseEntity.ok(lecturaService.listarPorSuministro(suministroId));
    }

    // Registrar la lectura actual: el backend calcula anterior y consumo
    @PostMapping
    public ResponseEntity<LecturaDTO> registrar(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody SolicitudLectura solicitud) {

        if (userDetails == null || userDetails.getUsuario() == null) {
            throw new AccessDeniedException("Se requiere una cuenta del personal.");
        }

        LecturaDTO creada = lecturaService.registrarManual(
                solicitud.getMedidorId(),
                solicitud.getLecturaActual(),
                solicitud.getFechaLectura(),
                solicitud.getObservacion(),
                userDetails.getUsuario().getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    // Anular la última lectura de un medidor (nunca la inicial). Body: {"motivo": "..."}
    @PatchMapping("/{id}/anular")
    public ResponseEntity<Void> anular(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody SolicitudAnulacion solicitud) {

        if (userDetails == null || userDetails.getUsuario() == null) {
            throw new AccessDeniedException("Se requiere una cuenta del personal.");
        }

        lecturaService.anular(id, solicitud.getMotivo(), userDetails.getUsuario().getId());
        return ResponseEntity.noContent().build();
    }

    // Solo ADMIN: genera lecturas SIMULADAS a continuación de la última del medidor
    @PostMapping("/medidor/{medidorId}/simular")
    public ResponseEntity<List<LecturaDTO>> simular(
            @PathVariable Long medidorId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody SolicitudSimulacion solicitud) {

        if (userDetails == null || userDetails.getUsuario() == null) {
            throw new AccessDeniedException("Se requiere una cuenta del personal.");
        }

        int meses = solicitud.getMeses() != null ? solicitud.getMeses() : 3;

        return ResponseEntity.ok(lecturaService.simularConsumo(
                medidorId, meses, userDetails.getUsuario().getId()));
    }

    // Solo ADMIN: borra las lecturas simuladas de un medidor
    @DeleteMapping("/medidor/{medidorId}/simuladas")
    public ResponseEntity<Map<String, Long>> borrarSimuladas(@PathVariable Long medidorId) {
        return ResponseEntity.ok(Map.of("eliminadas", lecturaService.borrarSimuladas(medidorId)));
    }

    // Solo ADMIN: borra todas las lecturas simuladas del sistema
    @DeleteMapping("/simuladas")
    public ResponseEntity<Map<String, Long>> borrarTodasLasSimuladas() {
        return ResponseEntity.ok(Map.of("eliminadas", lecturaService.borrarTodasLasSimuladas()));
    }

    public static class SolicitudAnulacion {
        private String motivo;

        public String getMotivo() { return motivo; }
        public void setMotivo(String motivo) { this.motivo = motivo; }
    }

    public static class SolicitudSimulacion {
        private Integer meses;

        public Integer getMeses() { return meses; }
        public void setMeses(Integer meses) { this.meses = meses; }
    }

    // Body: {"medidorId": 1, "lecturaActual": 125.5, "fechaLectura": "2026-10-21", "observacion": "..."}
    // Solo se envía la lectura ACTUAL: la anterior y el consumo los calcula el backend.
    public static class SolicitudLectura {

        private Long medidorId;
        private BigDecimal lecturaActual;
        private LocalDate fechaLectura;
        private String observacion;

        public Long getMedidorId() {
            return medidorId;
        }

        public void setMedidorId(Long medidorId) {
            this.medidorId = medidorId;
        }

        public BigDecimal getLecturaActual() {
            return lecturaActual;
        }

        public void setLecturaActual(BigDecimal lecturaActual) {
            this.lecturaActual = lecturaActual;
        }

        public LocalDate getFechaLectura() {
            return fechaLectura;
        }

        public void setFechaLectura(LocalDate fechaLectura) {
            this.fechaLectura = fechaLectura;
        }

        public String getObservacion() {
            return observacion;
        }

        public void setObservacion(String observacion) {
            this.observacion = observacion;
        }
    }
}