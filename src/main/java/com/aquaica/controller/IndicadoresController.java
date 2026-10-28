package com.aquaica.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.IndicadoresDTO;
import com.aquaica.service.IndicadoresService;

/** Solo ADMIN y SOPORTE (regla en SecurityConfig). */
@RestController
@RequestMapping("/api/indicadores")
public class IndicadoresController {

    private final IndicadoresService indicadoresService;

    public IndicadoresController(IndicadoresService indicadoresService) {
        this.indicadoresService = indicadoresService;
    }

    // meses: 3, 6 o 12. incluirPrueba: suma también lecturas simuladas y recibos de prueba.
    @GetMapping
    public ResponseEntity<IndicadoresDTO> obtener(
            @RequestParam(defaultValue = "6") int meses,
            @RequestParam(defaultValue = "false") boolean incluirPrueba) {

        return ResponseEntity.ok(indicadoresService.calcular(meses, incluirPrueba));
    }
}
