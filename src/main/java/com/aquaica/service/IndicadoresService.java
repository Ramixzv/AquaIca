package com.aquaica.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.IndicadoresDTO;
import com.aquaica.dto.IndicadoresDTO.Consumo;
import com.aquaica.dto.IndicadoresDTO.ConsumoMes;
import com.aquaica.dto.IndicadoresDTO.Facturacion;
import com.aquaica.dto.IndicadoresDTO.FacturacionMes;
import com.aquaica.dto.IndicadoresDTO.Generales;
import com.aquaica.dto.IndicadoresDTO.Incidencias;
import com.aquaica.dto.IndicadoresDTO.PuntoMensual;
import com.aquaica.dto.IndicadoresDTO.TopConsumo;
import com.aquaica.entity.Lectura;
import com.aquaica.entity.Medidor;
import com.aquaica.entity.Recibo;
import com.aquaica.entity.Reporte;
import com.aquaica.entity.Seguimiento;
import com.aquaica.entity.SolicitudServicio;
import com.aquaica.repository.ClienteRepository;
import com.aquaica.repository.LecturaRepository;
import com.aquaica.repository.MedidorRepository;
import com.aquaica.repository.ReciboRepository;
import com.aquaica.repository.ReporteRepository;
import com.aquaica.repository.SeguimientoRepository;
import com.aquaica.repository.SolicitudServicioRepository;
import com.aquaica.repository.SuministroRepository;

/**
 * Cálculo de indicadores. Trabaja en memoria sobre findAll(): suficiente para el tamaño
 * de este sistema; si crece mucho, conviene pasar estas sumas a consultas SQL agrupadas.
 * Facturado y cobrado se agrupan por el MES FACTURADO (el periodo del recibo).
 */
@Service
public class IndicadoresService {

    private static final Set<String> REPORTES_CERRADOS = Set.of("RESUELTO", "NO_RESUELTO");

    private final ClienteRepository clienteRepository;
    private final SuministroRepository suministroRepository;
    private final MedidorRepository medidorRepository;
    private final SolicitudServicioRepository solicitudRepository;
    private final ReporteRepository reporteRepository;
    private final SeguimientoRepository seguimientoRepository;
    private final LecturaRepository lecturaRepository;
    private final ReciboRepository reciboRepository;

    public IndicadoresService(
            ClienteRepository clienteRepository,
            SuministroRepository suministroRepository,
            MedidorRepository medidorRepository,
            SolicitudServicioRepository solicitudRepository,
            ReporteRepository reporteRepository,
            SeguimientoRepository seguimientoRepository,
            LecturaRepository lecturaRepository,
            ReciboRepository reciboRepository) {

        this.clienteRepository = clienteRepository;
        this.suministroRepository = suministroRepository;
        this.medidorRepository = medidorRepository;
        this.solicitudRepository = solicitudRepository;
        this.reporteRepository = reporteRepository;
        this.seguimientoRepository = seguimientoRepository;
        this.lecturaRepository = lecturaRepository;
        this.reciboRepository = reciboRepository;
    }

