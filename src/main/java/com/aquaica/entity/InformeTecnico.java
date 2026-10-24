package com.aquaica.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "informes_tecnicos")
public class InformeTecnico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporte_id", nullable = false)
    private Reporte reporte;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asignacion_id", nullable = false)
    private Asignacion asignacion;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personal_id", nullable = false)
    private Personal personal;


    @Column(nullable = false, columnDefinition = "TEXT")
    private String diagnostico;


    @Column(
        name = "trabajo_realizado",
        nullable = false,
        columnDefinition = "TEXT"
    )
    private String trabajoRealizado;


    @Column(nullable = false, length = 30)
    private String resultado;


    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;


    public InformeTecnico() {
    }


    public Long getId() {
        return id;
    }


    public Reporte getReporte() {
        return reporte;
    }


    public void setReporte(Reporte reporte) {
        this.reporte = reporte;
    }


    public Asignacion getAsignacion() {
        return asignacion;
    }


    public void setAsignacion(Asignacion asignacion) {
        this.asignacion = asignacion;
    }


    public Personal getPersonal() {
        return personal;
    }


    public void setPersonal(Personal personal) {
        this.personal = personal;
    }


    public String getDiagnostico() {
        return diagnostico;
    }


    public void setDiagnostico(String diagnostico) {
        this.diagnostico = diagnostico;
    }


    public String getTrabajoRealizado() {
        return trabajoRealizado;
    }


    public void setTrabajoRealizado(String trabajoRealizado) {
        this.trabajoRealizado = trabajoRealizado;
    }


    public String getResultado() {
        return resultado;
    }


    public void setResultado(String resultado) {
        this.resultado = resultado;
    }


    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }


    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
}