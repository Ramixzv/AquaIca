package com.aquaica.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.aquaica.dto.AsignacionResponseDTO;
import com.aquaica.entity.Asignacion;
public interface AsignacionRepository extends JpaRepository<Asignacion, Long> {

    @Query("""
        SELECT new com.aquaica.dto.AsignacionResponseDTO(
            a.id,
            r.id,
            p.id,
            p.nombre,
            p.dni,
            p.especialidad,
            a.fechaAsignacion,
            a.observaciones,
            a.estado
        )
        FROM Asignacion a
        JOIN a.reporte r
        JOIN a.personal p
        WHERE r.id = :reporteId
        ORDER BY a.fechaAsignacion DESC
        """)
    List<AsignacionResponseDTO> obtenerAsignacionesPorReporte(Long reporteId);

    @Query("""
        SELECT new com.aquaica.dto.AsignacionResponseDTO(
            a.id,
            r.id,
            p.id,
            p.nombre,
            p.dni,
            p.especialidad,
            a.fechaAsignacion,
            a.observaciones,
            a.estado
        )
        FROM Asignacion a
        JOIN a.reporte r
        JOIN a.personal p
        WHERE p.id = :personalId
        ORDER BY a.fechaAsignacion DESC
        """)
    List<AsignacionResponseDTO> obtenerAsignacionesPorPersonal(Long personalId);
    

    boolean existsByReporteIdAndPersonalId(
        Long reporteId,
        Long personalId
);
    Optional<Asignacion> findByReporteIdAndPersonalId(
        Long reporteId,
        Long personalId
);

}
