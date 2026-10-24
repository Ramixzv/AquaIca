
package com.aquaica.service;

import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.entity.Cliente;
import com.aquaica.entity.Personal;
import com.aquaica.entity.Usuario;
import com.aquaica.repository.ClienteRepository;
import com.aquaica.repository.PersonalRepository;
import com.aquaica.repository.UsuarioRepository;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PersonalRepository personalRepository;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            PersonalRepository personalRepository,
            ClienteRepository clienteRepository,
            PasswordEncoder passwordEncoder) {

        this.usuarioRepository = usuarioRepository;
        this.personalRepository = personalRepository;
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Usuario registrarUsuario(
            Long personalId,
            String username,
            String password,
            String rol) {

        validarCredenciales(username, password);

        if (!"ADMIN".equals(rol)
                && !"SOPORTE".equals(rol)
                && !"TECNICO".equals(rol)) {
            throw new IllegalArgumentException(
                    "Rol de personal no permitido");
        }

        Personal personal = personalRepository.findById(personalId)
                .orElseThrow(() ->
                        new RuntimeException("Personal no encontrado"));

        if (!"ACTIVO".equalsIgnoreCase(personal.getEstado())) {
            throw new RuntimeException(
                    "El personal seleccionado no está activo");
        }

        Usuario usuario = new Usuario();
        usuario.setPersonal(personal);
        usuario.setCliente(null);

        return prepararYGuardar(usuario, username, password, rol);
    }


    @Transactional
    public Usuario registrarUsuarioCliente(
            Long clienteId,
            String username,
            String password) {

        validarCredenciales(username, password);

        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() ->
                        new RuntimeException("Cliente no encontrado"));

        if (!"ACTIVO".equalsIgnoreCase(cliente.getEstado())) {
            throw new RuntimeException("El cliente no está activo");
        }

        if (usuarioRepository.findByClienteId(clienteId).isPresent()) {
            throw new RuntimeException(
                    "El cliente ya tiene una cuenta");
        }

        Usuario usuario = new Usuario();
        usuario.setCliente(cliente);
        usuario.setPersonal(null);

        return prepararYGuardar(
                usuario, username, password, "CIUDADANO");
    }

    private void validarCredenciales(
            String username, String password) {

        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException(
                    "El username es obligatorio");
        }

        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException(
                    "La contraseña debe tener al menos 8 caracteres");
        }

        if (usuarioRepository.existsByUsername(username.trim())) {
            throw new RuntimeException(
                    "El username ya está registrado");
        }
    }

    private Usuario prepararYGuardar(
            Usuario usuario,
            String username,
            String password,
            String rol) {

        usuario.setUsername(username.trim());
        usuario.setPassword(passwordEncoder.encode(password));
        usuario.setRol(rol);
        usuario.setEstado("ACTIVO");
        usuario.setFechaCreacion(LocalDateTime.now());

        return usuarioRepository.save(usuario);
    }
}
