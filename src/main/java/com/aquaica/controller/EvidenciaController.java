package com.aquaica.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.aquaica.dto.EvidenciaResponseDTO;
import com.aquaica.entity.Evidencia;
import com.aquaica.security.CustomUserDetails;
import com.aquaica.service.EvidenciaService;

@RestController
@RequestMapping("/api/reportes")
public class EvidenciaController {

    private final EvidenciaService evidenciaService;

    public EvidenciaController(EvidenciaService evidenciaService) {
        this.evidenciaService = evidenciaService;
    }

    @PostMapping("/{reporteId}/evidencias")
    public ResponseEntity<Evidencia> subirEvidencia(
            @PathVariable Long reporteId,
            @RequestParam("archivo") MultipartFile archivo) throws IOException {

        Evidencia evidencia = evidenciaService.guardarEvidencia(
                reporteId,
                archivo
        );

        return ResponseEntity.ok(evidencia);
    }

    @PostMapping("/{reporteId}/evidencias/tecnico")
public ResponseEntity<Evidencia> subirEvidenciaTecnico(
        @PathVariable Long reporteId,
        @RequestParam("archivo") MultipartFile archivo) throws IOException {

    Authentication authentication =
            SecurityContextHolder
                    .getContext()
                    .getAuthentication();

    if (authentication == null ||
            !(authentication.getPrincipal()
                    instanceof CustomUserDetails)) {

        return ResponseEntity.status(401).build();
    }

    CustomUserDetails userDetails =
            (CustomUserDetails)
                    authentication.getPrincipal();

    if (userDetails.getUsuario().getPersonal() == null) {

        return ResponseEntity.status(403).build();
    }

    Long personalId =
            userDetails.getUsuario()
                    .getPersonal()
                    .getId();

    Evidencia evidencia =
            evidenciaService.guardarEvidenciaTecnico(
                    reporteId,
                    archivo,
                    personalId
            );

    return ResponseEntity.ok(evidencia);
}



    @GetMapping("/{reporteId}/evidencias")
    public ResponseEntity<List<EvidenciaResponseDTO>> obtenerEvidencias(
        @PathVariable Long reporteId) {

        return ResponseEntity.ok(evidenciaService.obtenerEvidenciasPorReporte(reporteId)
    );
    }

}