package com.aquaica.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "ordenes_instalacion")
public class OrdenInstalacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String codigo;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitud_id", nullable = false, unique = true)
    private SolicitudServicio solicitud;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tecnico_id")
    private Personal tecnico;

    @Column(nullable = false, length = 30)
    private String estado = "PENDIENTE_ASIGNACION";

    @Column(name = "fecha_programada")
    private LocalDateTime fechaProgramada;

    @Column(name = "numero_serie_medidor", length = 50)
    private String numeroSerieMedidor;

    @Column(name = "lectura_inicial", precision = 12, scale = 2)
    private BigDecimal lecturaInicial;

    @Column(length = 1000)
    private String resultado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suministro_id")
    private Suministro suministro;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    @Column(name = "fecha_completada")
    private LocalDateTime fechaCompletada;

    @PrePersist
    void alCrear() {
        LocalDateTime ahora = LocalDateTime.now();
        this.fechaCreacion = ahora;
        this.fechaActualizacion = ahora;
    }

    @PreUpdate
    void alActualizar() {
        this.fechaActualizacion = LocalDateTime.now();
    }

    public OrdenInstalacion() {
    }

    public Long getId() { return id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public SolicitudServicio getSolicitud() { return solicitud; }
    public void setSolicitud(SolicitudServicio solicitud) { this.solicitud = solicitud; }
    public Personal getTecnico() { return tecnico; }
    public void setTecnico(Personal tecnico) { this.tecnico = tecnico; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public LocalDateTime getFechaProgramada() { return fechaProgramada; }
    public void setFechaProgramada(LocalDateTime fechaProgramada) { this.fechaProgramada = fechaProgramada; }
    public String getNumeroSerieMedidor() { return numeroSerieMedidor; }
    public void setNumeroSerieMedidor(String numeroSerieMedidor) { this.numeroSerieMedidor = numeroSerieMedidor; }
    public BigDecimal getLecturaInicial() { return lecturaInicial; }
    public void setLecturaInicial(BigDecimal lecturaInicial) { this.lecturaInicial = lecturaInicial; }
    public String getResultado() { return resultado; }
    public void setResultado(String resultado) { this.resultado = resultado; }
    public Suministro getSuministro() { return suministro; }
    public void setSuministro(Suministro suministro) { this.suministro = suministro; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public LocalDateTime getFechaCompletada() { return fechaCompletada; }
    public void setFechaCompletada(LocalDateTime fechaCompletada) { this.fechaCompletada = fechaCompletada; }
}
