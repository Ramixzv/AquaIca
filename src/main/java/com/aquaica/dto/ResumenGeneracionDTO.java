package com.aquaica.dto;

import java.util.List;


public record ResumenGeneracionDTO(
        String periodo,
        int generados,
        int dePrueba,
        int yaFacturados,
        int sinTarifa,
        List<String> avisos) {
}
