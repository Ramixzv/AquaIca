
package com.aquaica.service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.AuthResponseDTO;
import com.aquaica.dto.GoogleRegistroDTO;
import com.aquaica.entity.Cliente;
import com.aquaica.entity.Usuario;
import com.aquaica.repository.ClienteRepository;
import com.aquaica.repository.UsuarioRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

@Service
public class GoogleAuthService {

    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final GoogleIdTokenVerifier verifier;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;

    public GoogleAuthService(
            UsuarioRepository usuarioRepository,
            ClienteRepository clienteRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${google.oauth.client-id}") String clientId) {

        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;

        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance()
        )
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    public AuthResponseDTO loginGoogle(String credential) {

        if (credential == null || credential.isBlank()) {
            throw new IllegalArgumentException(
                    "No se recibió la credencial de Google.");
        }

        GoogleIdToken idToken;

        try {
            idToken = verifier.verify(credential);
        } catch (Exception e) {
            throw new IllegalArgumentException(
                    "No se pudo verificar la identidad de Google.");
        }

        if (idToken == null) {
            throw new IllegalArgumentException(
                    "La credencial de Google no es válida.");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();

        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new IllegalArgumentException(
                    "El correo de Google no está verificado.");
        }

        String googleSubject = payload.getSubject();

        Usuario usuario = usuarioRepository
                .findByGoogleSubject(googleSubject)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Esta cuenta de Google todavía no está vinculada "
                        + "a una cuenta ciudadana de AquaIca."
                ));

        if (!"ACTIVO".equalsIgnoreCase(usuario.getEstado())) {
            throw new IllegalArgumentException(
                    "La cuenta de AquaIca está inactiva.");
        }

        if (!"CIUDADANO".equalsIgnoreCase(usuario.getRol())
                || usuario.getCliente() == null
                || usuario.getPersonal() != null) {
            throw new IllegalArgumentException(
                    "Google solo está habilitado para ciudadanos.");
        }

        if (!"ACTIVO".equalsIgnoreCase(
                usuario.getCliente().getEstado())) {
            throw new IllegalArgumentException(
                    "El perfil ciudadano está inactivo.");
        }

        String token = jwtService.generarToken(usuario);

        return new AuthResponseDTO(
                token,
                usuario.getUsername(),
                usuario.getRol(),
                null,
                usuario.getCliente().getId()
        );
    }

          
@Transactional
public AuthResponseDTO registrarGoogle(GoogleRegistroDTO request) {

    if (request.getDni() == null
            || !request.getDni().matches("\\d{8}")) {
        throw new IllegalArgumentException(
                "El DNI debe contener exactamente 8 dígitos.");
    }

    if (request.getNombreCompleto() == null
            || request.getNombreCompleto().isBlank()
            || request.getNombreCompleto().trim().length() > 150) {
        throw new IllegalArgumentException(
                "Ingresa un nombre completo válido.");
    }

    if (request.getUsername() == null
            || !request.getUsername().matches("[a-zA-Z0-9._-]{4,50}")) {
        throw new IllegalArgumentException(
                "El usuario debe tener entre 4 y 50 caracteres.");
    }

    GoogleIdToken idToken;

    try {
        idToken = verifier.verify(request.getCredential());
    } catch (Exception e) {
        throw new IllegalArgumentException(
                "No se pudo verificar la cuenta de Google.");
    }

    if (idToken == null) {
        throw new IllegalArgumentException(
                "La credencial de Google no es válida.");
    }

    GoogleIdToken.Payload payload = idToken.getPayload();

    if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
        throw new IllegalArgumentException(
                "El correo de Google no está verificado.");
    }

    String googleSubject = payload.getSubject();
    String email = payload.getEmail();

    if (email == null || email.isBlank()) {
        throw new IllegalArgumentException(
                "Google no proporcionó un correo válido.");
    }

    if (usuarioRepository.findByGoogleSubject(googleSubject).isPresent()) {
        throw new IllegalArgumentException(
                "Esta cuenta de Google ya está vinculada a AquaIca. "
                + "Inicia sesión desde la pantalla de acceso.");
    }

    if (usuarioRepository.existsByUsername(request.getUsername().trim())) {
        throw new IllegalArgumentException(
                "Ese nombre de usuario ya está registrado.");
    }

    if (clienteRepository.existsByDni(request.getDni())) {
        throw new IllegalArgumentException(
                "Ya existe un ciudadano con ese DNI. "
                + "Recupera o vincula tu cuenta existente.");
    }

    if (clienteRepository.existsByEmailIgnoreCase(email.trim())) {
        throw new IllegalArgumentException(
                "Ese correo ya está asociado a un ciudadano. "
                + "Debes recuperar o vincular tu cuenta existente.");
    }

    Cliente cliente = new Cliente();
    cliente.setDni(request.getDni());
    cliente.setNombreCompleto(request.getNombreCompleto().trim());
    cliente.setEmail(email.trim());
    cliente.setTelefono(
            request.getTelefono() == null
                    || request.getTelefono().isBlank()
                    ? null
                    : request.getTelefono().trim());
    cliente.setEstado("ACTIVO");
    cliente.setTitularVerificado(false);
    cliente.setFechaRegistro(LocalDateTime.now());

    Cliente clienteGuardado = clienteRepository.save(cliente);

    Usuario usuario = new Usuario();
    usuario.setCliente(clienteGuardado);
    usuario.setUsername(request.getUsername().trim());

    // Se almacena únicamente el hash de una contraseña aleatoria.
    // No se conoce ni se expone esta contraseña al ciudadano.
    usuario.setPassword(
            passwordEncoder.encode(UUID.randomUUID().toString()));

    usuario.setGoogleSubject(googleSubject);
    usuario.setRol("CIUDADANO");
    usuario.setEstado("ACTIVO");
    usuario.setFechaCreacion(LocalDateTime.now());

    usuarioRepository.save(usuario);

    return new AuthResponseDTO(
            jwtService.generarToken(usuario),
            usuario.getUsername(),
            usuario.getRol(),
            null,
            clienteGuardado.getId()
    );
}

}
