package com.aquaica.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.SeguimientoResponseDTO;
import com.aquaica.service.SeguimientoService;

@RestController
@RequestMapping("/api/reportes")
public class SeguimientoController {

    private final SeguimientoService seguimientoService;

    public SeguimientoController(
            SeguimientoService seguimientoService) {

        this.seguimientoService = seguimientoService;
    }

    @PostMapping("/{reporteId}/seguimientos")
    public ResponseEntity<SeguimientoResponseDTO> crearSeguimiento(
            @PathVariable Long reporteId,
            @RequestParam String estado,
            @RequestParam String comentario) {

        SeguimientoResponseDTO seguimiento =
                seguimientoService.crearSeguimiento(
                        reporteId,
                        estado,
                        comentario
                );

        return ResponseEntity.ok(seguimiento);
    }

    @GetMapping("/{reporteId}/seguimientos")
    public ResponseEntity<List<SeguimientoResponseDTO>> obtenerSeguimientos(
            @PathVariable Long reporteId) {

        return ResponseEntity.ok(
                seguimientoService.obtenerSeguimientosPorReporte(
                        reporteId
                )
        );
    }
}