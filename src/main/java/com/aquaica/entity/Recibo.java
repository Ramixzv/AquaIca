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


@Entity
@Table(name = "recibos")
public class Recibo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String codigo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suministro_id", nullable = false)
    private Suministro suministro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lectura_id", nullable = false)
    private Lectura lectura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tarifa_id", nullable = false)
    private Tarifa tarifa;

    @Column(nullable = false)
    private LocalDate periodo;

    @Column(name = "consumo_m3", nullable = false, precision = 12, scale = 3)
    private BigDecimal consumoM3;

    @Column(nullable = false, length = 20)
    private String categoria;

    @Column(name = "cargo_fijo", nullable = false, precision = 10, scale = 2)
    private BigDecimal cargoFijo;

    @Column(name = "precio_m3", nullable = false, precision = 10, scale = 3)
    private BigDecimal precioM3;

    @Column(name = "importe_consumo", nullable = false, precision = 12, scale = 2)
    private BigDecimal importeConsumo;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "de_prueba", nullable = false)
    private boolean dePrueba;

    @Column(nullable = false, length = 10)
    private String estado = "PENDIENTE";

    @Column(name = "fecha_emision", nullable = false)
    private LocalDate fechaEmision;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generado_por")
    private Usuario generadoPor;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anulado_por")
    private Usuario anuladoPor;

    @Column(name = "fecha_anulacion")
    private LocalDateTime fechaAnulacion;

    @Column(name = "motivo_anulacion", length = 255)
    private String motivoAnulacion;

    @PrePersist
    void alCrear() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
    }

    public Recibo() {
    }

    public Long getId() { return id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public Suministro getSuministro() { return suministro; }
    public void setSuministro(Suministro suministro) { this.suministro = suministro; }
    public Lectura getLectura() { return lectura; }
    public void setLectura(Lectura lectura) { this.lectura = lectura; }
    public Tarifa getTarifa() { return tarifa; }
    public void setTarifa(Tarifa tarifa) { this.tarifa = tarifa; }
    public LocalDate getPeriodo() { return periodo; }
    public void setPeriodo(LocalDate periodo) { this.periodo = periodo; }
    public BigDecimal getConsumoM3() { return consumoM3; }
    public void setConsumoM3(BigDecimal consumoM3) { this.consumoM3 = consumoM3; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public BigDecimal getCargoFijo() { return cargoFijo; }
    public void setCargoFijo(BigDecimal cargoFijo) { this.cargoFijo = cargoFijo; }
    public BigDecimal getPrecioM3() { return precioM3; }
    public void setPrecioM3(BigDecimal precioM3) { this.precioM3 = precioM3; }
    public BigDecimal getImporteConsumo() { return importeConsumo; }
    public void setImporteConsumo(BigDecimal importeConsumo) { this.importeConsumo = importeConsumo; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public boolean isDePrueba() { return dePrueba; }
    public void setDePrueba(boolean dePrueba) { this.dePrueba = dePrueba; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public LocalDate getFechaEmision() { return fechaEmision; }
    public void setFechaEmision(LocalDate fechaEmision) { this.fechaEmision = fechaEmision; }
    public LocalDate getFechaVencimiento() { return fechaVencimiento; }
    public void setFechaVencimiento(LocalDate fechaVencimiento) { this.fechaVencimiento = fechaVencimiento; }
    public Usuario getGeneradoPor() { return generadoPor; }
    public void setGeneradoPor(Usuario generadoPor) { this.generadoPor = generadoPor; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public Usuario getAnuladoPor() { return anuladoPor; }
    public void setAnuladoPor(Usuario anuladoPor) { this.anuladoPor = anuladoPor; }
    public LocalDateTime getFechaAnulacion() { return fechaAnulacion; }
    public void setFechaAnulacion(LocalDateTime fechaAnulacion) { this.fechaAnulacion = fechaAnulacion; }
    public String getMotivoAnulacion() { return motivoAnulacion; }
    public void setMotivoAnulacion(String motivoAnulacion) { this.motivoAnulacion = motivoAnulacion; }
}
