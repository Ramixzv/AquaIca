package com.aquaica.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.BitacoraResponseDTO;
import com.aquaica.entity.Asignacion;
import com.aquaica.entity.Bitacora;
import com.aquaica.entity.Personal;
import com.aquaica.entity.Reporte;
import com.aquaica.repository.AsignacionRepository;
import com.aquaica.repository.BitacoraRepository;
import com.aquaica.repository.PersonalRepository;
import com.aquaica.repository.ReporteRepository;

@Service
public class BitacoraService {

    private final BitacoraRepository bitacoraRepository;
    private final ReporteRepository reporteRepository;
    private final AsignacionRepository asignacionRepository;
    private final PersonalRepository personalRepository;

    public BitacoraService(
            BitacoraRepository bitacoraRepository,
            ReporteRepository reporteRepository,
            AsignacionRepository asignacionRepository,
            PersonalRepository personalRepository) {

        this.bitacoraRepository = bitacoraRepository;
        this.reporteRepository = reporteRepository;
        this.asignacionRepository = asignacionRepository;
        this.personalRepository = personalRepository;
    }

    @Transactional
    public BitacoraResponseDTO registrarBitacora(
            Long reporteId,
            Long asignacionId,
            Long personalId,
            String descripcion) {

        Reporte reporte = reporteRepository.findById(reporteId)
                .orElseThrow(() -> new RuntimeException(
                        "No se encontró el reporte"));

        Asignacion asignacion = asignacionRepository.findById(asignacionId)
                .orElseThrow(() -> new RuntimeException(
                        "No se encontró la asignación"));

        Personal personal = personalRepository.findById(personalId)
                .orElseThrow(() -> new RuntimeException(
                        "No se encontró el personal"));

        if (!asignacion.getReporte().getId().equals(reporteId)) {
            throw new RuntimeException(
                    "La asignación no pertenece al reporte");
        }

        if (!asignacion.getPersonal().getId().equals(personalId)) {
            throw new RuntimeException(
                    "El personal no pertenece a esta asignación");
        }

        if (!"EN_ATENCION".equalsIgnoreCase(asignacion.getEstado())) {
            throw new RuntimeException(
                    "Solo se pueden registrar bitácoras durante una atención activa");
        }

        if (descripcion == null || descripcion.trim().isEmpty()) {
            throw new RuntimeException(
                    "La descripción de la bitácora no puede estar vacía");
        }

        Bitacora bitacora = new Bitacora();

        bitacora.setReporte(reporte);
        bitacora.setAsignacion(asignacion);
        bitacora.setPersonal(personal);
        bitacora.setDescripcion(descripcion.trim());
        bitacora.setFechaCreacion(LocalDateTime.now());

        Bitacora guardada = bitacoraRepository.save(bitacora);

        return convertirDTO(guardada);
    }

    @Transactional(readOnly = true)
    public List<BitacoraResponseDTO> obtenerPorReporte(Long reporteId) {

        return bitacoraRepository
                .findAllByReporteIdOrderByFechaCreacionAsc(reporteId)
                .stream()
                .map(this::convertirDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BitacoraResponseDTO> obtenerPorAsignacion(Long asignacionId) {

        return bitacoraRepository
                .findAllByAsignacionIdOrderByFechaCreacionAsc(asignacionId)
                .stream()
                .map(this::convertirDTO)
                .toList();
    }

    public List<BitacoraResponseDTO> obtenerBitacorasPublico(
        Long reporteId,
        String codigo) {

    Reporte reporte = reporteRepository.findById(reporteId)
            .orElseThrow(() ->
                    new RuntimeException("Reporte no encontrado"));

    String codigoReporte = reporte.getSuministroId() != null
            ? reporte.getSuministroId().getCodigoSuministro()
            : null;

    if (codigoReporte == null ||
            !codigoReporte.equalsIgnoreCase(codigo.trim())) {

        throw new RuntimeException("Reporte no encontrado");
    }

    return bitacoraRepository
            .findAllByReporteIdOrderByFechaCreacionAsc(reporteId)
            .stream()
            .map(this::convertirDTO)
            .toList();
}

    private BitacoraResponseDTO convertirDTO(Bitacora bitacora) {

        return new BitacoraResponseDTO(
                bitacora.getId(),
                bitacora.getReporte().getId(),
                bitacora.getAsignacion().getId(),
                bitacora.getPersonal().getId(),
                bitacora.getPersonal().getNombre(),
                bitacora.getDescripcion(),
                bitacora.getFechaCreacion()
        );
    }
}