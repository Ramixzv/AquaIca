package com.aquaica.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.aquaica.entity.Pago;
import com.aquaica.entity.Recibo;

/** Comprobante de un pago simulado. Crear dentro de una transacción. */
public record ComprobantePagoDTO(
        String codigoOperacion,
        String codigoRecibo,
        String periodo,
        String codigoSuministro,
        String titular,
        String direccion,
        BigDecimal monto,
        String medio,
        boolean dePrueba,
        LocalDateTime fechaPago) {

    public static ComprobantePagoDTO de(Recibo r, Pago p) {
        return new ComprobantePagoDTO(
                p.getCodigo(),
                r.getCodigo(),
                r.getPeriodo().getYear() + "-" + String.format("%02d", r.getPeriodo().getMonthValue()),
                r.getSuministro().getCodigoSuministro(),
                r.getSuministro().getCliente() != null
                        ? r.getSuministro().getCliente().getNombreCompleto() : null,
                r.getSuministro().getDireccion(),
                p.getMonto(),
                p.getMedio(),
                p.isDePrueba(),
                p.getFechaPago());
    }
}
