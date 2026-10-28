package com.aquaica.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aquaica.entity.Pago;

public interface PagoRepository extends JpaRepository<Pago, Long> {

    Optional<Pago> findByReciboId(Long reciboId);
}
