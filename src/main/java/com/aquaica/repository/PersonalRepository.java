package com.aquaica.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.aquaica.dto.PersonalResponseDTO;
import com.aquaica.entity.Personal;

public interface PersonalRepository extends JpaRepository<Personal, Long> {

    Optional<Personal> findByDni(String dni);

    @Query("""
        SELECT new com.aquaica.dto.PersonalResponseDTO(
            p.id,
            p.nombre,
            p.dni,
            p.telefono,
            p.especialidad,
            p.estado,
            p.fechaRegistro
        )
        FROM Personal p
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
            p.fechaRegistro
        )
        FROM Personal p
        WHERE p.dni = :dni
        """)
    Optional<PersonalResponseDTO> obtenerPersonalPorDni(String dni);
}