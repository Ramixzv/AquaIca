package com.aquaica.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Set;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.ComprobanteDTO;
import com.aquaica.dto.OrdenInstalacionDTO;
import com.aquaica.entity.Medidor;
import com.aquaica.entity.OrdenInstalacion;
import com.aquaica.entity.Personal;
import com.aquaica.entity.SolicitudServicio;
import com.aquaica.entity.Suministro;
import com.aquaica.repository.MedidorRepository;
import com.aquaica.repository.OrdenInstalacionRepository;
import com.aquaica.repository.PersonalRepository;
import com.aquaica.repository.SolicitudServicioRepository;
import com.aquaica.repository.SuministroRepository;
import com.aquaica.repository.UsuarioRepository;

/**
 * Flujo de instalación posterior a la aprobación de una solicitud:
 * APROBADA (se crea la orden) -> asignar técnico (EN_INSTALACION)
 * -> técnico registra el medidor (ACTIVADA, se crea el suministro).
 */
@Service
public class OrdenInstalacionService {

    public static final String PENDIENTE_ASIGNACION = "PENDIENTE_ASIGNACION";
    public static final String ASIGNADA = "ASIGNADA";
    public static final String COMPLETADA = "COMPLETADA";
    public static final String CANCELADA = "CANCELADA";

    private final OrdenInstalacionRepository ordenRepository;
    private final NotificacionService notificacionService;
    private final SolicitudServicioRepository solicitudRepository;
    private final PersonalRepository personalRepository;
    private final UsuarioRepository usuarioRepository;
    private final SuministroRepository suministroRepository;
    private final MedidorRepository medidorRepository;
    private final SuministroService suministroService;
    private final MedidorService medidorService;
    private final LecturaService lecturaService;

    public OrdenInstalacionService(
            OrdenInstalacionRepository ordenRepository,
            SolicitudServicioRepository solicitudRepository,
            PersonalRepository personalRepository,
            UsuarioRepository usuarioRepository,
            SuministroRepository suministroRepository,
            MedidorRepository medidorRepository,
            SuministroService suministroService,
            MedidorService medidorService,
            LecturaService lecturaService,
            NotificacionService notificacionService) {
        this.notificacionService = notificacionService;

        this.ordenRepository = ordenRepository;
        this.solicitudRepository = solicitudRepository;
        this.personalRepository = personalRepository;
        this.usuarioRepository = usuarioRepository;
        this.suministroRepository = suministroRepository;
        this.medidorRepository = medidorRepository;
        this.suministroService = suministroService;
        this.medidorService = medidorService;
        this.lecturaService = lecturaService;
    }

    // ---------------------------------------------------------------
    // Llamado por SolicitudServicioService al aprobar / cancelar
    // ---------------------------------------------------------------

    /** Crea la orden con su código INST-AAAA-NNNNNN. Si ya existe, la reutiliza. */
    @Transactional
    public OrdenInstalacion crearParaSolicitud(SolicitudServicio solicitud) {

        return ordenRepository.findBySolicitudId(solicitud.getId())
                .orElseGet(() -> {

                    OrdenInstalacion orden = new OrdenInstalacion();
                    orden.setSolicitud(solicitud);
                    orden.setEstado(PENDIENTE_ASIGNACION);
                    // Código temporal: el definitivo se deriva del id generado.
                    orden.setCodigo("TMP-" + Math.abs(System.nanoTime() % 1_000_000_000_000L));

                    OrdenInstalacion guardada = ordenRepository.save(orden);
                    guardada.setCodigo(String.format(
                            "INST-%d-%06d", Year.now().getValue(), guardada.getId()));

                    return ordenRepository.save(guardada);
                });
    }

    /** Si la solicitud se cancela, la orden pendiente también se cancela. */
    @Transactional
    public void cancelarPorSolicitud(Long solicitudId) {

        ordenRepository.findBySolicitudId(solicitudId).ifPresent(orden -> {
            if (!COMPLETADA.equals(orden.getEstado())) {
                orden.setEstado(CANCELADA);
                ordenRepository.save(orden);
            }
        });
    }

    // ---------------------------------------------------------------
    // ADMIN / SOPORTE
    // ---------------------------------------------------------------

