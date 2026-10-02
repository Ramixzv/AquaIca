package com.aquaica.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.aquaica.dto.SeguimientoResponseDTO;
import com.aquaica.entity.Personal;
import com.aquaica.entity.Reporte;
import com.aquaica.entity.Seguimiento;
import com.aquaica.repository.PersonalRepository;
import com.aquaica.repository.ReporteRepository;
import com.aquaica.repository.SeguimientoRepository;
import com.aquaica.security.CustomUserDetails;

@Service
public class SeguimientoService {

    private final SeguimientoRepository seguimientoRepository;
    private final ReporteRepository reporteRepository;
    private final PersonalRepository personalRepository;

    public SeguimientoService(
            SeguimientoRepository seguimientoRepository,
            ReporteRepository reporteRepository,
            PersonalRepository personalRepository) {

        this.seguimientoRepository = seguimientoRepository;
        this.reporteRepository = reporteRepository;
        this.personalRepository = personalRepository;
    }

    public SeguimientoResponseDTO crearSeguimiento(
            Long reporteId,
            String estado,
            String comentario) {


        Reporte reporte = reporteRepository.findById(reporteId)
                .orElseThrow(() ->
                        new RuntimeException("Reporte no encontrado"));


        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !(authentication.getPrincipal()
                        instanceof CustomUserDetails)) {

            throw new RuntimeException(
                    "No se pudo obtener el usuario autenticado");
        }

        CustomUserDetails userDetails =
                (CustomUserDetails) authentication.getPrincipal();


        if (userDetails.getUsuario().getPersonal() == null) {
            throw new RuntimeException(
                    "El usuario no tiene personal asociado");
        }

        Long personalId =
                userDetails.getUsuario()
                        .getPersonal()
                        .getId();

        if (personalId == null) {
            throw new RuntimeException(
                    "El usuario no tiene personal asociado");
        }


        Personal personal =
                personalRepository.findById(personalId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Personal no encontrado"));


        Seguimiento seguimiento = new Seguimiento();

        seguimiento.setReporte(reporte);
        seguimiento.setPersonal(personal);
        seguimiento.setEstado(estado);
        seguimiento.setComentario(comentario);
        seguimiento.setFechaCreacion(LocalDateTime.now());


        reporte.setEstado(estado);


        reporteRepository.save(reporte);


        Seguimiento guardado =
                seguimientoRepository.save(seguimiento);

        return new SeguimientoResponseDTO(
                guardado.getId(),
                reporte.getId(),
                personal.getId(),
                personal.getNombre(),
                guardado.getEstado(),
                guardado.getComentario(),
                guardado.getFechaCreacion()
        );
    }

    public List<SeguimientoResponseDTO> obtenerSeguimientosPorReporte(
            Long reporteId) {

        return seguimientoRepository
                .obtenerSeguimientosPorReporte(reporteId);
    }

    public List<SeguimientoResponseDTO> obtenerTodosLosSeguimientos() {

    return seguimientoRepository
            .obtenerTodosLosSeguimientos();
}
public List<SeguimientoResponseDTO> obtenerSeguimientosPublico(
        Long reporteId,
        String codigo) {

    Reporte reporte = reporteRepository.findById(reporteId)
            .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));

    String codigoReporte = reporte.getSuministroId() != null
            ? reporte.getSuministroId().getCodigoSuministro()
            : null;

    if (codigoReporte == null ||
            !codigoReporte.equalsIgnoreCase(codigo.trim())) {

        throw new RuntimeException("Reporte no encontrado");
    }

    return seguimientoRepository.obtenerSeguimientosPorReporte(reporteId);
}
}