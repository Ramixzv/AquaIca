package com.aquaica.dto;

import java.time.LocalDateTime;

public class AsignacionResponseDTO {

    private Long id;

    private Long reporteId;

    private Long personalId;

    private String nombrePersonal;

    private String dniPersonal;

    private String especialidad;

    private LocalDateTime fechaAsignacion;

    private String observaciones;

    private String estado;

    public AsignacionResponseDTO(
            Long id,
            Long reporteId,
            Long personalId,
            String nombrePersonal,
            String dniPersonal,
            String especialidad,
            LocalDateTime fechaAsignacion,
            String observaciones,
            String estado) {

        this.id = id;
        this.reporteId = reporteId;
        this.personalId = personalId;
        this.nombrePersonal = nombrePersonal;
        this.dniPersonal = dniPersonal;
        this.especialidad = especialidad;
        this.fechaAsignacion = fechaAsignacion;
        this.observaciones = observaciones;
        this.estado = estado;
    }

    public Long getId() {
        return id;
    }

    public Long getReporteId() {
        return reporteId;
    }

    public Long getPersonalId() {
        return personalId;
    }

    public String getNombrePersonal() {
        return nombrePersonal;
    }

    public String getDniPersonal() {
        return dniPersonal;
    }

    public String getEspecialidad() {
        return especialidad;
    }

    public LocalDateTime getFechaAsignacion() {
        return fechaAsignacion;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public String getEstado() {
        return estado;
    }
}