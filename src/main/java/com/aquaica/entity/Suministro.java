package com.aquaica.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "suministros")
public class Suministro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo_suministro", unique = true, nullable = false)
    private String codigoSuministro;

    @Column(name = "nombre_titular", nullable = false)
    private String nombreTitular;

    @Column(nullable = false, unique = true)
    private String dni;

    @Column(nullable = false)
    private String direccion;

    private Double latitud;

    private Double longitud;

    public Suministro() {
    }

    public Long getId() {
        return id;
    }

    public String getCodigoSuministro() {
        return codigoSuministro;
    }

    public void setCodigoSuministro(String codigoSuministro) {
        this.codigoSuministro = codigoSuministro;
    }

    public String getNombreTitular() {
        return nombreTitular;
    }

    public void setNombreTitular(String nombreTitular) {
        this.nombreTitular = nombreTitular;
    }

    public String getDni() {
        return dni;
    }

    public void setDni(String dni) {
        this.dni = dni;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public Double getLatitud() {
        return latitud;
    }

    public void setLatitud(Double latitud) {
        this.latitud = latitud;
    }

    public Double getLongitud() {
        return longitud;
    }

    public void setLongitud(Double longitud) {
        this.longitud = longitud;
    }
}