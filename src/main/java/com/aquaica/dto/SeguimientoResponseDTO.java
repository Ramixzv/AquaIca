package com.aquaica.dto;

import java.time.LocalDateTime;

public class SeguimientoResponseDTO {

    private Long id;
    private Long reporteId;

    private Long personalId;
    private String nombrePersonal;

    private String estado;
    private String comentario;
    private LocalDateTime fechaCreacion;

    public SeguimientoResponseDTO(
            Long id,
            Long reporteId,
            Long personalId,
            String nombrePersonal,
            String estado,
            String comentario,
            LocalDateTime fechaCreacion) {

        this.id = id;
        this.reporteId = reporteId;
        this.personalId = personalId;
        this.nombrePersonal = nombrePersonal;
        this.estado = estado;
        this.comentario = comentario;
        this.fechaCreacion = fechaCreacion;
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

    public String getEstado() {
        return estado;
    }

    public String getComentario() {
        return comentario;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
}