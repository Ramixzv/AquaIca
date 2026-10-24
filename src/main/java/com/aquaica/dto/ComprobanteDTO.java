package com.aquaica.dto;

import java.time.LocalDateTime;

import com.aquaica.entity.OrdenInstalacion;
import com.aquaica.entity.SolicitudServicio;

/**
 * Comprobante de aprobación que ve el ciudadano. Los campos visitaTecnica,
 * medidorSerie y codigoSuministro son null mientras ese paso no ocurra.
 */
public record ComprobanteDTO(
        String codigoSolicitud,
        String codigoOrden,
        String estadoSolicitud,
        String estadoOrden,
        String titular,
        String direccion,
        String referencia,
        LocalDateTime visitaTecnica,
        String medidorSerie,
        String codigoSuministro,
        LocalDateTime fechaAprobacion,
        LocalDateTime fechaEmision) {

    public static ComprobanteDTO de(SolicitudServicio s, OrdenInstalacion o) {
        return new ComprobanteDTO(
                OrdenInstalacionDTO.codigoSolicitud(s),
                o.getCodigo(),
                s.getEstado(),
                o.getEstado(),
                s.getCliente().getNombreCompleto(),
                s.getDireccion(),
                s.getReferencia(),
                o.getFechaProgramada(),
                o.getNumeroSerieMedidor(),
                o.getSuministro() != null ? o.getSuministro().getCodigoSuministro() : null,
                o.getFechaCreacion(),
                LocalDateTime.now());
    }
}
