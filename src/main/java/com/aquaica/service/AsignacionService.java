package com.aquaica.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.AsignacionResponseDTO;
import com.aquaica.entity.Asignacion;
import com.aquaica.entity.Personal;
import com.aquaica.entity.Reporte;
import com.aquaica.entity.Seguimiento;
import com.aquaica.repository.AsignacionRepository;
import com.aquaica.repository.PersonalRepository;
import com.aquaica.repository.ReporteRepository;
import com.aquaica.repository.SeguimientoRepository;
import com.aquaica.security.CustomUserDetails;

@Service
public class AsignacionService {

    private final AsignacionRepository asignacionRepository;
    private final ReporteRepository reporteRepository;
    private final PersonalRepository personalRepository;
    private final SeguimientoRepository seguimientoRepository;


    public AsignacionService(
            AsignacionRepository asignacionRepository,
            ReporteRepository reporteRepository,
            PersonalRepository personalRepository,
            SeguimientoRepository seguimientoRepository) {

        this.asignacionRepository = asignacionRepository;
        this.reporteRepository = reporteRepository;
        this.personalRepository = personalRepository;
        this.seguimientoRepository = seguimientoRepository;
    }


        public Asignacion crearAsignacion(
        Long reporteId,
        Long personalId,
        String observaciones) {

    Reporte reporte = reporteRepository.findById(reporteId)
            .orElseThrow(() ->
                    new RuntimeException("Reporte no encontrado"));


    Personal personal = personalRepository.findById(personalId)
            .orElseThrow(() ->
                    new RuntimeException("Personal no encontrado"));

    if (!"ACTIVO".equalsIgnoreCase(personal.getEstado())) {

        throw new RuntimeException(
                "El personal seleccionado no está activo"
        );
    }

    Asignacion asignacion = new Asignacion();

    asignacion.setReporte(reporte);
    asignacion.setPersonal(personal);
    asignacion.setFechaAsignacion(LocalDateTime.now());
    asignacion.setObservaciones(observaciones);
    asignacion.setEstado("ACTIVA");


    reporte.setEstado("EN_PROCESO");

    reporteRepository.save(reporte);


    Asignacion guardada =
            asignacionRepository.save(asignacion);


    Seguimiento seguimiento = new Seguimiento();

    seguimiento.setReporte(reporte);
    seguimiento.setPersonal(personal);
    seguimiento.setEstado("TECNICO_ASIGNADO");

    seguimiento.setComentario(
            "Se asignó el reporte al técnico "
            + personal.getNombre()
    );

    seguimiento.setFechaCreacion(
            LocalDateTime.now()
    );


    seguimientoRepository.save(seguimiento);


    return guardada;
}

    @Transactional
    public Asignacion iniciarAtencion(Long asignacionId) {


        Asignacion asignacion = asignacionRepository
                .findById(asignacionId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Asignación no encontrada"
                        ));



        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();


        if (authentication == null ||
                !(authentication.getPrincipal()
                        instanceof CustomUserDetails)) {

            throw new RuntimeException(
                    "No se pudo obtener el usuario autenticado"
            );
        }


        CustomUserDetails userDetails =
                (CustomUserDetails) authentication.getPrincipal();



        if (userDetails.getUsuario().getPersonal() == null) {

            throw new RuntimeException(
                    "El usuario no tiene personal asociado"
            );
        }


        Long personalId =
                userDetails.getUsuario()
                        .getPersonal()
                        .getId();


        if (!asignacion.getPersonal()
                .getId()
                .equals(personalId)) {

            throw new RuntimeException(
                    "Esta asignación no pertenece al usuario autenticado"
            );
        }


        if (!"ACTIVA".equalsIgnoreCase(
                asignacion.getEstado())) {

            throw new RuntimeException(
                    "La asignación no está disponible para iniciar atención"
            );
        }


        asignacion.setEstado("EN_ATENCION");



        Reporte reporte =
                asignacion.getReporte();



        reporte.setEstado("EN_PROCESO");

        reporteRepository.save(reporte);



        Seguimiento seguimiento =
                new Seguimiento();

        seguimiento.setReporte(reporte);

        seguimiento.setPersonal(
                asignacion.getPersonal()
        );

        seguimiento.setEstado("EN_ATENCION");

        seguimiento.setComentario(
                "El técnico ha iniciado la atención del reporte."
        );

        seguimiento.setFechaCreacion(
                LocalDateTime.now()
        );


        seguimientoRepository.save(seguimiento);



        return asignacionRepository.save(asignacion);
    }
    



    public List<AsignacionResponseDTO> obtenerAsignacionesPorReporte(
            Long reporteId) {

        return asignacionRepository
                .obtenerAsignacionesPorReporte(reporteId);
    }


    public List<AsignacionResponseDTO> obtenerAsignacionesPorPersonal(
            Long personalId) {

        return asignacionRepository
                .obtenerAsignacionesPorPersonal(personalId);
    }
}