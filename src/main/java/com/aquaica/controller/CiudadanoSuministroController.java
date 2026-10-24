package com.aquaica.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.ConsumoCiudadanoDTO;
import com.aquaica.dto.SuministroCiudadanoDTO;
import com.aquaica.security.CustomUserDetails;
import com.aquaica.service.CiudadanoSuministroService;

/** Portal ciudadano: suministros y consumo del cliente autenticado (rol CIUDADANO). */
@RestController
@RequestMapping("/api/ciudadano")
public class CiudadanoSuministroController {

    private final CiudadanoSuministroService servicio;

    public CiudadanoSuministroController(CiudadanoSuministroService servicio) {
        this.servicio = servicio;
    }

    @GetMapping("/suministros")
    public ResponseEntity<List<SuministroCiudadanoDTO>> misSuministros(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(servicio.misSuministros(clienteIdDe(userDetails)));
    }

    @GetMapping("/suministros/{suministroId}/consumo")
    public ResponseEntity<List<ConsumoCiudadanoDTO>> consumo(
            @PathVariable Long suministroId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(servicio.consumo(suministroId, clienteIdDe(userDetails)));
    }

    private Long clienteIdDe(CustomUserDetails userDetails) {

        if (userDetails == null
                || userDetails.getUsuario() == null
                || userDetails.getUsuario().getCliente() == null
                || !"CIUDADANO".equals(userDetails.getUsuario().getRol())) {
            throw new AccessDeniedException(
                    "Se requiere una cuenta ciudadana asociada a un cliente.");
        }

        return userDetails.getUsuario().getCliente().getId();
    }
}
