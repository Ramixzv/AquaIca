package com.aquaica.dto;

import java.math.BigDecimal;
import java.time.LocalDate;


public record ConsumoCiudadanoDTO(
        String periodo,
        LocalDate fechaLectura,
        BigDecimal lecturaAnterior,
        BigDecimal lecturaActual,
        BigDecimal consumoM3,
        boolean inicial,
        boolean simulada) {
}
