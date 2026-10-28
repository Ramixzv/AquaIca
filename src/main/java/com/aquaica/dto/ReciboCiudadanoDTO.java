package com.aquaica.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.aquaica.entity.Pago;
import com.aquaica.entity.Recibo;

/** Recibo tal como lo ve su titular: sin datos internos del personal. Crear dentro de una transacción. */
public record ReciboCiudadanoDTO(
        Long id,
        String codigo,
        String codigoSuministro,
        String direccion,
        String periodo,
        BigDecimal consumoM3,
        String categoria,
        BigDecimal cargoFijo,
        BigDecimal precioM3,
        BigDecimal importeConsumo,
        BigDecimal total,
        boolean dePrueba,
        String estado,
        String estadoVisible,
        LocalDate fechaEmision,
        LocalDate fechaVencimiento,
        LocalDateTime fechaPago,
        String codigoOperacion,
        String medioPago) {

    public static ReciboCiudadanoDTO de(Recibo r, Pago pago) {

        String visible = "PENDIENTE".equals(r.getEstado())
                && r.getFechaVencimiento().isBefore(LocalDate.now())
                ? "VENCIDO" : r.getEstado();

        return new ReciboCiudadanoDTO(
                r.getId(),
                r.getCodigo(),
                r.getSuministro().getCodigoSuministro(),
                r.getSuministro().getDireccion(),
                r.getPeriodo().getYear() + "-" + String.format("%02d", r.getPeriodo().getMonthValue()),
                r.getConsumoM3(),
                r.getCategoria(),
                r.getCargoFijo(),
                r.getPrecioM3(),
                r.getImporteConsumo(),
                r.getTotal(),
                r.isDePrueba(),
                r.getEstado(),
                visible,
                r.getFechaEmision(),
                r.getFechaVencimiento(),
                pago != null ? pago.getFechaPago() : null,
                pago != null ? pago.getCodigo() : null,
                pago != null ? pago.getMedio() : null);
    }
}
