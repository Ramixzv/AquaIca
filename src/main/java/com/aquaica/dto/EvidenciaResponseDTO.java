package com.aquaica.dto;

import java.time.LocalDateTime;

public class EvidenciaResponseDTO {

    private Long id;
    private Long reporteId;
    private String nombreArchivo;
    private String rutaArchivo;
    private String tipoArchivo;
    private LocalDateTime fechaCreacion;
    private String origen;

    public EvidenciaResponseDTO(
            Long id,
            Long reporteId,
            String nombreArchivo,
            String rutaArchivo,
            String tipoArchivo,
            LocalDateTime fechaCreacion,
            String origen) {

        this.id = id;
        this.reporteId = reporteId;
        this.nombreArchivo = nombreArchivo;
        this.rutaArchivo = rutaArchivo;
        this.tipoArchivo = tipoArchivo;
        this.fechaCreacion = fechaCreacion;
        this.origen = origen;
    }

    public Long getId() {
        return id;
    }

    public Long getReporteId() {
        return reporteId;
    }

    public String getNombreArchivo() {
        return nombreArchivo;
    }

    public String getRutaArchivo() {
        return rutaArchivo;
    }

    public String getTipoArchivo() {
        return tipoArchivo;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public String getOrigen() {
        return origen;
    }
}