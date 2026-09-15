package com.aquaica.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.aquaica.dto.PersonalResponseDTO;
import com.aquaica.entity.Personal;
import com.aquaica.repository.PersonalRepository;

@Service
public class PersonalService {

    private final PersonalRepository personalRepository;

    public PersonalService(PersonalRepository personalRepository) {
        this.personalRepository = personalRepository;
    }

    public Personal registrarPersonal(Personal personal) {

        
        if (personal.getEstado() == null || personal.getEstado().isBlank()) {
            personal.setEstado("ACTIVO");
        }

        
        if (personal.getFechaRegistro() == null) {
            personal.setFechaRegistro(LocalDateTime.now());
        }

        return personalRepository.save(personal);
    }

    public List<PersonalResponseDTO> obtenerTodoElPersonal() {

        return personalRepository.obtenerTodoElPersonal();
    }

    public PersonalResponseDTO obtenerPorDni(String dni) {

        return personalRepository.obtenerPersonalPorDni(dni)
                .orElseThrow(() ->
                        new RuntimeException("Personal no encontrado"));
    }
}