    @Transactional
    public OrdenInstalacionDTO asignar(
            Long ordenId,
            Long tecnicoId,
            LocalDateTime fechaProgramada) {

        OrdenInstalacion orden = buscar(ordenId);

        if (!Set.of(PENDIENTE_ASIGNACION, ASIGNADA).contains(orden.getEstado())) {
            throw new IllegalArgumentException(
                    "Solo se puede asignar técnico a órdenes pendientes o ya asignadas.");
        }

        if (tecnicoId == null) {
            throw new IllegalArgumentException("Debes elegir un técnico.");
        }

        Personal tecnico = personalRepository.findById(tecnicoId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "El técnico indicado no existe."));

        if (!"ACTIVO".equalsIgnoreCase(tecnico.getEstado())) {
            throw new IllegalArgumentException("El técnico seleccionado no está activo.");
        }

        boolean esTecnico = usuarioRepository.findByPersonalId(tecnicoId)
                .map(usuario -> "TECNICO".equals(usuario.getRol()))
                .orElse(false);

        if (!esTecnico) {
            throw new IllegalArgumentException(
                    "La persona seleccionada no tiene el rol de técnico.");
        }

        if (fechaProgramada != null
                && fechaProgramada.isBefore(LocalDateTime.now().minusMinutes(5))) {
            throw new IllegalArgumentException(
                    "La fecha de la visita no puede estar en el pasado.");
        }

        SolicitudServicio solicitud = orden.getSolicitud();

        if (!Set.of("APROBADA", "EN_INSTALACION").contains(solicitud.getEstado())) {
            throw new IllegalArgumentException(
                    "La solicitud no está en un estado que permita asignar la instalación.");
        }

        orden.setTecnico(tecnico);
        orden.setFechaProgramada(fechaProgramada);
        orden.setEstado(ASIGNADA);

        solicitud.setEstado("EN_INSTALACION");
        solicitudRepository.save(solicitud);

        OrdenInstalacion guardada = ordenRepository.save(orden);

        String cuando = fechaProgramada != null
                ? "Visita programada: " + fechaProgramada.toString().replace('T', ' ') + "."
                : "La fecha de la visita aún no está confirmada.";

        notificacionService.notificarCliente(
                solicitud.getCliente().getId(), NotificacionService.INSTALACION,
                "Tu instalación fue programada",
                "Asignamos un técnico a tu solicitud. " + cuando,
                "ciudadano.html#solicitudes");

        notificacionService.notificarPersonal(
                tecnico.getId(), NotificacionService.INSTALACION,
                "Nueva instalación asignada",
                guardada.getCodigo() + " · " + solicitud.getDireccion(),
                "instalaciones.html");

