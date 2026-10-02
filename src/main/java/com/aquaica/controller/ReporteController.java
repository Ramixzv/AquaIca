package com.aquaica.controller;

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

import com.aquaica.dto.ReporteResponseDTO;
import com.aquaica.entity.Reporte;
import com.aquaica.security.CustomUserDetails;
import com.aquaica.service.ReporteService;

@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

    private final ReporteService reporteService;

    public ReporteController(ReporteService reporteService) {
        this.reporteService = reporteService;
    }

    @PostMapping
    public ResponseEntity<Reporte> crearReporte(
            @RequestParam String codigoSuministro,
            @RequestParam String tipoProblema,
            @RequestParam String descripcion) {

        Reporte reporte = reporteService.crearReporte(
                codigoSuministro,
                tipoProblema,
                descripcion
        );

        return ResponseEntity.ok(reporte);
    }

    @GetMapping
    public ResponseEntity<List<ReporteResponseDTO>> obtenerTodosLosReportes() {

        return ResponseEntity.ok(
            reporteService.obtenerTodosLosReportes()
        );
    }

    @GetMapping("/{id}")
public ResponseEntity<ReporteResponseDTO> obtenerReportePorId(
        @PathVariable Long id) {

    return reporteService.obtenerReportePorId(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
}

@GetMapping("/suministro/{codigo}")
public ResponseEntity<List<ReporteResponseDTO>> obtenerReportesPorSuministro(
        @PathVariable String codigo) {

    return ResponseEntity.ok(
            reporteService.obtenerReportesPorCodigoSuministro(codigo)
    );
}

@GetMapping("/mis-reportes")
public ResponseEntity<List<ReporteResponseDTO>> obtenerMisReportes() {

    Authentication authentication =
            SecurityContextHolder
                    .getContext()
                    .getAuthentication();

    if (authentication == null ||
            !(authentication.getPrincipal()
                    instanceof CustomUserDetails)) {

        throw new RuntimeException(
                "No se pudo obtener el usuario autenticado"
        );
    }

    CustomUserDetails userDetails =
            (CustomUserDetails)
                    authentication.getPrincipal();

    if (userDetails.getUsuario().getPersonal() == null) {

        throw new RuntimeException(
                "El usuario no tiene personal asociado"
        );
    }

    String dni =
            userDetails.getUsuario()
                    .getPersonal()
                    .getDni();

    return ResponseEntity.ok(
            reporteService.obtenerMisReportes(dni)
    );
}

@GetMapping("/publico/{id}")
public ResponseEntity<ReporteResponseDTO> obtenerReportePublico(
        @PathVariable Long id,
        @RequestParam String codigo) {

    return reporteService.obtenerReportePublico(id, codigo)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
}


@PostMapping("/{id}/reabrir")
public ResponseEntity<Reporte> reabrirCaso(@PathVariable Long id) {

    Reporte reporte = reporteService.reabrirCaso(id);

    return ResponseEntity.ok(reporte);
}
}