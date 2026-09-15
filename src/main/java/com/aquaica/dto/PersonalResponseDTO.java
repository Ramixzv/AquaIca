package com.aquaica.dto;

import java.time.LocalDateTime;

public class PersonalResponseDTO {

    private Long id;
    private String nombre;
    private String dni;
    private String telefono;
    private String especialidad;
    private String estado;
    private LocalDateTime fechaRegistro;

    public PersonalResponseDTO(
            Long id,
            String nombre,
            String dni,
            String telefono,
            String especialidad,
            String estado,
            LocalDateTime fechaRegistro) {

        this.id = id;
        this.nombre = nombre;
        this.dni = dni;
        this.telefono = telefono;
        this.especialidad = especialidad;
        this.estado = estado;
        this.fechaRegistro = fechaRegistro;
    }

    public Long getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public String getDni() {
        return dni;
    }

    public String getTelefono() {
        return telefono;
    }

    public String getEspecialidad() {
        return especialidad;
    }

    public String getEstado() {
        return estado;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }
}