        return OrdenInstalacionDTO.de(guardada);
    }

    @Transactional(readOnly = true)
    public List<OrdenInstalacionDTO> listarTodas() {
        return ordenRepository.findAllByOrderByFechaCreacionDesc()
                .stream().map(OrdenInstalacionDTO::de).toList();
    }

    @Transactional(readOnly = true)
    public OrdenInstalacionDTO obtenerPorSolicitud(Long solicitudId) {
        return OrdenInstalacionDTO.de(
                ordenRepository.findBySolicitudId(solicitudId)
                        .orElseThrow(() -> new IllegalArgumentException(
                                "La solicitud todavía no tiene orden de instalación.")));
    }

    // ---------------------------------------------------------------
    // TECNICO
    // ---------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<OrdenInstalacionDTO> listarDelTecnico(Long personalId) {
        return ordenRepository.findByTecnicoIdOrderByFechaCreacionDesc(personalId)
                .stream().map(OrdenInstalacionDTO::de).toList();
    }

    /** El técnico registra el medidor: se crea el suministro y la solicitud queda ACTIVADA. */
    @Transactional
    public OrdenInstalacionDTO completar(
            Long ordenId,
            Long personalId,
            String numeroSerie,
            BigDecimal lecturaInicial,
            String resultado) {

        OrdenInstalacion orden = buscar(ordenId);

        if (orden.getTecnico() == null
                || !orden.getTecnico().getId().equals(personalId)) {
            throw new AccessDeniedException(
                    "Esta orden no está asignada a tu usuario.");
        }

        if (!ASIGNADA.equals(orden.getEstado())) {
            throw new IllegalArgumentException(
                    "Solo se pueden completar órdenes asignadas.");
        }

        SolicitudServicio solicitud = orden.getSolicitud();

        if (!"EN_INSTALACION".equals(solicitud.getEstado())) {
            throw new IllegalArgumentException(
                    "La solicitud no está en instalación.");
        }

        if (numeroSerie == null || numeroSerie.isBlank()) {
            throw new IllegalArgumentException("El número de serie del medidor es obligatorio.");
        }

        if (medidorRepository.existsByNumeroSerie(numeroSerie.trim())) {
            throw new IllegalArgumentException("Ya existe un medidor con ese número de serie.");
        }

        if (lecturaInicial == null || lecturaInicial.signum() < 0) {
            throw new IllegalArgumentException(
                    "La lectura inicial es obligatoria y no puede ser negativa.");
        }

        if (resultado != null && resultado.length() > 1000) {
            throw new IllegalArgumentException(
                    "El resultado no puede superar los 1000 caracteres.");
        }

        // Si algo falla aquí abajo, toda la transacción se revierte.
        Suministro suministro = suministroService.registrar(
                generarCodigoSuministro(orden.getId()),
                solicitud.getDireccion(),
                solicitud.getLatitud(),
                solicitud.getLongitud(),
                solicitud.getCliente().getId());

        Medidor medidor = medidorService.registrar(
                numeroSerie.trim(),
                suministro.getId(),
                LocalDate.now());

        // La lectura inicial queda como primera lectura del medidor (base del consumo).
        // Si falla, toda la instalación se revierte (suministro y medidor incluidos).
        Long usuarioId = usuarioRepository.findByPersonalId(personalId)
                .map(u -> u.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "No se encontró el usuario del técnico que registra la instalación."));

        lecturaService.registrarInicial(medidor, lecturaInicial, LocalDate.now(), usuarioId);

        orden.setSuministro(suministro);
        orden.setNumeroSerieMedidor(medidor.getNumeroSerie());
        orden.setLecturaInicial(lecturaInicial);
        orden.setResultado(resultado == null || resultado.isBlank() ? null : resultado.trim());
        orden.setFechaCompletada(LocalDateTime.now());
        orden.setEstado(COMPLETADA);

        solicitud.setEstado("ACTIVADA");
        solicitudRepository.save(solicitud);

        OrdenInstalacion guardada = ordenRepository.save(orden);

        notificacionService.notificarCliente(
                solicitud.getCliente().getId(), NotificacionService.INSTALACION,
                "¡Tu servicio fue activado!",
                "Tu suministro " + suministro.getCodigoSuministro()
                        + " ya está activo. Revísalo en Mis suministros.",
                "ciudadano.html#suministros");

        return OrdenInstalacionDTO.de(guardada);
    }

    // ---------------------------------------------------------------
    // CIUDADANO
    // ---------------------------------------------------------------

    @Transactional(readOnly = true)
    public ComprobanteDTO obtenerComprobante(Long solicitudId, Long clienteId) {

        SolicitudServicio solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No existe la solicitud indicada."));

        if (!solicitud.getCliente().getId().equals(clienteId)) {
            throw new AccessDeniedException(
                    "No puedes ver el comprobante de otra solicitud.");
        }

        OrdenInstalacion orden = ordenRepository.findBySolicitudId(solicitudId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Tu solicitud aún no tiene comprobante. Se genera cuando es aprobada."));

        return ComprobanteDTO.de(solicitud, orden);
    }

    // ---------------------------------------------------------------

    private OrdenInstalacion buscar(Long id) {
        return ordenRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No existe la orden de instalación con ID: " + id));
    }

    /** Código numérico de 9 dígitos, como los suministros existentes (ej. 100000007). */
    private String generarCodigoSuministro(Long ordenId) {

        long candidato = 100_000_000L + ordenId;

        while (suministroRepository.existsByCodigoSuministro(String.valueOf(candidato))) {
            candidato++;
        }

        return String.valueOf(candidato);
    }
}