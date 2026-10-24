package com.aquaica.dto;

public class TecnicoDisponibleDTO {

    private Long id;
    private String nombre;
    private String especialidad;
    private String especialidadEtiqueta;
    private boolean disponible;

    public TecnicoDisponibleDTO(
            Long id,
            String nombre,
            String especialidad,
            String especialidadEtiqueta,
            boolean disponible) {

        this.id = id;
        this.nombre = nombre;
        this.especialidad = especialidad;
        this.especialidadEtiqueta = especialidadEtiqueta;
        this.disponible = disponible;
    }

    public Long getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public String getEspecialidad() {
        return especialidad;
    }

    public String getEspecialidadEtiqueta() {
        return especialidadEtiqueta;
    }

    public boolean isDisponible() {
        return disponible;
    }
}