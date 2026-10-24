
package com.aquaica.dto;

public class SuministroDTO {

    private Long id;
    private String codigoSuministro;
    private String direccion;
    private Double latitud;
    private Double longitud;
    private Long clienteId;
    private String nombreCliente;
    private String dniCliente;

    private String categoria;

    public SuministroDTO() {
    }

    public SuministroDTO(
            Long id,
            String codigoSuministro,
            String direccion,
            Double latitud,
            Double longitud,
            Long clienteId,
            String nombreCliente,
            String dniCliente) {

        this.id = id;
        this.codigoSuministro = codigoSuministro;
        this.direccion = direccion;
        this.latitud = latitud;
        this.longitud = longitud;
        this.clienteId = clienteId;
        this.nombreCliente = nombreCliente;
        this.dniCliente = dniCliente;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodigoSuministro() {
        return codigoSuministro;
    }

    public void setCodigoSuministro(String codigoSuministro) {
        this.codigoSuministro = codigoSuministro;
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

    public Long getClienteId() {
        return clienteId;
    }

    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }

    public String getNombreCliente() {
        return nombreCliente;
    }

    public void setNombreCliente(String nombreCliente) {
        this.nombreCliente = nombreCliente;
    }

    public String getDniCliente() {
        return dniCliente;
    }

    public void setDniCliente(String dniCliente) {
        this.dniCliente = dniCliente;
    }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
}
