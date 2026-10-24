package com.aquaica.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.ClienteRequestDTO;
import com.aquaica.dto.ClienteResponseDTO;
import com.aquaica.security.CustomUserDetails;
import com.aquaica.service.ClienteService;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {
    private final ClienteService clienteService;
    public ClienteController(ClienteService clienteService) { this.clienteService = clienteService; }

    @GetMapping("/me")
public ResponseEntity<ClienteResponseDTO> obtenerMiPerfil(
        @AuthenticationPrincipal CustomUserDetails userDetails) {

    if (userDetails == null
            || userDetails.getUsuario().getCliente() == null
            || !"CIUDADANO".equals(userDetails.getUsuario().getRol())) {
        throw new AccessDeniedException(
                "No tienes permiso para consultar este perfil");
    }

    Long clienteId = userDetails.getUsuario().getCliente().getId();

    return ResponseEntity.ok(clienteService.buscar(clienteId));
}

    @GetMapping
    public ResponseEntity<List<ClienteResponseDTO>> listar() { return ResponseEntity.ok(clienteService.listar()); }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteResponseDTO> buscar(@PathVariable Long id) { return ResponseEntity.ok(clienteService.buscar(id)); }

    @PostMapping
    public ResponseEntity<ClienteResponseDTO> crear(@RequestBody ClienteRequestDTO datos) { return ResponseEntity.ok(clienteService.crear(datos)); }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteResponseDTO> actualizar(@PathVariable Long id, @RequestBody ClienteRequestDTO datos) { return ResponseEntity.ok(clienteService.actualizar(id, datos)); }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> cambiarEstado(@PathVariable Long id) {
        clienteService.cambiarEstado(id);
        return ResponseEntity.ok(Map.of("mensaje", "Estado del cliente actualizado"));
    }
}
