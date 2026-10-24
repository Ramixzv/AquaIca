
package com.aquaica.service;
import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.AuthRequestDTO;
import com.aquaica.dto.AuthResponseDTO;
import com.aquaica.dto.RegistroCiudadanoDTO;
import com.aquaica.entity.Cliente;
import com.aquaica.entity.Usuario;
import com.aquaica.repository.ClienteRepository;
import com.aquaica.repository.UsuarioRepository;


@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ClienteRepository clienteRepository;

    public AuthService(
        UsuarioRepository usuarioRepository,
        ClienteRepository clienteRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService) {

    this.usuarioRepository = usuarioRepository;
    this.clienteRepository = clienteRepository;
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

        boolean tienePersonal = usuario.getPersonal() != null;
        boolean tieneCliente = usuario.getCliente() != null;

        if (tienePersonal == tieneCliente) {
            throw new IllegalStateException(
                    "La cuenta debe estar asociada a un único perfil"
            );
        }

        String token = jwtService.generarToken(usuario);

        Long personalId = tienePersonal
                ? usuario.getPersonal().getId()
                : null;

        Long clienteId = tieneCliente
                ? usuario.getCliente().getId()
                : null;

        return new AuthResponseDTO(
                token,
                usuario.getUsername(),
                usuario.getRol(),
                personalId,
                clienteId
        );
    }

@Transactional
public void registrarCiudadano(RegistroCiudadanoDTO request) {

    if (request.getDni() == null
            || !request.getDni().matches("\\d{8}")) {
        throw new IllegalArgumentException(
                "El DNI debe contener exactamente 8 dígitos.");
    }

    if (request.getNombreCompleto() == null
            || request.getNombreCompleto().isBlank()
            || request.getNombreCompleto().length() > 150) {
        throw new IllegalArgumentException(
                "Ingresa un nombre completo válido.");
    }

    if (request.getUsername() == null
            || !request.getUsername().matches("[a-zA-Z0-9._-]{4,50}")) {
        throw new IllegalArgumentException(
                "El usuario debe tener entre 4 y 50 caracteres "
                + "y utilizar letras, números, puntos, guiones o guion bajo.");
    }

    if (request.getPassword() == null
            || request.getPassword().length() < 10
            || request.getPassword().length() > 72) {
        throw new IllegalArgumentException(
                "La contraseña debe tener entre 10 y 72 caracteres.");
    }

    if (request.getEmail() == null
            || !request.getEmail().matches(
                    "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
        throw new IllegalArgumentException(
                "Ingresa un correo electrónico válido.");
    }

    if (usuarioRepository.existsByUsername(request.getUsername())) {
        throw new IllegalArgumentException(
                "Ese nombre de usuario ya está registrado.");
    }

    if (clienteRepository.existsByDni(request.getDni())) {
        throw new IllegalArgumentException(
                "Ya existe un cliente con ese DNI. "
                + "Debes activar su cuenta mediante el proceso de verificación.");
    }

    if (clienteRepository.findAll().stream()
            .anyMatch(c -> c.getEmail() != null
                    && c.getEmail().equalsIgnoreCase(
                            request.getEmail().trim()))) {
        throw new IllegalArgumentException(
                "Ese correo ya está asociado a un cliente.");
    }

    Cliente cliente = new Cliente();
    cliente.setDni(request.getDni());
    cliente.setNombreCompleto(request.getNombreCompleto().trim());
    cliente.setTelefono(
            request.getTelefono() == null
                    || request.getTelefono().isBlank()
                    ? null : request.getTelefono().trim());
    cliente.setEmail(request.getEmail().trim());
    cliente.setEstado("ACTIVO");
    cliente.setFechaRegistro(LocalDateTime.now());

    Cliente clienteGuardado = clienteRepository.save(cliente);

    Usuario usuario = new Usuario();
    usuario.setCliente(clienteGuardado);
    usuario.setUsername(request.getUsername().trim());
    usuario.setPassword(
            passwordEncoder.encode(request.getPassword()));
    usuario.setRol("CIUDADANO");
    usuario.setEstado("ACTIVO");
    usuario.setFechaCreacion(LocalDateTime.now());

    usuarioRepository.save(usuario);
}

}
