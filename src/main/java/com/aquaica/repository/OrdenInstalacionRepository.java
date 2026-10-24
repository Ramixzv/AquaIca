package com.aquaica.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aquaica.entity.OrdenInstalacion;

public interface OrdenInstalacionRepository
        extends JpaRepository<OrdenInstalacion, Long> {

    Optional<OrdenInstalacion> findBySolicitudId(Long solicitudId);

    List<OrdenInstalacion> findAllByOrderByFechaCreacionDesc();

    List<OrdenInstalacion> findByTecnicoIdOrderByFechaCreacionDesc(Long tecnicoId);
}
