package com.aquaica.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Suministro tal como lo ve su titular en el portal ciudadano. */
public record SuministroCiudadanoDTO(
        Long id,
        String codigoSuministro,
        String direccion,
        Double latitud,
        Double longitud,
        String medidorSerie,
        LocalDate medidorInstalado,
        BigDecimal ultimaLectura,
        LocalDate ultimaFechaLectura,
        BigDecimal ultimoConsumoM3,
        boolean simulada) {
}
