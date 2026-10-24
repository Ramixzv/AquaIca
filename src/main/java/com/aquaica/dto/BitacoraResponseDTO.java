package com.aquaica.dto;

import java.time.LocalDateTime;

public class BitacoraResponseDTO {

    private Long id;
    private Long reporteId;
    private Long asignacionId;
    private Long personalId;
    private String personalNombre;
    private String descripcion;
    private LocalDateTime fechaCreacion;

    public BitacoraResponseDTO(
            Long id,
            Long reporteId,
            Long asignacionId,
            Long personalId,
            String personalNombre,
            String descripcion,
            LocalDateTime fechaCreacion) {

        this.id = id;
        this.reporteId = reporteId;
        this.asignacionId = asignacionId;
        this.personalId = personalId;
        this.personalNombre = personalNombre;
        this.descripcion = descripcion;
        this.fechaCreacion = fechaCreacion;
    }

    public Long getId() {
        return id;
    }

    public Long getReporteId() {
        return reporteId;
    }

    public Long getAsignacionId() {
        return asignacionId;
    }

    public Long getPersonalId() {
        return personalId;
    }

    public String getPersonalNombre() {
        return personalNombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
}