package com.aquaica.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

import com.aquaica.entity.Lectura;
import com.aquaica.entity.Medidor;

/**
 * Un medidor activo con su lectura más reciente (los campos "ultima..."
 * son null si todavía no tiene lecturas). Pensado para la pantalla de lecturas.
 */
public record MedidorLecturaResumenDTO(
        Long medidorId,
        String numeroSerie,
        Long suministroId,
        String codigoSuministro,
        String direccion,
        LocalDate fechaInstalacion,
        BigDecimal ultimaLecturaActual,
        LocalDate ultimaFechaLectura,
        BigDecimal ultimoConsumoM3,
        String ultimoPeriodo,
        String ultimoOrigen) {

    public static MedidorLecturaResumenDTO de(Medidor m, Lectura ultima) {
        return new MedidorLecturaResumenDTO(
                m.getId(),
                m.getNumeroSerie(),
                m.getSuministro().getId(),
                m.getSuministro().getCodigoSuministro(),
                m.getSuministro().getDireccion(),
                m.getFechaInstalacion(),
                ultima != null ? ultima.getLecturaActual() : null,
                ultima != null ? ultima.getFechaLectura() : null,
                ultima != null ? ultima.getConsumoM3() : null,
                ultima != null ? YearMonth.from(ultima.getPeriodo()).toString() : null,
                ultima != null ? ultima.getOrigen() : null);
    }
}