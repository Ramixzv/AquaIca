package com.aquaica.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * Lectura acumulada de un medidor (en m³).
 *
 * Cada fila guarda la lectura anterior, la actual, sus fechas y el consumo
 * del periodo (actual - anterior). El consumo lo calcula siempre el backend.
 *
 * origen: INICIAL (punto de partida del medidor, consumo 0),
 *         MANUAL (registrada por una persona) o SIMULADA (datos de prueba).
 */
@Entity
@Table(name = "lecturas")
public class Lectura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "medidor_id", nullable = false)
    private Medidor medidor;

    /** Primer día del mes de la lectura (2026-10-01 = octubre de 2026). */
    @Column(nullable = false)
    private LocalDate periodo;

    @Column(name = "lectura_anterior", nullable = false, precision = 12, scale = 3)
    private BigDecimal lecturaAnterior;

    @Column(name = "lectura_actual", nullable = false, precision = 12, scale = 3)
    private BigDecimal lecturaActual;

    @Column(name = "fecha_lectura_anterior", nullable = false)
    private LocalDate fechaLecturaAnterior;

    @Column(name = "fecha_lectura", nullable = false)
    private LocalDate fechaLectura;

    @Column(name = "consumo_m3", nullable = false, precision = 12, scale = 3)
    private BigDecimal consumoM3;

    @Column(nullable = false, length = 20)
    private String origen;

    @Column(length = 255)
    private String observacion;

    /** Quién la registró (null en lecturas simuladas). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registrado_por")
    private Usuario registradoPor;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @Column(nullable = false, length = 10)
    private String estado = "VALIDA";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anulada_por")
    private Usuario anuladaPor;

    @Column(name = "fecha_anulacion")
    private LocalDateTime fechaAnulacion;

    @Column(name = "motivo_anulacion", length = 255)
    private String motivoAnulacion;

    public Lectura() {
    }

    @PrePersist
    public void prePersist() {
        if (fechaRegistro == null) {
            fechaRegistro = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Medidor getMedidor() {
        return medidor;
    }

    public void setMedidor(Medidor medidor) {
        this.medidor = medidor;
    }

    public LocalDate getPeriodo() {
        return periodo;
    }

    public void setPeriodo(LocalDate periodo) {
        this.periodo = periodo;
    }

    public BigDecimal getLecturaAnterior() {
        return lecturaAnterior;
    }

    public void setLecturaAnterior(BigDecimal lecturaAnterior) {
        this.lecturaAnterior = lecturaAnterior;
    }

    public BigDecimal getLecturaActual() {
        return lecturaActual;
    }

    public void setLecturaActual(BigDecimal lecturaActual) {
        this.lecturaActual = lecturaActual;
    }

    public LocalDate getFechaLecturaAnterior() {
        return fechaLecturaAnterior;
    }

    public void setFechaLecturaAnterior(LocalDate fechaLecturaAnterior) {
        this.fechaLecturaAnterior = fechaLecturaAnterior;
    }

    public LocalDate getFechaLectura() {
        return fechaLectura;
    }

    public void setFechaLectura(LocalDate fechaLectura) {
        this.fechaLectura = fechaLectura;
    }

    public BigDecimal getConsumoM3() {
        return consumoM3;
    }

    public void setConsumoM3(BigDecimal consumoM3) {
        this.consumoM3 = consumoM3;
    }

    public String getOrigen() {
        return origen;
    }

    public void setOrigen(String origen) {
        this.origen = origen;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }

    public Usuario getRegistradoPor() {
        return registradoPor;
    }

    public void setRegistradoPor(Usuario registradoPor) {
        this.registradoPor = registradoPor;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(LocalDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public Usuario getAnuladaPor() { return anuladaPor; }
    public void setAnuladaPor(Usuario anuladaPor) { this.anuladaPor = anuladaPor; }
    public LocalDateTime getFechaAnulacion() { return fechaAnulacion; }
    public void setFechaAnulacion(LocalDateTime fechaAnulacion) { this.fechaAnulacion = fechaAnulacion; }
    public String getMotivoAnulacion() { return motivoAnulacion; }
    public void setMotivoAnulacion(String motivoAnulacion) { this.motivoAnulacion = motivoAnulacion; }
}
