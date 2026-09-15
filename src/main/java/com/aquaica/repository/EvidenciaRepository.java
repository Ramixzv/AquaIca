package com.aquaica.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.aquaica.dto.EvidenciaResponseDTO;
import com.aquaica.entity.Evidencia;

public interface EvidenciaRepository extends JpaRepository<Evidencia, Long> {

    @Query("""
        SELECT new com.aquaica.dto.EvidenciaResponseDTO(
            e.id,
            r.id,
            e.nombreArchivo,
            e.rutaArchivo,
            e.tipoArchivo,
            e.fechaCreacion,
            e.origen
        )
        FROM Evidencia e
        JOIN e.reporte r
        WHERE r.id = :reporteId
        ORDER BY e.fechaCreacion DESC
        """)
    List<EvidenciaResponseDTO> obtenerEvidenciasPorReporte(
            Long reporteId);


    @Query("""
        SELECT new com.aquaica.dto.EvidenciaResponseDTO(
            e.id,
            r.id,
            e.nombreArchivo,
            e.rutaArchivo,
            e.tipoArchivo,
            e.fechaCreacion,
            e.origen
        )
        FROM Evidencia e
        JOIN e.reporte r
        ORDER BY e.fechaCreacion DESC
        """)
    List<EvidenciaResponseDTO> obtenerTodasLasEvidencias();

}