
package com.aquaica.dto;

import java.time.LocalDateTime;

public class ClienteResponseDTO {

    private Long id;
    private String dni;
    private String nombreCompleto;
    private String telefono;
    private String email;
    private String estado;
    private LocalDateTime fechaRegistro;
    private boolean titularVerificado;
    private boolean tieneUsuario;

    public ClienteResponseDTO(
        Long id,
        String dni,
        String nombreCompleto,
        String telefono,
        String email,
        String estado,
        LocalDateTime fechaRegistro,
        boolean titularVerificado,
        boolean tieneUsuario) {

    this.id = id;
    this.dni = dni;
    this.nombreCompleto = nombreCompleto;
    this.telefono = telefono;
    this.email = email;
    this.estado = estado;
    this.fechaRegistro = fechaRegistro;
    this.titularVerificado = titularVerificado;
    this.tieneUsuario = tieneUsuario;
}

    public Long getId() {
        return id;
    }

    public String getDni() {
        return dni;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public String getTelefono() {
        return telefono;
    }

    public String getEmail() {
        return email;
    }

    public String getEstado() {
        return estado;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public boolean isTitularVerificado() {
        return titularVerificado;
    }

    public boolean isTieneUsuario() {
    return tieneUsuario;
    }
}
