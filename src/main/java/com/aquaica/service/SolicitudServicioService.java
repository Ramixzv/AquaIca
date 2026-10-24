package com.aquaica.service;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.entity.Cliente;
import com.aquaica.entity.SolicitudServicio;
import com.aquaica.repository.ClienteRepository;
import com.aquaica.repository.SolicitudServicioRepository;

@Service
public class SolicitudServicioService {

    private final SolicitudServicioRepository solicitudRepository;
    private final ClienteRepository clienteRepository;
    private final OrdenInstalacionService ordenInstalacionService;

    private static final Set<String> ESTADOS_VALIDOS = Set.of(
            "PENDIENTE",
            "EN_EVALUACION",
            "OBSERVADA",
            "APROBADA",
            "EN_INSTALACION",
            "ACTIVADA",
            "RECHAZADA",
            "CANCELADA"
    );

    public SolicitudServicioService(
            SolicitudServicioRepository solicitudRepository,
            ClienteRepository clienteRepository,
            OrdenInstalacionService ordenInstalacionService) {

        this.solicitudRepository = solicitudRepository;
        this.clienteRepository = clienteRepository;
        this.ordenInstalacionService = ordenInstalacionService;
    }

    @Transactional(readOnly = true)
    public List<SolicitudServicio> listarTodas() {
        return solicitudRepository
                .findAllByOrderByFechaSolicitudDesc();
    }

    @Transactional(readOnly = true)
    public SolicitudServicio buscarPorId(Long id) {
        return solicitudRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "No existe la solicitud con ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<SolicitudServicio> listarPorCliente(Long clienteId) {
        if (!clienteRepository.existsById(clienteId)) {
            throw new IllegalArgumentException(
                    "No existe el cliente con ID: " + clienteId);
        }

        return solicitudRepository
                .findByClienteIdOrderByFechaSolicitudDesc(clienteId);
    }

    @Transactional(readOnly = true)
    public List<SolicitudServicio> listarPorEstado(String estado) {
        validarEstado(estado);

        return solicitudRepository
                .findByEstadoOrderByFechaSolicitudDesc(estado);
    }

    @Transactional
    public SolicitudServicio registrar(
            Long clienteId,
            String direccion,
            String referencia,
            Double latitud,
            Double longitud,
            String descripcion) {

        if (clienteId == null ||
                !clienteRepository.existsById(clienteId)) {
            throw new IllegalArgumentException(
                    "El cliente indicado no existe.");
        }

        if (direccion == null || direccion.isBlank()) {
            throw new IllegalArgumentException(
                    "La dirección es obligatoria.");
        }

        if (direccion.trim().length() > 200) {
            throw new IllegalArgumentException(
                    "La dirección no puede superar los 200 caracteres.");
        }

        if (referencia != null && referencia.length() > 250) {
            throw new IllegalArgumentException(
                    "La referencia no puede superar los 250 caracteres.");
        }

        if (descripcion != null && descripcion.length() > 1000) {
            throw new IllegalArgumentException(
                    "La descripción no puede superar los 1000 caracteres.");
        }

        validarCoordenadas(latitud, longitud);

        List<String> estadosEnTramite = List.of(
                "PENDIENTE",
                "EN_EVALUACION",
                "OBSERVADA",
                "APROBADA",
                "EN_INSTALACION"
        );

        if (solicitudRepository.existsByClienteIdAndEstadoIn(
                clienteId, estadosEnTramite)) {
            throw new IllegalArgumentException(
                    "El cliente ya tiene una solicitud de conexión en trámite.");
        }

        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "No existe el cliente indicado."));

        SolicitudServicio solicitud = new SolicitudServicio();
        solicitud.setCliente(cliente);
        solicitud.setDireccion(direccion.trim());
        solicitud.setReferencia(
                referencia == null || referencia.isBlank()
                        ? null : referencia.trim());
        solicitud.setLatitud(latitud);
        solicitud.setLongitud(longitud);
        solicitud.setDescripcion(
                descripcion == null || descripcion.isBlank()
                        ? null : descripcion.trim());
        solicitud.setEstado("PENDIENTE");

        return solicitudRepository.save(solicitud);
    }

    
