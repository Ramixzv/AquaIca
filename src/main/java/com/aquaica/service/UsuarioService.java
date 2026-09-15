package com.aquaica.service;

import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.aquaica.entity.Personal;
import com.aquaica.entity.Usuario;
import com.aquaica.repository.PersonalRepository;
import com.aquaica.repository.UsuarioRepository;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PersonalRepository personalRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            PersonalRepository personalRepository,
            PasswordEncoder passwordEncoder) {

        this.usuarioRepository = usuarioRepository;
        this.personalRepository = personalRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Usuario registrarUsuario(
            Long personalId,
            String username,
            String password,
            String rol) {

        
        if (usuarioRepository.existsByUsername(username)) {
            throw new RuntimeException(
                    "El username ya está registrado"
            );
        }

        
        Personal personal = personalRepository.findById(personalId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Personal no encontrado"
                        ));

        
        if (!"ACTIVO".equalsIgnoreCase(personal.getEstado())) {
            throw new RuntimeException(
                    "El personal seleccionado no está activo"
            );
        }

        
        Usuario usuario = new Usuario();

        usuario.setPersonal(personal);
        usuario.setUsername(username);

        
        usuario.setPassword(
                passwordEncoder.encode(password)
        );

        usuario.setRol(rol);
        usuario.setEstado("ACTIVO");
        usuario.setFechaCreacion(LocalDateTime.now());

        // 6. Guardar usuario
        return usuarioRepository.save(usuario);
    }
}