package com.aquaica.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.NotificacionDTO;
import com.aquaica.entity.Notificacion;
import com.aquaica.repository.NotificacionRepository;
import com.aquaica.repository.UsuarioRepository;

/**
 * Avisos dentro del sistema. Los demás servicios solo llaman a notificarCliente /
 * notificarPersonal cuando pasa algo importante; cada persona ve únicamente los suyos.
 */
@Service
public class NotificacionService {

    public static final String SOLICITUD = "SOLICITUD";
    public static final String INSTALACION = "INSTALACION";
    public static final String RECIBO = "RECIBO";
    public static final String REPORTE = "REPORTE";
    public static final String ASIGNACION = "ASIGNACION";

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;

    public NotificacionService(
            NotificacionRepository notificacionRepository,
            UsuarioRepository usuarioRepository) {

        this.notificacionRepository = notificacionRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // ---------------------------------------------------------------
    // Emitir avisos (los llaman otros servicios)
    // ---------------------------------------------------------------

    @Transactional
    public void notificarUsuario(
            Long usuarioId, String tipo, String titulo, String mensaje, String enlace) {

        if (usuarioId == null) {
            return;
        }

        Notificacion n = new Notificacion();
        n.setUsuario(usuarioRepository.getReferenceById(usuarioId));
        n.setTipo(recortar(tipo, 30));
        n.setTitulo(recortar(titulo, 120));
        n.setMensaje(mensaje == null ? "" : recortar(mensaje, 300));
        n.setEnlace(recortar(enlace, 120));

        notificacionRepository.save(n);
    }

    /** Avisa al ciudadano dueño del cliente. Si el cliente no tiene cuenta, no hace nada. */
    @Transactional
    public void notificarCliente(
            Long clienteId, String tipo, String titulo, String mensaje, String enlace) {

        if (clienteId == null) {
            return;
        }

        usuarioRepository.findByClienteId(clienteId).ifPresent(
                u -> notificarUsuario(u.getId(), tipo, titulo, mensaje, enlace));
    }

    /** Avisa a un integrante del personal (técnico, soporte...). */
    @Transactional
    public void notificarPersonal(
            Long personalId, String tipo, String titulo, String mensaje, String enlace) {

        if (personalId == null) {
            return;
        }

        usuarioRepository.findByPersonalId(personalId).ifPresent(
                u -> notificarUsuario(u.getId(), tipo, titulo, mensaje, enlace));
    }

    // ---------------------------------------------------------------
    // Consultas del propio usuario
    // ---------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<NotificacionDTO> listar(Long usuarioId) {
        return notificacionRepository.findTop30ByUsuarioIdOrderByIdDesc(usuarioId)
                .stream().map(NotificacionDTO::de).toList();
    }

    @Transactional(readOnly = true)
    public long noLeidas(Long usuarioId) {
        return notificacionRepository.countByUsuarioIdAndLeidaFalse(usuarioId);
    }

    @Transactional
    public void marcarLeida(Long id, Long usuarioId) {
        notificacionRepository.marcarUna(id, usuarioId);
    }

    @Transactional
    public int marcarTodas(Long usuarioId) {
        return notificacionRepository.marcarTodas(usuarioId);
    }

    // ---------------------------------------------------------------

    /** EN_ATENCION -> "En atención". */
    public static String humanizar(String estado) {

        if (estado == null || estado.isBlank()) {
            return "";
        }

        String texto = estado.replace('_', ' ').toLowerCase();
        return Character.toUpperCase(texto.charAt(0)) + texto.substring(1);
    }

    private static String recortar(String texto, int maximo) {

        if (texto == null) {
            return null;
        }

        String limpio = texto.trim();
        return limpio.length() <= maximo ? limpio : limpio.substring(0, maximo - 1) + "…";
    }
}
