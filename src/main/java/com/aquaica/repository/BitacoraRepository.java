package com.aquaica.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aquaica.entity.Bitacora;

public interface BitacoraRepository extends JpaRepository<Bitacora, Long> {

    List<Bitacora> findAllByReporteIdOrderByFechaCreacionAsc(Long reporteId);

    List<Bitacora> findAllByAsignacionIdOrderByFechaCreacionAsc(Long asignacionId);
}