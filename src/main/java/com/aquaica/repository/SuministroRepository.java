package com.aquaica.repository;

import com.aquaica.entity.Suministro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SuministroRepository extends JpaRepository<Suministro, Long> {

    Optional<Suministro> findByCodigoSuministro(String codigoSuministro);
}