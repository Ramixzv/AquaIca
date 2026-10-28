package com.aquaica.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.NotificacionDTO;
import com.aquaica.security.CustomUserDetails;
import com.aquaica.service.NotificacionService;

/** Cada usuario autenticado ve y gestiona solo sus propias notificaciones. */
@RestController
@RequestMapping("/api/notificaciones")
public class NotificacionController {

    private final NotificacionService notificacionService;

    public NotificacionController(NotificacionService notificacionService) {
        this.notificacionService = notificacionService;
    }

    @GetMapping
    public ResponseEntity<List<NotificacionDTO>> listar(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(notificacionService.listar(usuarioIdDe(userDetails)));
    }

    @GetMapping("/cantidad")
    public ResponseEntity<Map<String, Long>> cantidad(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(Map.of("noLeidas", notificacionService.noLeidas(usuarioIdDe(userDetails))));
    }

    @PatchMapping("/{id}/leida")
    public ResponseEntity<Void> marcarLeida(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        notificacionService.marcarLeida(id, usuarioIdDe(userDetails));
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/leer-todas")
    public ResponseEntity<Void> marcarTodas(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        notificacionService.marcarTodas(usuarioIdDe(userDetails));
        return ResponseEntity.noContent().build();
    }

    private Long usuarioIdDe(CustomUserDetails userDetails) {

        if (userDetails == null || userDetails.getUsuario() == null) {
            throw new AccessDeniedException("Debes iniciar sesión.");
        }

        return userDetails.getUsuario().getId();
    }
}
