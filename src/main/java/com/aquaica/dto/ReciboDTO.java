package com.aquaica.dto;

import com.aquaica.entity.Pago;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.aquaica.entity.Recibo;

/**
 * estado = el guardado (PENDIENTE, PAGADO o ANULADO).
 * estadoVisible = lo que se muestra: un PENDIENTE pasado de fecha se ve como VENCIDO.
 * Crear dentro de una transacción.
 */
public record ReciboDTO(
        Long id,
        String codigo,
        Long suministroId,
        String codigoSuministro,
        String direccion,
        String cliente,
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
        String generadoPor,
        String anuladoPor,
        LocalDateTime fechaAnulacion,
        String motivoAnulacion,
        LocalDateTime fechaPago,
        String codigoOperacion,
        String medioPago) {

    public static ReciboDTO de(Recibo r) {
        return de(r, null);
    }

    public static ReciboDTO de(Recibo r, Pago pago) {

        String visible = "PENDIENTE".equals(r.getEstado())
                && r.getFechaVencimiento().isBefore(LocalDate.now())
                ? "VENCIDO" : r.getEstado();

        return new ReciboDTO(
                r.getId(),
                r.getCodigo(),
                r.getSuministro().getId(),
                r.getSuministro().getCodigoSuministro(),
                r.getSuministro().getDireccion(),
                r.getSuministro().getCliente() != null
                        ? r.getSuministro().getCliente().getNombreCompleto() : null,
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
                r.getGeneradoPor() != null ? r.getGeneradoPor().getUsername() : null,
                r.getAnuladoPor() != null ? r.getAnuladoPor().getUsername() : null,
                r.getFechaAnulacion(),
                r.getMotivoAnulacion(),
                pago != null ? pago.getFechaPago() : null,
                pago != null ? pago.getCodigo() : null,
                pago != null ? pago.getMedio() : null);
    }
}
