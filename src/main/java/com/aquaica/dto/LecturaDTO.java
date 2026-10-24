package com.aquaica.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;

import com.aquaica.entity.Lectura;

/**
 * Vista de una lectura. Sin datos del cliente.
 * Crear dentro de una transacción (lee relaciones perezosas).
 */
public record LecturaDTO(
        Long id,
        Long medidorId,
        String numeroSerie,
        Long suministroId,
        String codigoSuministro,
        String direccion,
        String periodo,
        BigDecimal lecturaAnterior,
        BigDecimal lecturaActual,
        LocalDate fechaLecturaAnterior,
        LocalDate fechaLectura,
        BigDecimal consumoM3,
        String origen,
        boolean simulada,
        String observacion,
        String registradoPor,
        LocalDateTime fechaRegistro,
        String estado,
        String anuladaPor,
        LocalDateTime fechaAnulacion,
        String motivoAnulacion) {

    public static LecturaDTO de(Lectura l) {
        return new LecturaDTO(
                l.getId(),
                l.getMedidor().getId(),
                l.getMedidor().getNumeroSerie(),
                l.getMedidor().getSuministro().getId(),
                l.getMedidor().getSuministro().getCodigoSuministro(),
                l.getMedidor().getSuministro().getDireccion(),
                YearMonth.from(l.getPeriodo()).toString(),
                l.getLecturaAnterior(),
                l.getLecturaActual(),
                l.getFechaLecturaAnterior(),
                l.getFechaLectura(),
                l.getConsumoM3(),
                l.getOrigen(),
                "SIMULADA".equals(l.getOrigen()),
                l.getObservacion(),
                l.getRegistradoPor() != null ? l.getRegistradoPor().getUsername() : null,
                l.getFechaRegistro(),
                l.getEstado(),
                l.getAnuladaPor() != null ? l.getAnuladaPor().getUsername() : null,
                l.getFechaAnulacion(),
                l.getMotivoAnulacion());
    }
}
