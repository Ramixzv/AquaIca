package com.aquaica.service;

import com.aquaica.entity.Suministro;
import com.aquaica.repository.SuministroRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class SuministroService {

    private final SuministroRepository suministroRepository;

    public SuministroService(SuministroRepository suministroRepository) {
        this.suministroRepository = suministroRepository;
    }

    public Optional<Suministro> buscarPorCodigo(String codigo) {
        return suministroRepository.findByCodigoSuministro(codigo);
    }
}