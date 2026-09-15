package com.aquaica.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aquaica.entity.InformeTecnico;

public interface InformeTecnicoRepository
        extends JpaRepository<InformeTecnico, Long> {

    Optional<InformeTecnico> findByReporteId(Long reporteId);

}