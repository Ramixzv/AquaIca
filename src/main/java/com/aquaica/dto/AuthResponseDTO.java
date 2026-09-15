package com.aquaica.dto;

public class AuthResponseDTO {

    private String token;
    private String username;
    private String rol;
    private Long personalId;

    public AuthResponseDTO() {
    }

    public AuthResponseDTO(
            String token,
            String username,
            String rol,
            Long personalId) {

        this.token = token;
        this.username = username;
        this.rol = rol;
        this.personalId = personalId;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public Long getPersonalId() {
        return personalId;
    }

    public void setPersonalId(Long personalId) {
        this.personalId = personalId;
    }
}