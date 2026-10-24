package com.aquaica.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.aquaica.entity.Medidor;

/** Vista de un medidor para el personal. Crear dentro de una transacción. */
public record MedidorDTO(
        Long id,
        String numeroSerie,
        Long suministroId,
        String codigoSuministro,
        String direccion,
        String estado,
        LocalDate fechaInstalacion,
        LocalDate fechaRetiro,
        String motivoRetiro,
        LocalDateTime fechaRegistro) {

    public static MedidorDTO de(Medidor m) {
        return new MedidorDTO(
                m.getId(),
                m.getNumeroSerie(),
                m.getSuministro().getId(),
                m.getSuministro().getCodigoSuministro(),
                m.getSuministro().getDireccion(),
                m.getEstado(),
                m.getFechaInstalacion(),
                m.getFechaRetiro(),
                m.getMotivoRetiro(),
                m.getFechaRegistro());
    }
}
