package com.aquaica.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.LecturaDTO;
import com.aquaica.dto.MedidorLecturaResumenDTO;
import com.aquaica.entity.Lectura;
import com.aquaica.entity.Medidor;
import com.aquaica.repository.LecturaRepository;
import com.aquaica.repository.ReciboRepository;
import com.aquaica.repository.UsuarioRepository;

/**
 * Lecturas acumuladas de los medidores y su consumo (m³).
 *
 * Reglas:
 *  - Solo recibe la lectura ACTUAL: la anterior sale de la última lectura del
 *    medidor y el consumo (actual - anterior) lo calcula este servicio.
 *  - La primera lectura de un medidor es su punto de partida (INICIAL, consumo 0).
 *  - La lectura nunca puede bajar, ni la fecha retroceder, ni ser futura.
 *  - Una sola lectura por medidor y por mes (la INICIAL no cuenta).
 *  - Solo los medidores ACTIVOS reciben lecturas.
 */
@Service
public class LecturaService {

    public static final String INICIAL = "INICIAL";
    public static final String MANUAL = "MANUAL";
    public static final String SIMULADA = "SIMULADA";
    public static final String VALIDA = "VALIDA";
    public static final String ANULADA = "ANULADA";

    /** Tope de consumo por periodo (m³): evita errores de digitación. */
    public static final BigDecimal CONSUMO_MAXIMO = new BigDecimal("1000");

    private static final BigDecimal LECTURA_MAXIMA = new BigDecimal("999999999.999");
    private static final int ESCALA = 3;

    private final LecturaRepository lecturaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ReciboRepository reciboRepository;

    public LecturaService(
            LecturaRepository lecturaRepository,
            UsuarioRepository usuarioRepository,
            ReciboRepository reciboRepository) {
        this.lecturaRepository = lecturaRepository;
        this.usuarioRepository = usuarioRepository;
        this.reciboRepository = reciboRepository;
    }

    // ---------------------------------------------------------------
    // Consultas
    // ---------------------------------------------------------------

    /** Medidores activos con su última lectura (pantalla de lecturas). */
    @Transactional(readOnly = true)
    public List<MedidorLecturaResumenDTO> resumenMedidoresActivos() {
        Map<Long, Lectura> ultimas = new HashMap<>();

        for (Lectura lectura : lecturaRepository.ultimasPorMedidor()) {
            ultimas.put(lectura.getMedidor().getId(), lectura);
        }

        return lecturaRepository.medidoresActivos().stream()
                .map(medidor -> MedidorLecturaResumenDTO.de(
                        medidor, ultimas.get(medidor.getId())))
                .toList();
    }

    /** Historial de un medidor, de la más reciente a la más antigua. */
    @Transactional(readOnly = true)
    public List<LecturaDTO> listarPorMedidor(Long medidorId) {
        exigirMedidor(medidorId);
        return lecturaRepository.listarPorMedidor(medidorId).stream()
                .map(LecturaDTO::de).toList();
    }

    /** Lecturas de todos los medidores que ha tenido un suministro. */
    @Transactional(readOnly = true)
    public List<LecturaDTO> listarPorSuministro(Long suministroId) {
        return lecturaRepository.listarPorSuministro(suministroId).stream()
                .map(LecturaDTO::de).toList();
    }

    @Transactional(readOnly = true)
    public LecturaDTO ultimaDelMedidor(Long medidorId) {
        exigirMedidor(medidorId);
        return lecturaRepository.ultimaValida(medidorId)
                .map(LecturaDTO::de)
                .orElseThrow(() -> new IllegalArgumentException(
                        "El medidor todavía no tiene lecturas."));
    }

    // ---------------------------------------------------------------
    // Registro
    // ---------------------------------------------------------------

    /**
     * Registro manual (ADMIN, SOPORTE, TECNICO). Si el medidor no tenía
     * lecturas, esta queda como lectura INICIAL (consumo 0).
     */
    @Transactional
    public LecturaDTO registrarManual(
            Long medidorId,
            BigDecimal lecturaActual,
            LocalDate fechaLectura,
            String observacion,
            Long usuarioId) {

        if (medidorId == null) {
            throw new IllegalArgumentException("Debes indicar el medidor.");
        }

        Medidor medidor = bloquear(medidorId);

        return LecturaDTO.de(agregar(
                medidor, lecturaActual, fechaLectura, MANUAL, observacion, usuarioId));
    }

