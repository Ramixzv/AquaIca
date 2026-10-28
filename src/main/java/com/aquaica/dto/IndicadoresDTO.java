package com.aquaica.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/** Indicadores para el personal. Los datos de prueba solo entran si se pide (incluirPrueba). */
public record IndicadoresDTO(
        boolean incluirPrueba,
        int meses,
        Generales generales,
        Incidencias incidencias,
        Facturacion facturacion,
        Consumo consumo) {

    public record Generales(
            long clientes,
            long suministros,
            long medidoresActivos,
            long lecturasPendientesMes,
            long sinLecturaInicial,
            Map<String, Long> solicitudesPorEstado) {
    }

    public record PuntoMensual(String periodo, long valor) {
    }

    public record Incidencias(
            long total,
            long abiertas,
            Map<String, Long> porEstado,
            Map<String, Long> porTipo,
            List<PuntoMensual> porMes,
            Double horasPromedioResolucion) {
    }

    public record FacturacionMes(String periodo, BigDecimal facturado, BigDecimal cobrado) {
    }

    public record Facturacion(
            BigDecimal facturado,
            BigDecimal cobrado,
            BigDecimal porCobrar,
            BigDecimal vencido,
            double morosidadPct,
            long recibos,
            long recibosPagados,
            List<FacturacionMes> porMes) {
    }

    public record ConsumoMes(String periodo, BigDecimal m3, long medidores) {
    }

    public record TopConsumo(String codigoSuministro, String direccion, String cliente, BigDecimal m3) {
    }

    public record Consumo(
            BigDecimal totalM3,
            BigDecimal promedioMensualPorSuministro,
            String periodoTop,
            List<ConsumoMes> porMes,
            List<TopConsumo> top) {
    }
}
