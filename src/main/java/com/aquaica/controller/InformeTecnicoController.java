package com.aquaica.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.InformeTecnicoResponseDTO;
import com.aquaica.service.InformeTecnicoService;

@RestController
@RequestMapping("/api/reportes")
public class InformeTecnicoController {

    private final InformeTecnicoService informeTecnicoService;

    public InformeTecnicoController(
            InformeTecnicoService informeTecnicoService) {

        this.informeTecnicoService = informeTecnicoService;
    }

    @PostMapping("/{reporteId}/informe-tecnico")
    public ResponseEntity<InformeTecnicoResponseDTO> registrarInforme(
            @PathVariable Long reporteId,
            @RequestParam String diagnostico,
            @RequestParam String trabajoRealizado,
            @RequestParam String resultado) {

        InformeTecnicoResponseDTO informe =
                informeTecnicoService.registrarInforme(
                        reporteId,
                        diagnostico,
                        trabajoRealizado,
                        resultado
                );

        return ResponseEntity.ok(informe);
    }


    @GetMapping("/{reporteId}/informe-tecnico")
    public ResponseEntity<InformeTecnicoResponseDTO> obtenerInforme(
            @PathVariable Long reporteId) {

        return ResponseEntity.ok(
                informeTecnicoService
                        .obtenerInformePorReporte(reporteId)
        );
    }
}