package com.aquaica.dto;

import java.time.LocalDateTime;

import com.aquaica.entity.Notificacion;

public record NotificacionDTO(
        Long id,
        String tipo,
        String titulo,
        String mensaje,
        String enlace,
        boolean leida,
        LocalDateTime fechaCreacion) {

    public static NotificacionDTO de(Notificacion n) {
        return new NotificacionDTO(
                n.getId(), n.getTipo(), n.getTitulo(), n.getMensaje(),
                n.getEnlace(), n.isLeida(), n.getFechaCreacion());
    }
}
