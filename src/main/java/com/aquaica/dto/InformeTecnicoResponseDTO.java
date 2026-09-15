package com.aquaica.dto;

import java.time.LocalDateTime;

public class InformeTecnicoResponseDTO {

    private Long id;
    private Long reporteId;
    private Long personalId;
    private String personalNombre;
    private String diagnostico;
    private String trabajoRealizado;
    private String resultado;
    private LocalDateTime fechaCreacion;

    public InformeTecnicoResponseDTO() {
    }

    public InformeTecnicoResponseDTO(
            Long id,
            Long reporteId,
            Long personalId,
            String personalNombre,
            String diagnostico,
            String trabajoRealizado,
            String resultado,
            LocalDateTime fechaCreacion) {

        this.id = id;
        this.reporteId = reporteId;
        this.personalId = personalId;
        this.personalNombre = personalNombre;
        this.diagnostico = diagnostico;
        this.trabajoRealizado = trabajoRealizado;
        this.resultado = resultado;
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

    public String getPersonalNombre() {
        return personalNombre;
    }

    public String getDiagnostico() {
        return diagnostico;
    }

    public String getTrabajoRealizado() {
        return trabajoRealizado;
    }

    public String getResultado() {
        return resultado;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
}