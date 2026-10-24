package com.aquaica.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aquaica.entity.InformeTecnico;

public interface InformeTecnicoRepository
        extends JpaRepository<InformeTecnico, Long> {


    Optional<InformeTecnico> findByAsignacionId(
            Long asignacionId
    );


    List<InformeTecnico> findAllByReporteIdOrderByFechaCreacionAsc(
            Long reporteId
    );


    Optional<InformeTecnico> findFirstByReporteIdOrderByFechaCreacionDesc(
            Long reporteId
    );
}