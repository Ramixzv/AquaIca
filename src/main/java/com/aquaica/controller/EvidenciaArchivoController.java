
package com.aquaica.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.EvidenciaResponseDTO;
import com.aquaica.entity.Evidencia;
import com.aquaica.service.EvidenciaService;

@RestController
@RequestMapping("/api/evidencias")
public class EvidenciaArchivoController {

    private final EvidenciaService evidenciaService;

    public EvidenciaArchivoController(
            EvidenciaService evidenciaService) {
        this.evidenciaService = evidenciaService;
    }

    @GetMapping
    public ResponseEntity<List<EvidenciaResponseDTO>>
            obtenerTodasLasEvidencias() {

        return ResponseEntity.ok(
                evidenciaService.obtenerTodasLasEvidencias()
        );
    }

    @GetMapping("/archivo/{reporteId}/{nombreArchivo:.+}")
    public ResponseEntity<Resource> obtenerArchivo(
            @PathVariable Long reporteId,
            @PathVariable String nombreArchivo) throws IOException {

        Evidencia evidencia =
                evidenciaService.obtenerEvidenciaArchivo(
                        reporteId,
                        nombreArchivo
                );

        Path ruta = Paths.get(
                evidencia.getRutaArchivo()
        ).toAbsolutePath().normalize();

        if (!Files.exists(ruta) || !Files.isRegularFile(ruta)) {
            return ResponseEntity.notFound().build();
        }

        Resource recurso = new UrlResource(ruta.toUri());

        String tipo = evidencia.getTipoArchivo();

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;

        if (tipo != null && !tipo.isBlank()) {
            try {
                mediaType = MediaType.parseMediaType(tipo);
            } catch (IllegalArgumentException ignored) {
                // Mantener tipo genérico
            }
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline()
                                .filename(evidencia.getNombreArchivo())
                                .build()
                                .toString()
                )
                .body(recurso);
    }
}
