package com.aquaica.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.ReciboDTO;
import com.aquaica.dto.ResumenGeneracionDTO;
import com.aquaica.entity.Lectura;
import com.aquaica.entity.Recibo;
import com.aquaica.entity.Suministro;
import com.aquaica.entity.Tarifa;
import com.aquaica.repository.LecturaRepository;
import com.aquaica.repository.ReciboRepository;
import com.aquaica.repository.UsuarioRepository;

/**
 * Facturación: un recibo por suministro y mes, calculado desde una lectura.
 * total = cargo fijo + consumo (m³) × precio por m³, con la tarifa vigente el día de la emisión.
 * Una lectura REAL da un recibo normal; una SIMULADA da un recibo DE PRUEBA.
 */
@Service
public class ReciboService {

    public static final String PENDIENTE = "PENDIENTE";
    public static final String PAGADO = "PAGADO";
    public static final String ANULADO = "ANULADO";

    private static final int DIAS_VENCIMIENTO = 15;

    private final ReciboRepository reciboRepository;
    private final LecturaRepository lecturaRepository;
    private final TarifaService tarifaService;
    private final UsuarioRepository usuarioRepository;

    public ReciboService(
            ReciboRepository reciboRepository,
            LecturaRepository lecturaRepository,
            TarifaService tarifaService,
            UsuarioRepository usuarioRepository) {

        this.reciboRepository = reciboRepository;
        this.lecturaRepository = lecturaRepository;
        this.tarifaService = tarifaService;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<ReciboDTO> listar() {
        return reciboRepository.findAllByOrderByIdDesc().stream().map(ReciboDTO::de).toList();
    }

    @Transactional(readOnly = true)
    public ReciboDTO obtener(Long id) {
        return ReciboDTO.de(buscar(id));
    }

    /** Genera los recibos de todas las lecturas del mes que aún no se facturaron. */
    @Transactional
    public ResumenGeneracionDTO generarDelPeriodo(String periodoTexto, Long usuarioId) {

        YearMonth mes;

        try {
            mes = YearMonth.parse(periodoTexto);
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("Periodo no válido. Usa el formato AAAA-MM.");
        }

        LocalDate hoy = LocalDate.now();

        List<Lectura> lecturas = lecturaRepository.findByPeriodoAndEstadoAndOrigenNot(
                mes.atDay(1), LecturaService.VALIDA, LecturaService.INICIAL);

        int generados = 0;
        int dePrueba = 0;
        int yaFacturados = 0;
        int sinTarifa = 0;
        Set<String> categoriasSinTarifa = new LinkedHashSet<>();

        for (Lectura lectura : lecturas) {

            Suministro suministro = lectura.getMedidor().getSuministro();

            if (yaFacturada(lectura, suministro)) {
                yaFacturados++;
                continue;
            }

            if (tarifaService.vigenteEn(suministro.getCategoria(), hoy).isEmpty()) {
                sinTarifa++;
                categoriasSinTarifa.add(suministro.getCategoria());
                continue;
            }

            Recibo recibo = crearRecibo(lectura, usuarioId, hoy);
            generados++;

            if (recibo.isDePrueba()) {
                dePrueba++;
            }
        }

        List<String> avisos = new ArrayList<>();

        if (lecturas.isEmpty()) {
            avisos.add("No hay lecturas de ese periodo para facturar.");
        }

        if (!categoriasSinTarifa.isEmpty()) {
            avisos.add("Sin tarifa vigente para: " + String.join(", ", categoriasSinTarifa)
                    + ". Créala en Tarifas y vuelve a generar.");
        }

        return new ResumenGeneracionDTO(
                mes.toString(), generados, dePrueba, yaFacturados, sinTarifa, avisos);
    }

    /** Genera el recibo de una lectura puntual. */
    @Transactional
    public ReciboDTO generarDeLectura(Long lecturaId, Long usuarioId) {

        Lectura lectura = lecturaRepository.findById(lecturaId)
                .orElseThrow(() -> new IllegalArgumentException("Lectura no encontrada."));

        if (LecturaService.ANULADA.equals(lectura.getEstado())) {
            throw new IllegalArgumentException("No se puede facturar una lectura anulada.");
        }

        if (LecturaService.INICIAL.equals(lectura.getOrigen())) {
            throw new IllegalArgumentException(
                    "La lectura inicial no genera recibo: es solo la base del consumo.");
        }

        Optional<Recibo> existente =
                reciboRepository.findFirstByLecturaIdAndEstadoNot(lecturaId, ANULADO);

        if (existente.isPresent()) {
            throw new IllegalArgumentException(
                    "Esta lectura ya tiene el recibo " + existente.get().getCodigo() + ".");
        }

        Suministro suministro = lectura.getMedidor().getSuministro();

        if (reciboRepository.existsBySuministroIdAndPeriodoAndEstadoNot(
                suministro.getId(), lectura.getPeriodo(), ANULADO)) {
            throw new IllegalArgumentException("El suministro ya tiene un recibo de ese periodo.");
        }

        return ReciboDTO.de(crearRecibo(lectura, usuarioId, LocalDate.now()));
    }

    /** Anula un recibo pendiente (queda registrado quién y por qué) y libera la lectura. */
    @Transactional
    public ReciboDTO anular(Long id, String motivo, Long usuarioId) {

        Recibo recibo = buscar(id);

        if (PAGADO.equals(recibo.getEstado())) {
            throw new IllegalArgumentException("No se puede anular un recibo que ya fue pagado.");
        }

        if (ANULADO.equals(recibo.getEstado())) {
            throw new IllegalArgumentException("El recibo ya está anulado.");
        }

        if (motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException("Indica el motivo de la anulación.");
        }

        if (motivo.trim().length() > 255) {
            throw new IllegalArgumentException("El motivo no puede superar los 255 caracteres.");
        }

        if (usuarioId == null) {
            throw new IllegalArgumentException("No se pudo identificar quién anula el recibo.");
        }

        recibo.setEstado(ANULADO);
        recibo.setAnuladoPor(usuarioRepository.getReferenceById(usuarioId));
        recibo.setFechaAnulacion(LocalDateTime.now());
        recibo.setMotivoAnulacion(motivo.trim());

        return ReciboDTO.de(reciboRepository.save(recibo));
    }

    // ---------------------------------------------------------------

    private boolean yaFacturada(Lectura lectura, Suministro suministro) {
        return reciboRepository.existsByLecturaIdAndEstadoNot(lectura.getId(), ANULADO)
                || reciboRepository.existsBySuministroIdAndPeriodoAndEstadoNot(
                        suministro.getId(), lectura.getPeriodo(), ANULADO);
    }

    private Recibo crearRecibo(Lectura lectura, Long usuarioId, LocalDate hoy) {

        Suministro suministro = lectura.getMedidor().getSuministro();

        Tarifa tarifa = tarifaService.vigenteEn(suministro.getCategoria(), hoy)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No hay tarifa vigente para la categoría " + suministro.getCategoria()
                        + ". Créala en Tarifas."));

