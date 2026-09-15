package com.aquaica.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.AsignacionResponseDTO;
import com.aquaica.entity.Asignacion;
import com.aquaica.service.AsignacionService;

@RestController
@RequestMapping("/api")
public class AsignacionController {

    private final AsignacionService asignacionService;

    public AsignacionController(
            AsignacionService asignacionService) {

        this.asignacionService = asignacionService;
    }


    @PostMapping("/reportes/{reporteId}/asignaciones")
    public ResponseEntity<Asignacion> crearAsignacion(
            @PathVariable Long reporteId,
            @RequestParam Long personalId,
            @RequestParam(required = false) String observaciones) {

        Asignacion asignacion =
                asignacionService.crearAsignacion(
                        reporteId,
                        personalId,
                        observaciones
                );

        return ResponseEntity.ok(asignacion);
    }


    @PostMapping("/asignaciones/{asignacionId}/iniciar")
    public ResponseEntity<Asignacion> iniciarAtencion(
            @PathVariable Long asignacionId) {

        Asignacion asignacion =
                asignacionService.iniciarAtencion(
                        asignacionId
                );

        return ResponseEntity.ok(asignacion);
    }


    @GetMapping("/reportes/{reporteId}/asignaciones")
    public ResponseEntity<List<AsignacionResponseDTO>>
            obtenerAsignacionesPorReporte(
                    @PathVariable Long reporteId) {

        return ResponseEntity.ok(
                asignacionService
                        .obtenerAsignacionesPorReporte(reporteId)
        );
    }

    @GetMapping("/personal/{personalId}/asignaciones")
    public ResponseEntity<List<AsignacionResponseDTO>>
            obtenerAsignacionesPorPersonal(
                    @PathVariable Long personalId) {

        return ResponseEntity.ok(
                asignacionService
                        .obtenerAsignacionesPorPersonal(personalId)
        );
    }
}