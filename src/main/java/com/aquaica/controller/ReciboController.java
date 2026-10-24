package com.aquaica.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.ReciboDTO;
import com.aquaica.dto.ResumenGeneracionDTO;
import com.aquaica.security.CustomUserDetails;
import com.aquaica.service.ReciboService;

/** Generar y consultar: ADMIN y SOPORTE. Anular: solo ADMIN. (Reglas en SecurityConfig.) */
@RestController
@RequestMapping("/api/recibos")
public class ReciboController {

    private final ReciboService reciboService;

    public ReciboController(ReciboService reciboService) {
        this.reciboService = reciboService;
    }

    @GetMapping
    public ResponseEntity<List<ReciboDTO>> listar() {
        return ResponseEntity.ok(reciboService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReciboDTO> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(reciboService.obtener(id));
    }

    // Body: {"periodo": "2026-11"}
    @PostMapping("/generar")
    public ResponseEntity<ResumenGeneracionDTO> generar(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody SolicitudGeneracion solicitud) {

        return ResponseEntity.ok(reciboService.generarDelPeriodo(
                solicitud.getPeriodo(), usuarioIdDe(userDetails)));
    }

    @PostMapping("/lectura/{lecturaId}")
    public ResponseEntity<ReciboDTO> generarDeLectura(
            @PathVariable Long lecturaId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        return ResponseEntity.status(HttpStatus.CREATED).body(
                reciboService.generarDeLectura(lecturaId, usuarioIdDe(userDetails)));
    }

    // Body: {"motivo": "..."}
    @PatchMapping("/{id}/anular")
    public ResponseEntity<ReciboDTO> anular(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody SolicitudAnulacion solicitud) {

        return ResponseEntity.ok(reciboService.anular(
                id, solicitud.getMotivo(), usuarioIdDe(userDetails)));
    }

    private Long usuarioIdDe(CustomUserDetails userDetails) {

        if (userDetails == null || userDetails.getUsuario() == null) {
            throw new AccessDeniedException("Se requiere una cuenta de personal.");
        }

        return userDetails.getUsuario().getId();
    }

    public static class SolicitudGeneracion {
        private String periodo;

        public String getPeriodo() { return periodo; }
        public void setPeriodo(String periodo) { this.periodo = periodo; }
    }

    public static class SolicitudAnulacion {
        private String motivo;

        public String getMotivo() { return motivo; }
        public void setMotivo(String motivo) { this.motivo = motivo; }
    }
}
