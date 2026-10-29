
package com.aquaica.entity;

import java.util.Locale;

public enum Especialidad {

    REDES_FUGAS("Redes y fugas"),
    PRESION_TUBERIAS("Presión y tuberías"),
    INSTALACIONES_MEDIDORES("Instalaciones y medidores"),
    FACTURACION("Facturación y atención al cliente"),
    GENERAL("Atención general");

    private final String etiqueta;

    Especialidad(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    public static Especialidad paraTipoProblema(String tipoProblema) {

        if (tipoProblema == null || tipoProblema.isBlank()) {
            return GENERAL;
        }

        switch (tipoProblema.trim().toUpperCase(Locale.ROOT)) {

            case "FUGA_AGUA":
            case "CORTE_AGUA":
                return REDES_FUGAS;

            case "BAJA_PRESION":
                return PRESION_TUBERIAS;

            case "FACTURACION":
            case "PROBLEMA_FACTURACION":
                return FACTURACION;

            case "INSTALACION_MEDIDOR":
            case "INSTALACION_DE_MEDIDOR":
            case "NUEVA_CONEXION":
            case "INSTALACION_NUEVA_CONEXION":
                return INSTALACIONES_MEDIDORES;

            default:
                return GENERAL;
        }
    }

    public static boolean esValida(String valor) {

        if (valor == null || valor.isBlank()) {
            return false;
        }

        for (Especialidad especialidad : values()) {
            if (especialidad.name().equalsIgnoreCase(valor.trim())) {
                return true;
            }
        }

        return false;
    }
}