    /**
     * Uso interno (lo llamará la instalación del medidor): deja la lectura
     * inicial como punto de partida. Falla si el medidor ya tiene lecturas.
     */
    @Transactional
    public Lectura registrarInicial(
            Medidor medidor,
            BigDecimal lecturaInicial,
            LocalDate fecha,
            Long usuarioId) {

        Medidor bloqueado = bloquear(medidor.getId());

        return agregar(bloqueado, lecturaInicial, fecha, INICIAL,
                "Lectura inicial al instalar el medidor", usuarioId);
    }

    // ---------------------------------------------------------------
    // Datos de prueba (solo ADMIN, lo valida SecurityConfig)
    // ---------------------------------------------------------------

    public static final int MESES_SIMULACION_MAXIMO = 12;
    private static final int MESES_FUTURO_MAXIMO = 24;

    /**
     * Genera lecturas mensuales SIMULADAS a continuación de la última del medidor.
     * Una instalación nueva no tiene meses pasados, así que las fechas avanzan en el
     * tiempo (pueden ser futuras, hasta 24 meses desde hoy). Nunca son facturables.
     */
    @Transactional
    public List<LecturaDTO> simularConsumo(Long medidorId, int meses, Long usuarioId) {

        if (medidorId == null) {
            throw new IllegalArgumentException("Debes indicar el medidor.");
        }

        if (meses < 1 || meses > MESES_SIMULACION_MAXIMO) {
            throw new IllegalArgumentException(
                    "Los meses a simular deben estar entre 1 y " + MESES_SIMULACION_MAXIMO + ".");
        }

        Medidor medidor = bloquear(medidorId);

        Lectura ultima = lecturaRepository.ultimaValida(medidor.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "El medidor no tiene lectura inicial: todavía no se puede "
                        + "simular consumo."));

        LocalDate limite = LocalDate.now().plusMonths(MESES_FUTURO_MAXIMO);
        ThreadLocalRandom azar = ThreadLocalRandom.current();

        // Consumo base de la vivienda (9 a 23 m³ al mes) con ±20 % de variación mensual
        double base = 9 + azar.nextDouble() * 14;
        BigDecimal acumulado = ultima.getLecturaActual();
        List<LecturaDTO> generadas = new ArrayList<>();

        for (int i = 1; i <= meses; i++) {

            LocalDate fecha = ultima.getFechaLectura().plusMonths(i);

            if (fecha.isAfter(limite)) {
                throw new IllegalArgumentException(
                        "No se puede simular más allá de " + MESES_FUTURO_MAXIMO
                        + " meses desde hoy. Borra las simuladas o genera menos meses.");
            }

            double factor = 0.8 + azar.nextDouble() * 0.4;
            acumulado = acumulado.add(
                    BigDecimal.valueOf(base * factor).setScale(2, RoundingMode.HALF_UP));

            generadas.add(LecturaDTO.de(agregar(
                    medidor, acumulado, fecha, SIMULADA,
                    "Consumo simulado (datos de prueba)", usuarioId)));
        }

