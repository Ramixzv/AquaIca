package com.aquaica.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.aquaica.entity.Recibo;

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
        String motivoAnulacion) {

    public static ReciboDTO de(Recibo r) {

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
                r.getMotivoAnulacion());
    }
}
