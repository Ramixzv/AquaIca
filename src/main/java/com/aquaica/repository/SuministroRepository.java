
package com.aquaica.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aquaica.entity.Suministro;

public interface SuministroRepository
        extends JpaRepository<Suministro, Long> {

    Optional<Suministro> findByCodigoSuministro(String codigoSuministro);

    boolean existsByCodigoSuministro(String codigoSuministro);

    List<Suministro> findByClienteId(Long clienteId);

    List<Suministro> findByCodigoSuministroContainingIgnoreCaseOrDireccionContainingIgnoreCase(
            String codigoSuministro,
            String direccion
    );
}
