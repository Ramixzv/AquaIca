package com.aquaica.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.aquaica.dto.AuthRequestDTO;
import com.aquaica.dto.AuthResponseDTO;
import com.aquaica.entity.Usuario;
import com.aquaica.repository.UsuarioRepository;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponseDTO login(AuthRequestDTO request) {

        
        Usuario usuario = usuarioRepository
                .findByUsername(request.getUsername())
                .orElseThrow(() ->
                        new RuntimeException("Usuario o contraseña incorrectos")
                );

        if (!"ACTIVO".equalsIgnoreCase(usuario.getEstado())) {
            throw new RuntimeException("El usuario está inactivo");
        }

        
        if (!passwordEncoder.matches(
                request.getPassword(),
                usuario.getPassword())) {

            throw new RuntimeException("Usuario o contraseña incorrectos");
        }

        
        String token = jwtService.generarToken(usuario);

        return new AuthResponseDTO(
        token,
        usuario.getUsername(),
        usuario.getRol(),
        usuario.getPersonal().getId()
    );
    }
}