        return generadas;
    }

    /** Borra las lecturas simuladas de un medidor. Devuelve cuántas eliminó. */
    @Transactional
    public long borrarSimuladas(Long medidorId) {
        exigirMedidor(medidorId);
        bloquear(medidorId);
        reciboRepository.eliminarDePruebaPorMedidor(medidorId);
        return lecturaRepository.deleteByMedidorIdAndOrigen(medidorId, SIMULADA);
    }

    /** Borra todas las lecturas simuladas del sistema (limpieza antes de la demo). */
    @Transactional
    public long borrarTodasLasSimuladas() {
        reciboRepository.eliminarTodosDePrueba();
        return lecturaRepository.deleteByOrigen(SIMULADA);
    }

    /**
     * Anula una lectura equivocada: queda en el historial con quién la anuló, cuándo y por qué.
     * Solo la ÚLTIMA válida del medidor y nunca la inicial, para no romper la cadena
     * anterior -> actual. Las SIMULADAS son datos de prueba y se eliminan directamente.
     */
    @Transactional
    public void anular(Long lecturaId, String motivo, Long usuarioId) {

        Lectura lectura = lecturaRepository.findById(lecturaId)
                .orElseThrow(() -> new IllegalArgumentException("Lectura no encontrada."));

        if (ANULADA.equals(lectura.getEstado())) {
            throw new IllegalArgumentException("Esa lectura ya está anulada.");
        }

        if (INICIAL.equals(lectura.getOrigen())) {
            throw new IllegalArgumentException("La lectura inicial no se puede anular.");
        }

        bloquear(lectura.getMedidor().getId());

        Lectura ultima = lecturaRepository.ultimaValida(lectura.getMedidor().getId())
                .orElseThrow(() -> new IllegalArgumentException("Lectura no encontrada."));

        if (!ultima.getId().equals(lectura.getId())) {
            throw new IllegalArgumentException(
                    "Solo se puede anular la última lectura del medidor. "
                    + "Anula primero las más recientes.");
        }

        if (SIMULADA.equals(lectura.getOrigen())) {
            // Datos de prueba: se eliminan junto con su recibo DE PRUEBA, si lo tiene.
            reciboRepository.eliminarDePruebaPorLectura(lectura.getId());
            lecturaRepository.delete(lectura);
            return;
        }

        if (reciboRepository.existsByLecturaIdAndEstadoNot(lectura.getId(), "ANULADO")) {
            throw new IllegalArgumentException(
                    "Esta lectura ya tiene un recibo. Anula primero el recibo para poder "
                    + "anular la lectura.");
        }

        if (motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException("Indica el motivo de la anulación.");
        }

        if (motivo.trim().length() > 255) {
            throw new IllegalArgumentException("El motivo no puede superar los 255 caracteres.");
        }

        if (usuarioId == null) {
            throw new IllegalArgumentException("No se pudo identificar quién anula la lectura.");
        }

        lectura.setEstado(ANULADA);
        lectura.setAnuladaPor(usuarioRepository.getReferenceById(usuarioId));
        lectura.setFechaAnulacion(LocalDateTime.now());
        lectura.setMotivoAnulacion(motivo.trim());
        lecturaRepository.save(lectura);
    }

    // ---------------------------------------------------------------
    // Núcleo: valida y encadena la lectura con la anterior
    // ---------------------------------------------------------------

    private Lectura agregar(
            Medidor medidor,
            BigDecimal valorIngresado,
            LocalDate fecha,
            String origen,
            String observacion,
            Long usuarioId) {

        if (!MedidorService.ACTIVO.equals(medidor.getEstado())) {
            throw new IllegalArgumentException(
                    "Solo se pueden registrar lecturas en medidores activos.");
        }

        BigDecimal actual = normalizarLectura(valorIngresado);

        LocalDate hoy = LocalDate.now();
        LocalDate fechaLectura = fecha != null ? fecha : hoy;

        if (fechaLectura.isAfter(hoy) && !SIMULADA.equals(origen)) {
            throw new IllegalArgumentException(
                    "La fecha de la lectura no puede ser futura.");
        }

        if (fechaLectura.isBefore(medidor.getFechaInstalacion())) {
            throw new IllegalArgumentException(
                    "La fecha de la lectura no puede ser anterior a la instalación "
                    + "del medidor (" + medidor.getFechaInstalacion() + ").");
        }

        Optional<Lectura> previa =
                lecturaRepository.ultimaValida(medidor.getId());

        Lectura nueva = new Lectura();
        nueva.setMedidor(medidor);
        nueva.setPeriodo(fechaLectura.withDayOfMonth(1));
        nueva.setLecturaActual(actual);
        nueva.setFechaLectura(fechaLectura);
        nueva.setObservacion(normalizarObservacion(observacion));

        if (usuarioId != null) {
            nueva.setRegistradoPor(usuarioRepository.getReferenceById(usuarioId));
        }

        // Primera lectura del medidor: punto de partida, consumo 0.
        if (previa.isEmpty()) {

            if (SIMULADA.equals(origen)) {
                throw new IllegalArgumentException(
                        "El medidor no tiene lectura inicial: todavía no se puede "
                        + "simular consumo.");
            }

            nueva.setOrigen(INICIAL);
            nueva.setLecturaAnterior(actual);
            nueva.setFechaLecturaAnterior(fechaLectura);
            nueva.setConsumoM3(BigDecimal.ZERO.setScale(ESCALA));

            return lecturaRepository.save(nueva);
        }

        if (INICIAL.equals(origen)) {
            throw new IllegalArgumentException(
                    "El medidor ya tiene lecturas: la lectura inicial se registra "
                    + "una sola vez.");
        }

        Lectura anterior = previa.get();
        if (SIMULADA.equals(anterior.getOrigen()) && !SIMULADA.equals(origen)) {
            throw new IllegalArgumentException(
                    "Este medidor tiene lecturas simuladas. Bórralas antes de "
                    + "registrar lecturas reales.");
        }

        if (actual.compareTo(anterior.getLecturaActual()) < 0) {
            throw new IllegalArgumentException(
                    "La lectura (" + actual.toPlainString() + " m³) no puede ser menor "
                    + "que la anterior (" + anterior.getLecturaActual().toPlainString()
                    + " m³ del " + anterior.getFechaLectura() + "). Revisa el valor.");
        }

        if (fechaLectura.isBefore(anterior.getFechaLectura())) {
            throw new IllegalArgumentException(
                    "La fecha no puede ser anterior a la última lectura ("
                    + anterior.getFechaLectura() + ").");
        }

        BigDecimal consumo = actual.subtract(anterior.getLecturaActual());

        if (consumo.compareTo(CONSUMO_MAXIMO) > 0) {
            throw new IllegalArgumentException(
                    "El consumo del periodo (" + consumo.toPlainString() + " m³) supera "
                    + "el máximo permitido de " + CONSUMO_MAXIMO.toPlainString()
                    + " m³. Verifica la lectura.");
        }

        if (lecturaRepository.existsByMedidorIdAndPeriodoAndOrigenNotAndEstado(
                medidor.getId(), nueva.getPeriodo(), INICIAL, VALIDA)) {
            throw new IllegalArgumentException(
                    "Ya existe una lectura del periodo " + YearMonth.from(fechaLectura)
                    + " para este medidor. Si fue un error, un administrador puede "
                    + "anular la última lectura.");
        }

        nueva.setOrigen(origen);
        nueva.setLecturaAnterior(anterior.getLecturaActual());
        nueva.setFechaLecturaAnterior(anterior.getFechaLectura());
        nueva.setConsumoM3(consumo);

        return lecturaRepository.save(nueva);
    }

    // ---------------------------------------------------------------
    // Auxiliares
    // ---------------------------------------------------------------

    private Medidor bloquear(Long medidorId) {
        return lecturaRepository.bloquearMedidor(medidorId)
                .orElseThrow(() -> new IllegalArgumentException("Medidor no encontrado."));
    }

    private void exigirMedidor(Long medidorId) {
        if (medidorId == null || !lecturaRepository.medidorExiste(medidorId)) {
            throw new IllegalArgumentException("Medidor no encontrado.");
        }
    }

    private BigDecimal normalizarLectura(BigDecimal valor) {

        if (valor == null) {
            throw new IllegalArgumentException("La lectura actual es obligatoria.");
        }

        BigDecimal normalizado = valor.setScale(ESCALA, RoundingMode.HALF_UP);

        if (normalizado.signum() < 0) {
            throw new IllegalArgumentException("La lectura no puede ser negativa.");
        }

        if (normalizado.compareTo(LECTURA_MAXIMA) > 0) {
            throw new IllegalArgumentException(
                    "La lectura es demasiado grande. Verifica el valor ingresado.");
        }

        return normalizado;
    }

    private String normalizarObservacion(String observacion) {

        if (observacion == null || observacion.isBlank()) {
            return null;
        }

        String texto = observacion.trim();

        if (texto.length() > 255) {
            throw new IllegalArgumentException(
                    "La observación no puede superar los 255 caracteres.");
        }

        return texto;
    }
}