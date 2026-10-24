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

/** Tarifa por categoría. No se edita: una tarifa nueva reemplaza a la anterior desde su fecha. */
@Entity
@Table(name = "tarifas")
public class Tarifa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String categoria;

    @Column(name = "cargo_fijo", nullable = false, precision = 10, scale = 2)
    private BigDecimal cargoFijo;

    @Column(name = "precio_m3", nullable = false, precision = 10, scale = 3)
    private BigDecimal precioM3;

    @Column(name = "vigente_desde", nullable = false)
    private LocalDate vigenteDesde;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creada_por")
    private Usuario creadaPor;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    void alCrear() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
    }

    public Tarifa() {
    }

    public Long getId() { return id; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public BigDecimal getCargoFijo() { return cargoFijo; }
    public void setCargoFijo(BigDecimal cargoFijo) { this.cargoFijo = cargoFijo; }
    public BigDecimal getPrecioM3() { return precioM3; }
    public void setPrecioM3(BigDecimal precioM3) { this.precioM3 = precioM3; }
    public LocalDate getVigenteDesde() { return vigenteDesde; }
    public void setVigenteDesde(LocalDate vigenteDesde) { this.vigenteDesde = vigenteDesde; }
    public Usuario getCreadaPor() { return creadaPor; }
    public void setCreadaPor(Usuario creadaPor) { this.creadaPor = creadaPor; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
}
