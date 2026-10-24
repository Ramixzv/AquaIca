package com.aquaica.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.MedidorDTO;
import com.aquaica.service.MedidorService;

/**
 * Lectura: ADMIN, SOPORTE y TECNICO. Registro y cambio de estado: ADMIN y SOPORTE.
 * (Las reglas están en SecurityConfig.)
 */
@RestController
@RequestMapping("/api/medidores")
public class MedidorController {

    private final MedidorService medidorService;

    public MedidorController(MedidorService medidorService) {
        this.medidorService = medidorService;
    }

    @GetMapping
    public ResponseEntity<List<MedidorDTO>> listar() {
        return ResponseEntity.ok(medidorService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedidorDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(medidorService.buscarPorId(id));
    }

    // Medidor ACTIVO del suministro
    @GetMapping("/suministro/{suministroId}")
    public ResponseEntity<MedidorDTO> buscarActivoPorSuministro(
            @PathVariable Long suministroId) {
        return ResponseEntity.ok(medidorService.buscarActivoPorSuministro(suministroId));
    }

    // Todos los medidores que ha tenido el suministro
    @GetMapping("/suministro/{suministroId}/historial")
    public ResponseEntity<List<MedidorDTO>> historial(@PathVariable Long suministroId) {
        return ResponseEntity.ok(medidorService.historialPorSuministro(suministroId));
    }

    @PostMapping
    public ResponseEntity<MedidorDTO> registrar(@RequestBody SolicitudMedidor solicitud) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                medidorService.registrarManual(
                        solicitud.getNumeroSerie(),
                        solicitud.getSuministroId(),
                        solicitud.getFechaInstalacion()));
    }

    // Body: {"estado": "INACTIVO", "motivo": "Medidor dañado"}  (el motivo es obligatorio al desactivar)
    @PatchMapping("/{id}/estado")
    public ResponseEntity<MedidorDTO> cambiarEstado(
            @PathVariable Long id,
            @RequestBody Map<String, String> solicitud) {
        return ResponseEntity.ok(medidorService.cambiarEstado(
                id, solicitud.get("estado"), solicitud.get("motivo")));
    }

    public static class SolicitudMedidor {
        private String numeroSerie;
        private Long suministroId;
        private LocalDate fechaInstalacion;

        public String getNumeroSerie() { return numeroSerie; }
        public void setNumeroSerie(String numeroSerie) { this.numeroSerie = numeroSerie; }
        public Long getSuministroId() { return suministroId; }
        public void setSuministroId(Long suministroId) { this.suministroId = suministroId; }
        public LocalDate getFechaInstalacion() { return fechaInstalacion; }
        public void setFechaInstalacion(LocalDate fechaInstalacion) { this.fechaInstalacion = fechaInstalacion; }
    }
}
