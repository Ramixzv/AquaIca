package com.aquaica.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.ComprobanteDTO;
import com.aquaica.dto.OrdenInstalacionDTO;
import com.aquaica.security.CustomUserDetails;
import com.aquaica.service.OrdenInstalacionService;

@RestController
@RequestMapping("/api/ordenes-instalacion")
public class OrdenInstalacionController {

    private final OrdenInstalacionService ordenService;

    public OrdenInstalacionController(OrdenInstalacionService ordenService) {
        this.ordenService = ordenService;
    }

    // ADMIN / SOPORTE: todas las órdenes
    @GetMapping
    public ResponseEntity<List<OrdenInstalacionDTO>> listarTodas() {
        return ResponseEntity.ok(ordenService.listarTodas());
    }

    // ADMIN / SOPORTE: orden de una solicitud
    @GetMapping("/solicitud/{solicitudId}")
    public ResponseEntity<OrdenInstalacionDTO> porSolicitud(
            @PathVariable Long solicitudId) {
        return ResponseEntity.ok(ordenService.obtenerPorSolicitud(solicitudId));
    }

    // ADMIN / SOPORTE: asignar técnico y (opcionalmente) fecha de visita
    @PatchMapping("/{id}/asignar")
    public ResponseEntity<OrdenInstalacionDTO> asignar(
            @PathVariable Long id,
            @RequestBody AsignacionRequest solicitud) {
        return ResponseEntity.ok(ordenService.asignar(
                id, solicitud.getTecnicoId(), solicitud.getFechaProgramada()));
    }

    // TECNICO: sus órdenes asignadas
    @GetMapping("/mis-ordenes")
    public ResponseEntity<List<OrdenInstalacionDTO>> misOrdenes(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(
                ordenService.listarDelTecnico(personalIdDe(userDetails)));
    }

    // TECNICO: registrar medidor y completar la instalación
    @PatchMapping("/{id}/completar")
    public ResponseEntity<OrdenInstalacionDTO> completar(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody CompletarRequest solicitud) {
        return ResponseEntity.ok(ordenService.completar(
                id,
                personalIdDe(userDetails),
                solicitud.getNumeroSerie(),
                solicitud.getLecturaInicial(),
                solicitud.getResultado()));
    }

    // CIUDADANO: comprobante de su propia solicitud
    @GetMapping("/comprobante/{solicitudId}")
    public ResponseEntity<ComprobanteDTO> comprobante(
            @PathVariable Long solicitudId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (userDetails == null
                || userDetails.getUsuario().getCliente() == null
                || !"CIUDADANO".equals(userDetails.getUsuario().getRol())) {
            throw new AccessDeniedException(
                    "Se requiere una cuenta ciudadana asociada a un cliente.");
        }

        return ResponseEntity.ok(ordenService.obtenerComprobante(
                solicitudId, userDetails.getUsuario().getCliente().getId()));
    }

    private Long personalIdDe(CustomUserDetails userDetails) {

        if (userDetails == null
                || userDetails.getUsuario().getPersonal() == null) {
            throw new AccessDeniedException("Se requiere una cuenta de personal.");
        }

        return userDetails.getUsuario().getPersonal().getId();
    }

    public static class AsignacionRequest {
        private Long tecnicoId;
        private LocalDateTime fechaProgramada;

        public Long getTecnicoId() { return tecnicoId; }
        public void setTecnicoId(Long tecnicoId) { this.tecnicoId = tecnicoId; }
        public LocalDateTime getFechaProgramada() { return fechaProgramada; }
        public void setFechaProgramada(LocalDateTime fechaProgramada) { this.fechaProgramada = fechaProgramada; }
    }

    public static class CompletarRequest {
        private String numeroSerie;
        private BigDecimal lecturaInicial;
        private String resultado;

        public String getNumeroSerie() { return numeroSerie; }
        public void setNumeroSerie(String numeroSerie) { this.numeroSerie = numeroSerie; }
        public BigDecimal getLecturaInicial() { return lecturaInicial; }
        public void setLecturaInicial(BigDecimal lecturaInicial) { this.lecturaInicial = lecturaInicial; }
        public String getResultado() { return resultado; }
        public void setResultado(String resultado) { this.resultado = resultado; }
    }
}