    @Transactional(readOnly = true)
    public IndicadoresDTO calcular(int mesesPedidos, boolean incluirPrueba) {

        int meses = (mesesPedidos == 3 || mesesPedidos == 12) ? mesesPedidos : 6;
        YearMonth hoy = YearMonth.now();

        List<Lectura> lecturas = lecturaRepository.findAll().stream()
                .filter(l -> LecturaService.VALIDA.equals(l.getEstado())
                        && !LecturaService.INICIAL.equals(l.getOrigen()))
                .filter(l -> incluirPrueba || !LecturaService.SIMULADA.equals(l.getOrigen()))
                .toList();

        List<Recibo> recibos = reciboRepository.findAll().stream()
                .filter(r -> !ReciboService.ANULADO.equals(r.getEstado()))
                .filter(r -> incluirPrueba || !r.isDePrueba())
                .toList();

        // La ventana termina en el mes actual; con datos de prueba se extiende hasta
        // el último mes que tenga datos (las simuladas pueden estar en meses futuros).
        YearMonth fin = hoy;

        if (incluirPrueba) {
            for (Lectura l : lecturas) {
                YearMonth m = YearMonth.from(l.getPeriodo());
                if (m.isAfter(fin)) fin = m;
            }
            for (Recibo r : recibos) {
                YearMonth m = YearMonth.from(r.getPeriodo());
                if (m.isAfter(fin)) fin = m;
            }
            if (fin.isAfter(hoy.plusMonths(24))) fin = hoy.plusMonths(24);
        }

        List<YearMonth> ventana = new ArrayList<>();
        for (int i = meses - 1; i >= 0; i--) {
            ventana.add(fin.minusMonths(i));
        }
        Set<YearMonth> enVentana = new HashSet<>(ventana);

        return new IndicadoresDTO(
                incluirPrueba,
                meses,
                generales(hoy),
                incidencias(ventana),
                facturacion(recibos, ventana, enVentana),
                consumo(lecturas, ventana, enVentana));
    }

    // ---------------------------------------------------------------

