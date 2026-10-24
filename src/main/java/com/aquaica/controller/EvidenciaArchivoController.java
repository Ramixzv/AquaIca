package com.aquaica.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.EvidenciaResponseDTO;
import com.aquaica.service.EvidenciaService;

@RestController
@RequestMapping("/api/evidencias")
public class EvidenciaArchivoController {

    private final String carpetaBase = "uploads/reportes/";

    private final EvidenciaService evidenciaService;


    public EvidenciaArchivoController(
            EvidenciaService evidenciaService) {

        this.evidenciaService = evidenciaService;
    }


    @GetMapping
    public ResponseEntity<List<EvidenciaResponseDTO>> obtenerTodasLasEvidencias() {

        return ResponseEntity.ok(
                evidenciaService.obtenerTodasLasEvidencias()
        );
    }


    @GetMapping("/archivo/{reporteId}/{nombreArchivo}")
    public ResponseEntity<Resource> obtenerArchivo(
            @PathVariable Long reporteId,
            @PathVariable String nombreArchivo) {

        try {

            Path rutaArchivo = Paths.get(
                    carpetaBase
            )
            .resolve(String.valueOf(reporteId))
            .resolve(nombreArchivo)
            .normalize();


            Resource recurso =
                    new UrlResource(
                            rutaArchivo.toUri()
                    );


            if (!recurso.exists() ||
                    !recurso.isReadable()) {

                return ResponseEntity
                        .notFound()
                        .build();
            }


            String tipoContenido =
                    Files.probeContentType(
                            rutaArchivo
                    );


            if (tipoContenido == null) {

                tipoContenido =
                        MediaType
                                .APPLICATION_OCTET_STREAM_VALUE;
            }


            return ResponseEntity.ok()
                    .contentType(
                            MediaType.parseMediaType(
                                    tipoContenido
                            )
                    )
                    .body(recurso);


        } catch (IOException e) {

            return ResponseEntity
                    .internalServerError()
                    .build();
        }
    }
}