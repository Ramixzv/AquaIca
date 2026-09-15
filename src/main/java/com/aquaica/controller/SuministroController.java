package com.aquaica.controller;

import com.aquaica.entity.Suministro;
import com.aquaica.service.SuministroService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/suministros")
public class SuministroController {

    private final SuministroService suministroService;

    public SuministroController(SuministroService suministroService) {
        this.suministroService = suministroService;
    }

    @GetMapping("/{codigo}")
    public ResponseEntity<Suministro> buscarPorCodigo(
            @PathVariable String codigo) {

        return suministroService.buscarPorCodigo(codigo)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}