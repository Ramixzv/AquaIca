package com.aquaica.entity;


public enum Especialidad {

    REDES_FUGAS("Redes y fugas"),
    PRESION_TUBERIAS("Presión y tuberías"),
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

        if (tipoProblema == null) {
            return GENERAL;
        }

        switch (tipoProblema.toUpperCase()) {

            case "FUGA_AGUA":
            case "CORTE_AGUA":
                return REDES_FUGAS;

            case "BAJA_PRESION":
                return PRESION_TUBERIAS;

            case "FACTURACION":
                return FACTURACION;

            default:
                return GENERAL;
        }
    }

    public static boolean esValida(String valor) {

        if (valor == null) {
            return false;
        }

        for (Especialidad especialidad : values()) {

            if (especialidad.name().equalsIgnoreCase(valor)) {
                return true;
            }
        }

        return false;
    }
}