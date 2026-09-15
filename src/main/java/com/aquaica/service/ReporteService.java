package com.aquaica.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.aquaica.dto.ReporteResponseDTO;
import com.aquaica.entity.Reporte;
import com.aquaica.entity.Suministro;
import com.aquaica.repository.ReporteRepository;
import com.aquaica.repository.SuministroRepository;

@Service
public class ReporteService {

    private final ReporteRepository reporteRepository;
    private final SuministroRepository suministroRepository;
    private final PrioridadService prioridadService;

    public ReporteService(
            ReporteRepository reporteRepository,
            SuministroRepository suministroRepository,
            PrioridadService prioridadService) {

        this.reporteRepository = reporteRepository;
        this.suministroRepository = suministroRepository;
        this.prioridadService = prioridadService;
    }

    public Reporte crearReporte(
            String codigoSuministro,
            String tipoProblema,
            String descripcion) {

        
        Suministro suministro = suministroRepository
                .findByCodigoSuministro(codigoSuministro)
                .orElseThrow(() ->
                        new RuntimeException("Suministro no encontrado"));

        
        Reporte reporte = new Reporte();

        reporte.setSuministroId(suministro);
        reporte.setTipoProblema(tipoProblema);
        reporte.setDescripcion(descripcion);
        reporte.setEstado("PENDIENTE");
        String prioridad = prioridadService.calcularPrioridad(tipoProblema);
        reporte.setPrioridad(prioridad);
        reporte.setFechaCreacion(LocalDateTime.now());

        
        return reporteRepository.save(reporte);
    }

    public List<ReporteResponseDTO> obtenerTodosLosReportes() {
    return reporteRepository.obtenerTodosLosReportes();
}

public Optional<ReporteResponseDTO> obtenerReportePorId(Long id) {
    return reporteRepository.obtenerReportePorId(id);
}
public List<ReporteResponseDTO> obtenerReportesPorCodigoSuministro(
        String codigo) {

    return reporteRepository.obtenerReportesPorCodigoSuministro(codigo);
}

public List<ReporteResponseDTO> obtenerMisReportes(String dni) {

    return reporteRepository.obtenerReportesPorDni(dni);

}
}
