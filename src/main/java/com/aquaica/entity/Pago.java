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
import jakarta.persistence.Table;

/** Pago simulado de un recibo. No se cobra dinero real. */
@Entity
@Table(name = "pagos")
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String codigo;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recibo_id", nullable = false, unique = true)
    private Recibo recibo;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(nullable = false, length = 20)
    private String medio;

    @Column(name = "de_prueba", nullable = false)
    private boolean dePrueba;

    @Column(name = "fecha_pago", nullable = false)
    private LocalDateTime fechaPago;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pagado_por")
    private Usuario pagadoPor;

    public Pago() {
    }

    public Long getId() { return id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public Recibo getRecibo() { return recibo; }
    public void setRecibo(Recibo recibo) { this.recibo = recibo; }
    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }
    public String getMedio() { return medio; }
    public void setMedio(String medio) { this.medio = medio; }
    public boolean isDePrueba() { return dePrueba; }
    public void setDePrueba(boolean dePrueba) { this.dePrueba = dePrueba; }
    public LocalDateTime getFechaPago() { return fechaPago; }
    public void setFechaPago(LocalDateTime fechaPago) { this.fechaPago = fechaPago; }
    public Usuario getPagadoPor() { return pagadoPor; }
    public void setPagadoPor(Usuario pagadoPor) { this.pagadoPor = pagadoPor; }
}

