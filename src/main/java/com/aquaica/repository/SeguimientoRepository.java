package com.aquaica.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.aquaica.dto.SeguimientoResponseDTO;
import com.aquaica.entity.Seguimiento;

public interface SeguimientoRepository
        extends JpaRepository<Seguimiento, Long> {

    @Query("""
        SELECT new com.aquaica.dto.SeguimientoResponseDTO(
            s.id,
            r.id,
            p.id,
            p.nombre,
            s.estado,
            s.comentario,
            s.fechaCreacion
        )
        FROM Seguimiento s
        JOIN s.reporte r
        JOIN s.personal p
        WHERE r.id = :reporteId
        ORDER BY s.fechaCreacion ASC
        """)
    List<SeguimientoResponseDTO> obtenerSeguimientosPorReporte(
            Long reporteId);


    @Query("""
        SELECT new com.aquaica.dto.SeguimientoResponseDTO(
            s.id,
            r.id,
            p.id,
            p.nombre,
            s.estado,
            s.comentario,
            s.fechaCreacion
        )
        FROM Seguimiento s
        JOIN s.reporte r
        JOIN s.personal p
        ORDER BY s.fechaCreacion DESC
        """)
    List<SeguimientoResponseDTO> obtenerTodosLosSeguimientos();
}