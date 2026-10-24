package com.aquaica.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.TarifaDTO;
import com.aquaica.security.CustomUserDetails;
import com.aquaica.service.TarifaService;

/** Consultar: ADMIN y SOPORTE. Crear tarifas: solo ADMIN. (Reglas en SecurityConfig.) */
@RestController
@RequestMapping("/api/tarifas")
public class TarifaController {

    private final TarifaService tarifaService;

    public TarifaController(TarifaService tarifaService) {
        this.tarifaService = tarifaService;
    }

    @GetMapping
    public ResponseEntity<List<TarifaDTO>> listar() {
        return ResponseEntity.ok(tarifaService.listar());
    }

    @GetMapping("/vigentes")
    public ResponseEntity<List<TarifaDTO>> vigentes() {
        return ResponseEntity.ok(tarifaService.vigentes());
    }

    // Body: {"categoria": "DOMESTICO", "cargoFijo": 6.50, "precioM3": 2.2, "vigenteDesde": "2026-11-01"}
    @PostMapping
    public ResponseEntity<TarifaDTO> crear(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody SolicitudTarifa solicitud) {

        if (userDetails == null || userDetails.getUsuario() == null) {
            throw new AccessDeniedException("Se requiere una cuenta de personal.");
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(tarifaService.crear(
                solicitud.getCategoria(),
                solicitud.getCargoFijo(),
                solicitud.getPrecioM3(),
                solicitud.getVigenteDesde(),
                userDetails.getUsuario().getId()));
    }

    public static class SolicitudTarifa {
        private String categoria;
        private BigDecimal cargoFijo;
        private BigDecimal precioM3;
        private LocalDate vigenteDesde;

        public String getCategoria() { return categoria; }
        public void setCategoria(String categoria) { this.categoria = categoria; }
        public BigDecimal getCargoFijo() { return cargoFijo; }
        public void setCargoFijo(BigDecimal cargoFijo) { this.cargoFijo = cargoFijo; }
        public BigDecimal getPrecioM3() { return precioM3; }
        public void setPrecioM3(BigDecimal precioM3) { this.precioM3 = precioM3; }
        public LocalDate getVigenteDesde() { return vigenteDesde; }
        public void setVigenteDesde(LocalDate vigenteDesde) { this.vigenteDesde = vigenteDesde; }
    }
}
