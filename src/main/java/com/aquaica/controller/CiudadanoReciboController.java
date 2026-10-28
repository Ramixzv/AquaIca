package com.aquaica.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.ComprobantePagoDTO;
import com.aquaica.dto.ReciboCiudadanoDTO;
import com.aquaica.security.CustomUserDetails;
import com.aquaica.service.CiudadanoReciboService;

/** Portal ciudadano: recibos y pagos del cliente autenticado (rol CIUDADANO). */
@RestController
@RequestMapping("/api/ciudadano/recibos")
public class CiudadanoReciboController {

    private final CiudadanoReciboService servicio;

    public CiudadanoReciboController(CiudadanoReciboService servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    public ResponseEntity<List<ReciboCiudadanoDTO>> misRecibos(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(servicio.misRecibos(clienteIdDe(userDetails)));
    }

    // Body: {"medio": "TARJETA" | "YAPE" | "TRANSFERENCIA"}  (pago simulado)
    @PostMapping("/{id}/pagar")
    public ResponseEntity<ReciboCiudadanoDTO> pagar(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> solicitud) {

        return ResponseEntity.ok(servicio.pagar(
                id, solicitud.get("medio"), clienteIdDe(userDetails), userDetails.getUsuario().getId()));
    }

    @GetMapping("/{id}/comprobante")
    public ResponseEntity<ComprobantePagoDTO> comprobante(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(servicio.comprobante(id, clienteIdDe(userDetails)));
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
