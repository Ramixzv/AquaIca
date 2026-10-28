package com.aquaica.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.AuthRequestDTO;
import com.aquaica.dto.AuthResponseDTO;
import com.aquaica.dto.GoogleLoginDTO;
import com.aquaica.dto.GoogleRegistroDTO;
import com.aquaica.dto.RegistroCiudadanoDTO;
import com.aquaica.service.AuthService;
import com.aquaica.service.GoogleAuthService;
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;

    public AuthController(AuthService authService, GoogleAuthService googleAuthService) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
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


@PostMapping("/google")
public ResponseEntity<AuthResponseDTO> loginGoogle(
        @RequestBody GoogleLoginDTO request) {

    AuthResponseDTO respuesta =
            googleAuthService.loginGoogle(request.getCredential());

    return ResponseEntity.ok(respuesta);
}


@PostMapping("/google/registro")
public ResponseEntity<AuthResponseDTO> registrarGoogle(
        @RequestBody GoogleRegistroDTO request) {

    AuthResponseDTO respuesta =
            googleAuthService.registrarGoogle(request);

    return ResponseEntity.status(HttpStatus.CREATED)
            .body(respuesta);
}


}