        BigDecimal consumo = lectura.getConsumoM3();
        BigDecimal importe = consumo.multiply(tarifa.getPrecioM3()).setScale(2, RoundingMode.HALF_UP);

        Recibo recibo = new Recibo();
        // Código temporal: el definitivo se deriva del id generado.
        recibo.setCodigo("TMP-" + Math.abs(System.nanoTime() % 1_000_000_000_000L));
        recibo.setSuministro(suministro);
        recibo.setLectura(lectura);
        recibo.setTarifa(tarifa);
        recibo.setPeriodo(lectura.getPeriodo());
        recibo.setConsumoM3(consumo);
        recibo.setCategoria(suministro.getCategoria());
        recibo.setCargoFijo(tarifa.getCargoFijo());
        recibo.setPrecioM3(tarifa.getPrecioM3());
        recibo.setImporteConsumo(importe);
        recibo.setTotal(tarifa.getCargoFijo().add(importe));
        recibo.setDePrueba(LecturaService.SIMULADA.equals(lectura.getOrigen()));
        recibo.setEstado(PENDIENTE);
        recibo.setFechaEmision(hoy);
        recibo.setFechaVencimiento(hoy.plusDays(DIAS_VENCIMIENTO));

        if (usuarioId != null) {
            recibo.setGeneradoPor(usuarioRepository.getReferenceById(usuarioId));
        }

        Recibo guardado = reciboRepository.save(recibo);
        guardado.setCodigo(String.format("REC-%d-%06d", hoy.getYear(), guardado.getId()));

        return reciboRepository.save(guardado);
    }

    private Recibo buscar(Long id) {
        return reciboRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recibo no encontrado."));
    }
}
