
package com.aquaica.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aquaica.entity.SolicitudServicio;

public interface SolicitudServicioRepository
        extends JpaRepository<SolicitudServicio, Long> {

    List<SolicitudServicio> findByClienteIdOrderByFechaSolicitudDesc(
            Long clienteId);

    List<SolicitudServicio> findByEstadoOrderByFechaSolicitudDesc(
            String estado);

    List<SolicitudServicio> findAllByOrderByFechaSolicitudDesc();

    boolean existsByClienteIdAndEstadoIn(
            Long clienteId, List<String> estados);
}
