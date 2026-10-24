
package com.aquaica.dto;

import java.time.LocalDateTime;

import com.aquaica.entity.SolicitudServicio;

public class SolicitudServicioDTO {

    private Long id;
    private Long clienteId;
    private String direccion;
    private String referencia;
    private Double latitud;
    private Double longitud;
    private String descripcion;
    private String estado;
    private String observaciones;
    private LocalDateTime fechaSolicitud;
    private LocalDateTime fechaActualizacion;

    public SolicitudServicioDTO(SolicitudServicio solicitud) {
        this.id = solicitud.getId();
        this.clienteId = solicitud.getCliente().getId();
        this.direccion = solicitud.getDireccion();
        this.referencia = solicitud.getReferencia();
        this.latitud = solicitud.getLatitud();
        this.longitud = solicitud.getLongitud();
        this.descripcion = solicitud.getDescripcion();
        this.estado = solicitud.getEstado();
        this.observaciones = solicitud.getObservaciones();
        this.fechaSolicitud = solicitud.getFechaSolicitud();
        this.fechaActualizacion = solicitud.getFechaActualizacion();
    }

    public Long getId() {
        return id;
    }

    public Long getClienteId() {
        return clienteId;
    }

    public String getDireccion() {
        return direccion;
    }

    public String getReferencia() {
        return referencia;
    }

    public Double getLatitud() {
        return latitud;
    }

    public Double getLongitud() {
        return longitud;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public String getEstado() {
        return estado;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public LocalDateTime getFechaSolicitud() {
        return fechaSolicitud;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }
}