@Transactional
public SolicitudServicio cancelarPorCliente(
        Long solicitudId,
        Long clienteId) {

    SolicitudServicio solicitud = buscarPorId(solicitudId);

    if (!solicitud.getCliente().getId().equals(clienteId)) {
        throw new org.springframework.security.access.AccessDeniedException(
                "No puedes cancelar una solicitud de otro cliente.");
    }

    if (!Set.of("PENDIENTE", "OBSERVADA")
            .contains(solicitud.getEstado())) {
        throw new IllegalArgumentException(
                "Solo puedes cancelar solicitudes pendientes u observadas.");
    }

    solicitud.setEstado("CANCELADA");

    return solicitudRepository.save(solicitud);
}


    @Transactional
    public SolicitudServicio actualizarEstado(
            Long id,
            String nuevoEstado,
            String observaciones) {

        validarEstado(nuevoEstado);

        if (observaciones != null && observaciones.length() > 1000) {
            throw new IllegalArgumentException(
                    "Las observaciones no pueden superar los 1000 caracteres.");
        }

        SolicitudServicio solicitud = buscarPorId(id);
        String estadoActual = solicitud.getEstado();

        if (!puedeCambiarEstado(estadoActual, nuevoEstado)) {
            throw new IllegalArgumentException(
                    "No se permite cambiar de " + estadoActual
                            + " a " + nuevoEstado + ".");
        }

        boolean cambia = !estadoActual.equals(nuevoEstado);

        // Estos dos estados los controla la orden de instalación
        // (asignar técnico / registrar medidor), no el cambio manual.
        if (cambia && ("EN_INSTALACION".equals(nuevoEstado)
                || "ACTIVADA".equals(nuevoEstado))) {
            throw new IllegalArgumentException(
                    "El estado " + nuevoEstado + " se actualiza desde la orden de instalación "
                    + "(al asignar el técnico o al registrar el medidor).");
        }

        if (cambia && ("OBSERVADA".equals(nuevoEstado)
                || "RECHAZADA".equals(nuevoEstado))
                && (observaciones == null || observaciones.isBlank())) {
            throw new IllegalArgumentException(
                    "Debes indicar una observación para marcar la solicitud como "
                    + nuevoEstado + ".");
        }

        solicitud.setEstado(nuevoEstado);
        solicitud.setObservaciones(
                observaciones == null || observaciones.isBlank()
                        ? null : observaciones.trim());

        SolicitudServicio guardada = solicitudRepository.save(solicitud);

        if (cambia && "APROBADA".equals(nuevoEstado)) {
            ordenInstalacionService.crearParaSolicitud(guardada);
        }

        if (cambia && "CANCELADA".equals(nuevoEstado)) {
            ordenInstalacionService.cancelarPorSolicitud(guardada.getId());
        }

        return guardada;
    }

    private void validarEstado(String estado) {
        if (estado == null ||
                !ESTADOS_VALIDOS.contains(estado)) {
            throw new IllegalArgumentException(
                    "El estado indicado no es válido.");
        }
    }

    private void validarCoordenadas(
            Double latitud, Double longitud) {

        if ((latitud == null) != (longitud == null)) {
            throw new IllegalArgumentException(
                    "Debes proporcionar ambas coordenadas o ninguna.");
        }

        if (latitud != null &&
                (latitud < -90 || latitud > 90)) {
            throw new IllegalArgumentException(
                    "La latitud debe estar entre -90 y 90.");
        }

        if (longitud != null &&
                (longitud < -180 || longitud > 180)) {
            throw new IllegalArgumentException(
                    "La longitud debe estar entre -180 y 180.");
        }
    }

    private boolean puedeCambiarEstado(
            String actual, String nuevo) {

        if (actual.equals(nuevo)) {
            return true;
        }

        return switch (actual) {
            case "PENDIENTE" ->
                    Set.of("EN_EVALUACION", "CANCELADA")
                            .contains(nuevo);

            case "EN_EVALUACION" ->
                    Set.of("OBSERVADA", "APROBADA",
                            "RECHAZADA", "CANCELADA")
                            .contains(nuevo);

            case "OBSERVADA" ->
                    Set.of("PENDIENTE", "EN_EVALUACION",
                            "CANCELADA")
                            .contains(nuevo);

            case "APROBADA" ->
                    Set.of("EN_INSTALACION", "CANCELADA")
                            .contains(nuevo);

            case "EN_INSTALACION" ->
                    Set.of("ACTIVADA", "CANCELADA")
                            .contains(nuevo);

            default -> false;
        };
    }
}