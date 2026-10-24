package com.aquaica.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aquaica.entity.Tarifa;

public interface TarifaRepository extends JpaRepository<Tarifa, Long> {

    List<Tarifa> findAllByOrderByCategoriaAscVigenteDesdeDescIdDesc();

    Optional<Tarifa> findFirstByCategoriaOrderByVigenteDesdeDescIdDesc(String categoria);

    Optional<Tarifa> findFirstByCategoriaAndVigenteDesdeLessThanEqualOrderByVigenteDesdeDescIdDesc(
            String categoria, LocalDate fecha);
}
