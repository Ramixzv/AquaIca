package com.aquaica.controller;

import com.aquaica.dto.AuthRequestDTO;
import com.aquaica.dto.AuthResponseDTO;
import com.aquaica.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}