    private Generales generales(YearMonth hoy) {

        long activos = 0;
        long pendientes = 0;
        long sinInicial = 0;

        for (Medidor medidor : medidorRepository.findAll()) {

            if (!"ACTIVO".equals(medidor.getEstado())) {
                continue;
            }

            activos++;

            Optional<Lectura> ultima = lecturaRepository.ultimaValida(medidor.getId());

            if (ultima.isEmpty()) {
                sinInicial++;
            } else if (!LecturaService.SIMULADA.equals(ultima.get().getOrigen())
                    && !YearMonth.from(ultima.get().getPeriodo()).equals(hoy)) {
                pendientes++;
            }
        }

        Map<String, Long> solicitudes = solicitudRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        SolicitudServicio::getEstado, TreeMap::new, Collectors.counting()));

        return new Generales(
                clienteRepository.count(),
                suministroRepository.count(),
                activos,
                pendientes,
                sinInicial,
                solicitudes);
    }

    private Incidencias incidencias(List<YearMonth> ventana) {

        List<Reporte> reportes = reporteRepository.findAll();

        Map<String, Long> porEstado = reportes.stream().collect(
                Collectors.groupingBy(Reporte::getEstado, TreeMap::new, Collectors.counting()));

        Map<String, Long> porTipo = reportes.stream().collect(
                Collectors.groupingBy(Reporte::getTipoProblema, TreeMap::new, Collectors.counting()));

        long abiertas = reportes.stream()
                .filter(r -> !REPORTES_CERRADOS.contains(r.getEstado())).count();

        List<PuntoMensual> porMes = new ArrayList<>();

        for (YearMonth mes : ventana) {
            long cantidad = reportes.stream()
                    .filter(r -> YearMonth.from(r.getFechaCreacion()).equals(mes)).count();
            porMes.add(new PuntoMensual(mes.toString(), cantidad));
        }

        // Tiempo promedio hasta la primera vez que el reporte quedó RESUELTO
        Map<Long, LocalDateTime> resueltoEn = new HashMap<>();

        for (Seguimiento seguimiento : seguimientoRepository.findAll()) {
            if ("RESUELTO".equals(seguimiento.getEstado())) {
                resueltoEn.merge(seguimiento.getReporte().getId(), seguimiento.getFechaCreacion(),
                        (a, b) -> a.isBefore(b) ? a : b);
            }
        }

        double minutos = 0;
        int resueltos = 0;

        for (Reporte reporte : reportes) {
            LocalDateTime resuelto = resueltoEn.get(reporte.getId());
            if (resuelto != null && !resuelto.isBefore(reporte.getFechaCreacion())) {
                minutos += Duration.between(reporte.getFechaCreacion(), resuelto).toMinutes();
                resueltos++;
            }
        }

        Double horas = resueltos == 0 ? null : Math.round(minutos / resueltos / 60.0 * 10) / 10.0;

        return new Incidencias(reportes.size(), abiertas, porEstado, porTipo, porMes, horas);
    }

    private Facturacion facturacion(
            List<Recibo> recibos, List<YearMonth> ventana, Set<YearMonth> enVentana) {

        List<Recibo> enRango = recibos.stream()
                .filter(r -> enVentana.contains(YearMonth.from(r.getPeriodo()))).toList();

        LocalDate hoy = LocalDate.now();

        Predicate<Recibo> pagado = r -> ReciboService.PAGADO.equals(r.getEstado());
        Predicate<Recibo> pendiente = r -> ReciboService.PENDIENTE.equals(r.getEstado());
        Predicate<Recibo> vencido = r -> pendiente.test(r) && r.getFechaVencimiento().isBefore(hoy);

        BigDecimal facturado = sumar(enRango, r -> true);
        BigDecimal cobrado = sumar(enRango, pagado);
        BigDecimal montoVencido = sumar(enRango, vencido);
        BigDecimal porCobrar = sumar(enRango, pendiente).subtract(montoVencido);

        double morosidad = facturado.signum() == 0 ? 0
                : montoVencido.multiply(BigDecimal.valueOf(100))
                        .divide(facturado, 1, RoundingMode.HALF_UP).doubleValue();

        List<FacturacionMes> porMes = new ArrayList<>();

        for (YearMonth mes : ventana) {
            List<Recibo> delMes = enRango.stream()
                    .filter(r -> YearMonth.from(r.getPeriodo()).equals(mes)).toList();
            porMes.add(new FacturacionMes(mes.toString(), sumar(delMes, r -> true), sumar(delMes, pagado)));
        }

        return new Facturacion(
                facturado, cobrado, porCobrar, montoVencido, morosidad,
                enRango.size(), enRango.stream().filter(pagado).count(), porMes);
    }

    private Consumo consumo(
            List<Lectura> lecturas, List<YearMonth> ventana, Set<YearMonth> enVentana) {

        List<Lectura> enRango = lecturas.stream()
                .filter(l -> enVentana.contains(YearMonth.from(l.getPeriodo()))).toList();

        BigDecimal total = enRango.stream()
                .map(Lectura::getConsumoM3).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal promedio = enRango.isEmpty() ? BigDecimal.ZERO
                : total.divide(BigDecimal.valueOf(enRango.size()), 2, RoundingMode.HALF_UP);

        List<ConsumoMes> porMes = new ArrayList<>();
        String periodoTop = null;

        for (YearMonth mes : ventana) {

            List<Lectura> delMes = enRango.stream()
                    .filter(l -> YearMonth.from(l.getPeriodo()).equals(mes)).toList();

            BigDecimal m3 = delMes.stream()
                    .map(Lectura::getConsumoM3).reduce(BigDecimal.ZERO, BigDecimal::add);

            long medidores = delMes.stream().map(l -> l.getMedidor().getId()).distinct().count();

            porMes.add(new ConsumoMes(mes.toString(), m3, medidores));

            if (!delMes.isEmpty()) {
                periodoTop = mes.toString();
            }
        }

        List<TopConsumo> top = new ArrayList<>();

        if (periodoTop != null) {

            YearMonth mesTop = YearMonth.parse(periodoTop);

            enRango.stream()
                    .filter(l -> YearMonth.from(l.getPeriodo()).equals(mesTop))
                    .sorted(Comparator.comparing(Lectura::getConsumoM3).reversed())
                    .limit(5)
                    .forEach(l -> top.add(new TopConsumo(
                            l.getMedidor().getSuministro().getCodigoSuministro(),
                            l.getMedidor().getSuministro().getDireccion(),
                            l.getMedidor().getSuministro().getCliente() != null
                                    ? l.getMedidor().getSuministro().getCliente().getNombreCompleto() : null,
                            l.getConsumoM3())));
        }

        return new Consumo(total, promedio, periodoTop, porMes, top);
    }

    private BigDecimal sumar(List<Recibo> recibos, Predicate<Recibo> condicion) {
        return recibos.stream().filter(condicion)
                .map(Recibo::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
