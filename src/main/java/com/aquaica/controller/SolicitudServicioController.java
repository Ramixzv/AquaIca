
package com.aquaica.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.SolicitudServicioDTO;
import com.aquaica.entity.SolicitudServicio;
import com.aquaica.security.CustomUserDetails;
import com.aquaica.service.SolicitudServicioService;

@RestController
@RequestMapping("/api/solicitudes-servicio")
public class SolicitudServicioController {

    private final SolicitudServicioService solicitudService;

    public SolicitudServicioController(
            SolicitudServicioService solicitudService) {
        this.solicitudService = solicitudService;
    }

    // ADMIN / SOPORTE: listar todas
    @GetMapping
    public ResponseEntity<List<SolicitudServicioDTO>> listarTodas() {
        List<SolicitudServicioDTO> resultado =
                solicitudService.listarTodas()
                        .stream()
                        .map(SolicitudServicioDTO::new)
                        .toList();

        return ResponseEntity.ok(resultado);
    }

    // ADMIN / SOPORTE: buscar por ID
    @GetMapping("/{id}")
    public ResponseEntity<SolicitudServicioDTO> buscarPorId(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                new SolicitudServicioDTO(
                        solicitudService.buscarPorId(id)));
    }

    // ADMIN / SOPORTE: solicitudes de un cliente
    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<SolicitudServicioDTO>> listarPorCliente(
            @PathVariable Long clienteId) {

        List<SolicitudServicioDTO> resultado =
                solicitudService.listarPorCliente(clienteId)
                        .stream()
                        .map(SolicitudServicioDTO::new)
                        .toList();

        return ResponseEntity.ok(resultado);
    }

    // ADMIN / SOPORTE: filtrar por estado
    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<SolicitudServicioDTO>> listarPorEstado(
            @PathVariable String estado) {

        List<SolicitudServicioDTO> resultado =
                solicitudService.listarPorEstado(estado)
                        .stream()
                        .map(SolicitudServicioDTO::new)
                        .toList();

        return ResponseEntity.ok(resultado);
    }

    // CIUDADANO: registrar una solicitud propia
    @PostMapping
    public ResponseEntity<SolicitudServicioDTO> registrar(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody SolicitudSolicitud solicitud) {

        validarCiudadano(userDetails);

        Long clienteId = userDetails.getUsuario()
                .getCliente().getId();

        SolicitudServicio nueva = solicitudService.registrar(
                clienteId,
                solicitud.getDireccion(),
                solicitud.getReferencia(),
                solicitud.getLatitud(),
                solicitud.getLongitud(),
                solicitud.getDescripcion());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SolicitudServicioDTO(nueva));
    }

    // CIUDADANO: consultar solamente sus solicitudes
    @GetMapping("/mis-solicitudes")
    public ResponseEntity<List<SolicitudServicioDTO>> misSolicitudes(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        validarCiudadano(userDetails);

        Long clienteId = userDetails.getUsuario()
                .getCliente().getId();

        List<SolicitudServicioDTO> resultado =
                solicitudService.listarPorCliente(clienteId)
                        .stream()
                        .map(SolicitudServicioDTO::new)
                        .toList();

        return ResponseEntity.ok(resultado);
    }

    // ADMIN / SOPORTE: actualizar estado
    @PatchMapping("/{id}/estado")
    public ResponseEntity<SolicitudServicioDTO> actualizarEstado(
            @PathVariable Long id,
            @RequestBody ActualizacionEstado actualizacion) {

        SolicitudServicio actualizada =
                solicitudService.actualizarEstado(
                        id,
                        actualizacion.getEstado(),
                        actualizacion.getObservaciones());

        return ResponseEntity.ok(
                new SolicitudServicioDTO(actualizada));
    }

    private void validarCiudadano(CustomUserDetails userDetails) {
        if (userDetails == null
                || userDetails.getUsuario().getCliente() == null
                || !"CIUDADANO".equals(
                        userDetails.getUsuario().getRol())) {
            throw new AccessDeniedException(
                    "Se requiere una cuenta ciudadana asociada a un cliente.");
        }
    }

    
@PatchMapping("/{id}/cancelar")
public ResponseEntity<SolicitudServicioDTO> cancelarMiSolicitud(
        @PathVariable Long id,
        @AuthenticationPrincipal CustomUserDetails userDetails) {

    validarCiudadano(userDetails);

    Long clienteId = userDetails.getUsuario()
            .getCliente().getId();

    SolicitudServicio cancelada =
            solicitudService.cancelarPorCliente(id, clienteId);

    return ResponseEntity.ok(
            new SolicitudServicioDTO(cancelada));
}


    public static class SolicitudSolicitud {

        private String direccion;
        private String referencia;
        private Double latitud;
        private Double longitud;
        private String descripcion;

        public String getDireccion() {
            return direccion;
        }

        public void setDireccion(String direccion) {
            this.direccion = direccion;
        }

        public String getReferencia() {
            return referencia;
        }

        public void setReferencia(String referencia) {
            this.referencia = referencia;
        }

        public Double getLatitud() {
            return latitud;
        }

        public void setLatitud(Double latitud) {
            this.latitud = latitud;
        }

        public Double getLongitud() {
            return longitud;
        }

        public void setLongitud(Double longitud) {
            this.longitud = longitud;
        }

        public String getDescripcion() {
            return descripcion;
        }

        public void setDescripcion(String descripcion) {
            this.descripcion = descripcion;
        }
    }

    public static class ActualizacionEstado {

        private String estado;
        private String observaciones;

        public String getEstado() {
            return estado;
        }

        public void setEstado(String estado) {
            this.estado = estado;
        }

        public String getObservaciones() {
            return observaciones;
        }

        public void setObservaciones(String observaciones) {
            this.observaciones = observaciones;
        }
    }
}
