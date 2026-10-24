package com.aquaica.controller;

import java.util.List;
import java.util.Map;

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

import com.aquaica.dto.PersonalRequestDTO;
import com.aquaica.dto.PersonalResponseDTO;
import com.aquaica.dto.TecnicoDisponibleDTO;
import com.aquaica.entity.Especialidad;
import com.aquaica.service.PersonalService;

@RestController
@RequestMapping("/api/personal")
public class PersonalController {

    private final PersonalService personalService;

    public PersonalController(PersonalService personalService) {
        this.personalService = personalService;
    }

    @PostMapping
    public ResponseEntity<PersonalResponseDTO> registrarPersonal(
            @RequestBody PersonalRequestDTO datos) {

        return ResponseEntity.ok(
                personalService.registrarPersonalConUsuario(datos)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<PersonalResponseDTO> actualizarPersonal(
            @PathVariable Long id,
            @RequestBody PersonalRequestDTO datos) {

        return ResponseEntity.ok(
                personalService.actualizarPersonal(id, datos)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> desactivarPersonal(
            @PathVariable Long id) {

        personalService.desactivarPersonal(id);

        return ResponseEntity.ok(
                Map.of("mensaje", "Personal desactivado correctamente")
        );
    }

    @GetMapping
    public ResponseEntity<List<PersonalResponseDTO>> obtenerTodoElPersonal() {

        return ResponseEntity.ok(
                personalService.obtenerTodoElPersonal()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<PersonalResponseDTO> obtenerPorId(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                personalService.obtenerPorId(id)
        );
    }

    @GetMapping("/dni/{dni}")
    public ResponseEntity<PersonalResponseDTO> obtenerPorDni(
            @PathVariable String dni) {

        return ResponseEntity.ok(
                personalService.obtenerPorDni(dni)
        );
    }

    @GetMapping("/especialidades")
    public ResponseEntity<List<Especialidad>> obtenerEspecialidades() {

        return ResponseEntity.ok(
                personalService.obtenerEspecialidades()
        );
    }

    @GetMapping("/tecnicos-disponibles")
    public ResponseEntity<List<TecnicoDisponibleDTO>> obtenerTecnicosDisponibles(
            @RequestParam String tipoProblema) {

        return ResponseEntity.ok(
                personalService.obtenerTecnicosPorTipoProblema(tipoProblema)
        );
    }
}