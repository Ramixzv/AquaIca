package com.aquaica.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.SeguimientoResponseDTO;
import com.aquaica.service.SeguimientoService;

@RestController
@RequestMapping("/api/seguimientos")
public class SeguimientoGlobalController {

    private final SeguimientoService seguimientoService;

    public SeguimientoGlobalController(
            SeguimientoService seguimientoService) {

        this.seguimientoService = seguimientoService;
    }

    @GetMapping
    public ResponseEntity<List<SeguimientoResponseDTO>>
            obtenerTodosLosSeguimientos() {

        return ResponseEntity.ok(
                seguimientoService.obtenerTodosLosSeguimientos()
        );
    }
}