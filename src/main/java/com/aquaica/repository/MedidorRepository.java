
package com.aquaica.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aquaica.entity.Medidor;

public interface MedidorRepository extends JpaRepository<Medidor, Long> {

    Optional<Medidor> findByNumeroSerie(String numeroSerie);

    boolean existsByNumeroSerie(String numeroSerie);

    Optional<Medidor> findBySuministroIdAndEstado(Long suministroId, String estado);

    boolean existsBySuministroIdAndEstado(Long suministroId, String estado);

    List<Medidor> findBySuministroIdOrderByFechaInstalacionDescIdDesc(Long suministroId);

    List<Medidor> findByEstado(String estado);
}
