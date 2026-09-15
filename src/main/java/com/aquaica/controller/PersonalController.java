package com.aquaica.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.PersonalResponseDTO;
import com.aquaica.entity.Personal;
import com.aquaica.service.PersonalService;

@RestController
@RequestMapping("/api/personal")
public class PersonalController {

    private final PersonalService personalService;

    public PersonalController(PersonalService personalService) {
        this.personalService = personalService;
    }

    @PostMapping
    public ResponseEntity<Personal> registrarPersonal(
            @RequestBody Personal personal) {

        return ResponseEntity.ok(
                personalService.registrarPersonal(personal)
        );
    }

    @GetMapping
    public ResponseEntity<List<PersonalResponseDTO>> obtenerTodoElPersonal() {

        return ResponseEntity.ok(
                personalService.obtenerTodoElPersonal()
        );
    }

    @GetMapping("/dni/{dni}")
    public ResponseEntity<PersonalResponseDTO> obtenerPorDni(
            @PathVariable String dni) {

        return ResponseEntity.ok(
                personalService.obtenerPorDni(dni)
        );
    }
}