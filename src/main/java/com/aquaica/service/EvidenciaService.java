package com.aquaica.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.aquaica.dto.EvidenciaResponseDTO;
import com.aquaica.entity.Evidencia;
import com.aquaica.entity.Reporte;
import com.aquaica.repository.AsignacionRepository;
import com.aquaica.repository.EvidenciaRepository;
import com.aquaica.repository.ReporteRepository;

@Service
public class EvidenciaService {

    private final EvidenciaRepository evidenciaRepository;
    private final ReporteRepository reporteRepository;
    private final AsignacionRepository asignacionRepository;

    private final String carpetaBase = "uploads/reportes/";

    public EvidenciaService(
            EvidenciaRepository evidenciaRepository,
            ReporteRepository reporteRepository,
            AsignacionRepository asignacionRepository) {

        this.evidenciaRepository = evidenciaRepository;
        this.reporteRepository = reporteRepository;
        this.asignacionRepository = asignacionRepository;
    }

    public Evidencia guardarEvidencia(
            Long reporteId,
            MultipartFile archivo) throws IOException {

        Reporte reporte = reporteRepository.findById(reporteId)
                .orElseThrow(() ->
                        new RuntimeException("Reporte no encontrado"));

        Path carpetaReporte = Paths.get(
                carpetaBase + reporteId
        );

        Files.createDirectories(carpetaReporte);

        String nombreArchivo = archivo.getOriginalFilename();

        if (nombreArchivo == null || nombreArchivo.isBlank()) {
            throw new RuntimeException("El archivo no tiene nombre");
        }

        Path rutaArchivo =
                carpetaReporte.resolve(nombreArchivo);

        Files.write(
                rutaArchivo,
                archivo.getBytes()
        );

        Evidencia evidencia = new Evidencia();

        evidencia.setReporte(reporte);
        evidencia.setNombreArchivo(nombreArchivo);
        evidencia.setRutaArchivo(rutaArchivo.toString());
        evidencia.setTipoArchivo(archivo.getContentType());
        evidencia.setOrigen("CIUDADANO");
        evidencia.setFechaCreacion(LocalDateTime.now());

        return evidenciaRepository.save(evidencia);
    }

    public Evidencia guardarEvidenciaTecnico(
        Long reporteId,
        MultipartFile archivo,
        Long personalId) throws IOException {


    Reporte reporte = reporteRepository.findById(reporteId)
            .orElseThrow(() ->
                    new RuntimeException("Reporte no encontrado"));


    boolean asignado =
            asignacionRepository
                    .existsByReporteIdAndPersonalId(
                            reporteId,
                            personalId
                    );

    if (!asignado) {

        throw new RuntimeException(
                "El técnico no está asignado a este reporte"
        );
    }


    String nombreArchivo =
            archivo.getOriginalFilename();

    if (nombreArchivo == null ||
            nombreArchivo.isBlank()) {

        throw new RuntimeException(
                "El archivo no tiene nombre"
        );
    }


    Path carpetaReporte =
            Paths.get(carpetaBase + reporteId);

    Files.createDirectories(
            carpetaReporte
    );

    String nombreFinal =
            "tecnico_" +
            System.currentTimeMillis() +
            "_" +
            nombreArchivo;


    Path rutaArchivo =
            carpetaReporte.resolve(nombreFinal);


    Files.write(
            rutaArchivo,
            archivo.getBytes()
    );


    Evidencia evidencia =
            new Evidencia();

    evidencia.setReporte(reporte);

    evidencia.setNombreArchivo(
            nombreFinal
    );

    evidencia.setRutaArchivo(
            rutaArchivo.toString()
    );

    evidencia.setTipoArchivo(
            archivo.getContentType()
    );

    evidencia.setOrigen(
            "TECNICO"
    );

    evidencia.setFechaCreacion(
            LocalDateTime.now()
    );

    return evidenciaRepository.save(
            evidencia
    );
}


    public List<EvidenciaResponseDTO> obtenerEvidenciasPorReporte(
            Long reporteId) {

        return evidenciaRepository
                .obtenerEvidenciasPorReporte(reporteId);
    }

    public List<EvidenciaResponseDTO> obtenerTodasLasEvidencias() {

    return evidenciaRepository
            .obtenerTodasLasEvidencias();
}
}