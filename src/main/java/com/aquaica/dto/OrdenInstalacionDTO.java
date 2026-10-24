package com.aquaica.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.aquaica.entity.OrdenInstalacion;
import com.aquaica.entity.SolicitudServicio;

/** Vista de una orden de instalación para ADMIN/SOPORTE y TECNICO. Crear dentro de una transacción. */
public record OrdenInstalacionDTO(
        Long id,
        String codigo,
        Long solicitudId,
        String codigoSolicitud,
        String estado,
        String estadoSolicitud,
        String clienteNombre,
        String clienteTelefono,
        String direccion,
        String referencia,
        Double latitud,
        Double longitud,
        Long tecnicoId,
        String tecnicoNombre,
        LocalDateTime fechaProgramada,
        String numeroSerieMedidor,
        BigDecimal lecturaInicial,
        String resultado,
        String codigoSuministro,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaCompletada) {

    public static OrdenInstalacionDTO de(OrdenInstalacion o) {
        SolicitudServicio s = o.getSolicitud();
        return new OrdenInstalacionDTO(
                o.getId(),
                o.getCodigo(),
                s.getId(),
                codigoSolicitud(s),
                o.getEstado(),
                s.getEstado(),
                s.getCliente().getNombreCompleto(),
                s.getCliente().getTelefono(),
                s.getDireccion(),
                s.getReferencia(),
                s.getLatitud(),
                s.getLongitud(),
                o.getTecnico() != null ? o.getTecnico().getId() : null,
                o.getTecnico() != null ? o.getTecnico().getNombre() : null,
                o.getFechaProgramada(),
                o.getNumeroSerieMedidor(),
                o.getLecturaInicial(),
                o.getResultado(),
                o.getSuministro() != null ? o.getSuministro().getCodigoSuministro() : null,
                o.getFechaCreacion(),
                o.getFechaCompletada());
    }

    /** Código legible de la solicitud, por ejemplo SOL-2026-000125. */
    public static String codigoSolicitud(SolicitudServicio s) {
        return String.format("SOL-%d-%06d", s.getFechaSolicitud().getYear(), s.getId());
    }
}