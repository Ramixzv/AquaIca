
package com.aquaica.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aquaica.entity.Usuario;


public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    

    Optional<Usuario> findByUsername(String username);

    boolean existsByUsername(String username);

    Optional<Usuario> findByPersonalId(Long personalId);

    // Buscar si un cliente ya tiene una cuenta
    Optional<Usuario> findByClienteId(Long clienteId);

    Optional<Usuario> findByGoogleSubject(String googleSubject);
}
