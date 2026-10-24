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

    public ClienteResponseDTO(Long id, String dni, String nombreCompleto, String telefono, String email, String estado, LocalDateTime fechaRegistro) {
        this.id = id; this.dni = dni; this.nombreCompleto = nombreCompleto; this.telefono = telefono;
        this.email = email; this.estado = estado; this.fechaRegistro = fechaRegistro;
    }
    public Long getId() { return id; }
    public String getDni() { return dni; }
    public String getNombreCompleto() { return nombreCompleto; }
    public String getTelefono() { return telefono; }
    public String getEmail() { return email; }
    public String getEstado() { return estado; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
}
