package com.aquaica.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.aquaica.entity.Tarifa;


public record TarifaDTO(
        Long id,
        String categoria,
        BigDecimal cargoFijo,
        BigDecimal precioM3,
        LocalDate vigenteDesde,
        boolean vigente,
        String creadaPor,
        LocalDateTime fechaCreacion) {

    public static TarifaDTO de(Tarifa t, boolean vigente) {
        return new TarifaDTO(
                t.getId(),
                t.getCategoria(),
                t.getCargoFijo(),
                t.getPrecioM3(),
                t.getVigenteDesde(),
                vigente,
                t.getCreadaPor() != null ? t.getCreadaPor().getUsername() : null,
                t.getFechaCreacion());
    }
}
