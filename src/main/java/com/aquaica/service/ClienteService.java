package com.aquaica.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.ClienteRequestDTO;
import com.aquaica.dto.ClienteResponseDTO;
import com.aquaica.entity.Cliente;
import com.aquaica.repository.ClienteRepository;
import com.aquaica.repository.UsuarioRepository;

@Service
public class ClienteService {
    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;

    public ClienteService(
        ClienteRepository clienteRepository,
        UsuarioRepository usuarioRepository) {
    this.clienteRepository = clienteRepository;
    this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<ClienteResponseDTO> listar() {
        return clienteRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public ClienteResponseDTO buscar(Long id) {
        return toDTO(clienteRepository.findById(id).orElseThrow(() -> new RuntimeException("Cliente no encontrado")));
    }

    @Transactional
    public ClienteResponseDTO crear(ClienteRequestDTO datos) {
        validar(datos);
        String dni = datos.getDni().trim();
        if (clienteRepository.existsByDni(dni)) throw new IllegalArgumentException("Ya existe un cliente registrado con ese DNI");
        Cliente cliente = new Cliente();
        aplicar(cliente, datos, dni);
        cliente.setEstado("ACTIVO");
        cliente.setFechaRegistro(LocalDateTime.now());
        return toDTO(clienteRepository.save(cliente));
    }

    @Transactional
    public ClienteResponseDTO actualizar(Long id, ClienteRequestDTO datos) {
        validar(datos);
        Cliente cliente = clienteRepository.findById(id).orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        String dni = datos.getDni().trim();
        clienteRepository.findByDni(dni).filter(otro -> !otro.getId().equals(id)).ifPresent(otro -> { throw new IllegalArgumentException("El DNI ya pertenece a otro cliente"); });
        aplicar(cliente, datos, dni);
        if (datos.getEstado() != null && !datos.getEstado().isBlank()) {
            String estado = datos.getEstado().trim().toUpperCase(Locale.ROOT);
            if (!estado.equals("ACTIVO") && !estado.equals("INACTIVO")) throw new IllegalArgumentException("Estado no válido");
            cliente.setEstado(estado);
        }
        return toDTO(clienteRepository.save(cliente));
    }

    @Transactional
    public void cambiarEstado(Long id) {
        Cliente cliente = clienteRepository.findById(id).orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        cliente.setEstado("ACTIVO".equalsIgnoreCase(cliente.getEstado()) ? "INACTIVO" : "ACTIVO");
        clienteRepository.save(cliente);
    }

    private void validar(ClienteRequestDTO datos) {
        if (datos == null) throw new IllegalArgumentException("Debes enviar los datos del cliente");
        if (datos.getDni() == null || !datos.getDni().trim().matches("\\d{8}")) throw new IllegalArgumentException("El DNI debe tener exactamente 8 dígitos");
        if (datos.getNombreCompleto() == null || datos.getNombreCompleto().isBlank()) throw new IllegalArgumentException("El nombre completo es obligatorio");
        if (datos.getNombreCompleto().trim().length() > 150) throw new IllegalArgumentException("El nombre no puede superar 150 caracteres");
        if (datos.getTelefono() != null && !datos.getTelefono().isBlank() && !datos.getTelefono().trim().matches("\\d{7,15}")) throw new IllegalArgumentException("El teléfono debe contener entre 7 y 15 dígitos");
        if (datos.getEmail() != null && datos.getEmail().length() > 100) throw new IllegalArgumentException("El correo no puede superar 100 caracteres");
    }

    private void aplicar(Cliente cliente, ClienteRequestDTO datos, String dni) {
        cliente.setDni(dni);
        cliente.setNombreCompleto(datos.getNombreCompleto().trim());
        cliente.setTelefono(datos.getTelefono() == null || datos.getTelefono().isBlank() ? null : datos.getTelefono().trim());
        cliente.setEmail(datos.getEmail() == null || datos.getEmail().isBlank() ? null : datos.getEmail().trim());
    }

    private ClienteResponseDTO toDTO(Cliente c) {
    boolean tieneUsuario = usuarioRepository
            .findByClienteId(c.getId())
            .isPresent();

    return new ClienteResponseDTO(
            c.getId(),
            c.getDni(),
            c.getNombreCompleto(),
            c.getTelefono(),
            c.getEmail(),
            c.getEstado(),
            c.getFechaRegistro(),
            c.isTitularVerificado(),
            tieneUsuario
    );
}
}
