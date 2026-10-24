package com.aquaica.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.BitacoraResponseDTO;
import com.aquaica.service.BitacoraService;

@RestController
@RequestMapping("/api/bitacoras")
public class BitacoraController {

    private final BitacoraService bitacoraService;

    public BitacoraController(BitacoraService bitacoraService) {
        this.bitacoraService = bitacoraService;
    }

    @PostMapping
    public ResponseEntity<BitacoraResponseDTO> registrarBitacora(
            @RequestParam Long reporteId,
            @RequestParam Long asignacionId,
            @RequestParam Long personalId,
            @RequestParam String descripcion) {

        BitacoraResponseDTO bitacora =
                bitacoraService.registrarBitacora(
                        reporteId,
                        asignacionId,
                        personalId,
                        descripcion
                );

        return ResponseEntity.ok(bitacora);
    }

    @GetMapping("/reporte/{reporteId}")
    public ResponseEntity<List<BitacoraResponseDTO>> obtenerPorReporte(
            @PathVariable Long reporteId) {

        return ResponseEntity.ok(
                bitacoraService.obtenerPorReporte(reporteId)
        );
    }

    @GetMapping("/asignacion/{asignacionId}")
    public ResponseEntity<List<BitacoraResponseDTO>> obtenerPorAsignacion(
            @PathVariable Long asignacionId) {

        return ResponseEntity.ok(
                bitacoraService.obtenerPorAsignacion(asignacionId)
        );
    }

    @GetMapping("/publico/{reporteId}")
public ResponseEntity<List<BitacoraResponseDTO>> obtenerBitacorasPublico(
        @PathVariable Long reporteId,
        @RequestParam String codigo) {

    try {

        return ResponseEntity.ok(
                bitacoraService.obtenerBitacorasPublico(
                        reporteId,
                        codigo
                )
        );

    } catch (RuntimeException e) {

        return ResponseEntity.notFound().build();
    }
}
}