package com.aquaica.service;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.ConsumoCiudadanoDTO;
import com.aquaica.dto.SuministroCiudadanoDTO;
import com.aquaica.entity.Lectura;
import com.aquaica.entity.Medidor;
import com.aquaica.entity.Suministro;
import com.aquaica.repository.LecturaRepository;
import com.aquaica.repository.MedidorRepository;
import com.aquaica.repository.SuministroRepository;

/** Consultas del portal ciudadano: solo devuelve datos del cliente autenticado. */
@Service
public class CiudadanoSuministroService {

    private static final String INICIAL = "INICIAL";
    private static final String SIMULADA = "SIMULADA";

    private final SuministroRepository suministroRepository;
    private final MedidorRepository medidorRepository;
    private final LecturaRepository lecturaRepository;

    public CiudadanoSuministroService(
            SuministroRepository suministroRepository,
            MedidorRepository medidorRepository,
            LecturaRepository lecturaRepository) {

        this.suministroRepository = suministroRepository;
        this.medidorRepository = medidorRepository;
        this.lecturaRepository = lecturaRepository;
    }

    @Transactional(readOnly = true)
    public List<SuministroCiudadanoDTO> misSuministros(Long clienteId) {
        return suministroRepository.findByClienteId(clienteId)
                .stream().map(this::aDto).toList();
    }

    /** Lecturas del suministro, de la más antigua a la más reciente (listas para graficar). */
    @Transactional(readOnly = true)
    public List<ConsumoCiudadanoDTO> consumo(Long suministroId, Long clienteId) {

        Suministro suministro = suministroRepository.findById(suministroId).orElse(null);

        // Mismo error si no existe o es de otra persona, para no revelar qué códigos existen.
        if (suministro == null
                || suministro.getCliente() == null
                || !suministro.getCliente().getId().equals(clienteId)) {
            throw new AccessDeniedException("No puedes consultar este suministro.");
        }

        List<Lectura> lecturas = new ArrayList<>(
                lecturaRepository.listarPorSuministro(suministroId).stream()
                        .filter(l -> "VALIDA".equals(l.getEstado())).toList());
        Collections.reverse(lecturas);

        return lecturas.stream().map(l -> {
            boolean inicial = INICIAL.equals(l.getOrigen());
            return new ConsumoCiudadanoDTO(
                    YearMonth.from(l.getPeriodo()).toString(),
                    l.getFechaLectura(),
                    inicial ? null : l.getLecturaAnterior(),
                    l.getLecturaActual(),
                    inicial ? null : l.getConsumoM3(),
                    inicial,
                    SIMULADA.equals(l.getOrigen()));
        }).toList();
    }

    private SuministroCiudadanoDTO aDto(Suministro s) {

        Medidor medidor = medidorRepository
                .findBySuministroIdAndEstado(s.getId(), "ACTIVO").orElse(null);

        Lectura ultima = medidor == null ? null
                : lecturaRepository.ultimaValida(medidor.getId()).orElse(null);

        boolean hayConsumo = ultima != null && !INICIAL.equals(ultima.getOrigen());

        return new SuministroCiudadanoDTO(
                s.getId(),
                s.getCodigoSuministro(),
                s.getDireccion(),
                s.getLatitud(),
                s.getLongitud(),
                medidor != null ? medidor.getNumeroSerie() : null,
                medidor != null ? medidor.getFechaInstalacion() : null,
                ultima != null ? ultima.getLecturaActual() : null,
                ultima != null ? ultima.getFechaLectura() : null,
                hayConsumo ? ultima.getConsumoM3() : null,
                ultima != null && SIMULADA.equals(ultima.getOrigen()));
    }
}
