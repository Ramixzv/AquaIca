
package com.aquaica.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.PatchMapping;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.SuministroDTO;
import com.aquaica.entity.Suministro;
import com.aquaica.service.SuministroService;

@RestController
@RequestMapping("/api/suministros")
public class SuministroController {

    private final SuministroService suministroService;

    public SuministroController(SuministroService suministroService) {
        this.suministroService = suministroService;
    }

    @GetMapping
    public ResponseEntity<List<SuministroDTO>> listar(
            @RequestParam(required = false) String buscar) {

        List<SuministroDTO> resultado =
                (buscar == null || buscar.isBlank())
                        ? suministroService.listarTodosDTO()
                        : suministroService.buscarDTO(buscar);

        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{codigo}")
    public ResponseEntity<SuministroDTO> buscarPorCodigo(
            @PathVariable String codigo) {

        return suministroService.buscarPorCodigoDTO(codigo)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<SuministroDTO>> listarPorCliente(
            @PathVariable Long clienteId) {

        return ResponseEntity.ok(
                suministroService.listarPorClienteDTO(clienteId));
    }

    @PostMapping
    public ResponseEntity<SuministroDTO> registrar(
            @RequestBody SolicitudSuministro solicitud) {

        Suministro suministro = suministroService.registrar(
                solicitud.getCodigoSuministro(),
                solicitud.getDireccion(),
                solicitud.getLatitud(),
                solicitud.getLongitud(),
                solicitud.getClienteId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(suministroService.buscarPorCodigoDTO(
                        suministro.getCodigoSuministro()).orElseThrow());
    }

    @PutMapping("/{id}")
    public ResponseEntity<SuministroDTO> actualizar(
            @PathVariable Long id,
            @RequestBody SolicitudSuministro solicitud) {

        Suministro suministro = suministroService.actualizar(
                id,
                solicitud.getCodigoSuministro(),
                solicitud.getDireccion(),
                solicitud.getLatitud(),
                solicitud.getLongitud(),
                solicitud.getClienteId());

        return ResponseEntity.ok(
                suministroService.buscarPorCodigoDTO(
                        suministro.getCodigoSuministro()).orElseThrow());
    }

    // Body: {"categoria": "DOMESTICO"} o {"categoria": "COMERCIAL"}
    @PatchMapping("/{id}/categoria")
    public ResponseEntity<SuministroDTO> cambiarCategoria(
            @PathVariable Long id,
            @RequestBody Map<String, String> solicitud) {
        return ResponseEntity.ok(suministroService.cambiarCategoria(id, solicitud.get("categoria")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        suministroService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    public static class SolicitudSuministro {

        private String codigoSuministro;
        private String direccion;
        private Double latitud;
        private Double longitud;
        private Long clienteId;

        public String getCodigoSuministro() {
            return codigoSuministro;
        }

        public void setCodigoSuministro(String codigoSuministro) {
            this.codigoSuministro = codigoSuministro;
        }

        public String getDireccion() {
            return direccion;
        }

        public void setDireccion(String direccion) {
            this.direccion = direccion;
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

        public Long getClienteId() {
            return clienteId;
        }

        public void setClienteId(Long clienteId) {
            this.clienteId = clienteId;
        }
    }
}
