package com.aquaica.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aquaica.dto.PersonalResponseDTO;
import com.aquaica.entity.Personal;

public interface PersonalRepository extends JpaRepository<Personal, Long> {

    Optional<Personal> findByDni(String dni);

    boolean existsByDni(String dni);

    @Query("""
        SELECT new com.aquaica.dto.PersonalResponseDTO(
            p.id,
            p.nombre,
            p.dni,
            p.telefono,
            p.especialidad,
            p.estado,
            p.fechaRegistro,
            u.username,
            u.rol
        )
        FROM Personal p
        LEFT JOIN Usuario u ON u.personal.id = p.id
        ORDER BY p.nombre ASC
        """)
    List<PersonalResponseDTO> obtenerTodoElPersonal();

    @Query("""
        SELECT new com.aquaica.dto.PersonalResponseDTO(
            p.id,
            p.nombre,
            p.dni,
            p.telefono,
            p.especialidad,
            p.estado,
            p.fechaRegistro,
            u.username,
            u.rol
        )
        FROM Personal p
        LEFT JOIN Usuario u ON u.personal.id = p.id
        WHERE p.dni = :dni
        """)
    Optional<PersonalResponseDTO> obtenerPersonalPorDni(String dni);

    @Query("""
        SELECT new com.aquaica.dto.PersonalResponseDTO(
            p.id,
            p.nombre,
            p.dni,
            p.telefono,
            p.especialidad,
            p.estado,
            p.fechaRegistro,
            u.username,
            u.rol
        )
        FROM Personal p
        LEFT JOIN Usuario u ON u.personal.id = p.id
        WHERE p.id = :id
        """)
    Optional<PersonalResponseDTO> obtenerPersonalPorId(@Param("id") Long id);

    @Query("""
        SELECT p
        FROM Personal p
        JOIN Usuario u ON u.personal.id = p.id
        WHERE p.especialidad = :especialidad
          AND p.estado = 'ACTIVO'
          AND u.rol = 'TECNICO'
        ORDER BY p.nombre ASC
        """)
    List<Personal> obtenerTecnicosActivosPorEspecialidad(
            @Param("especialidad") String especialidad);
}