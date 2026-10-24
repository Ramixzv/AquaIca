package com.aquaica.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.AuthRequestDTO;
import com.aquaica.dto.AuthResponseDTO;
import com.aquaica.dto.RegistroCiudadanoDTO;
import com.aquaica.service.AuthService;
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(
            @RequestBody AuthRequestDTO request) {

        AuthResponseDTO respuesta = authService.login(request);

        return ResponseEntity.ok(respuesta);
    }

    @PostMapping("/registro-ciudadano")
public ResponseEntity<String> registrarCiudadano(
        @RequestBody RegistroCiudadanoDTO request) {

    authService.registrarCiudadano(request);

    return ResponseEntity.status(HttpStatus.CREATED)
            .body("Cuenta ciudadana creada correctamente.");
}
}