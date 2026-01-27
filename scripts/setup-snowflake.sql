-- ==========================================
-- SCRIPT DE CONFIGURACIÓN INICIAL DE SNOWFLAKE
-- ==========================================
-- INSTRUCCIONES:
-- 1. Copia TODO el contenido de este archivo.
-- 2. Pégalo en un nuevo Worksheet de Snowflake.
-- 3. Selecciona la casilla "All Queries" o simplemente presiona Ctrl+Enter varias veces
--    hasta que todo se ejecute.
--    MEJOR OPCIÓN: Selecciona TODO el texto (Ctrl+A) y dale al botón de "Play" (Run).

-- 1. Crear el Almacén de Cómputo (Warehouse)
CREATE WAREHOUSE IF NOT EXISTS COMPUTE_WH 
WITH WAREHOUSE_SIZE = 'XSMALL' 
AUTO_SUSPEND = 60 
AUTO_RESUME = TRUE 
INITIALLY_SUSPENDED = TRUE;

-- 2. Crear la Base de Datos
CREATE DATABASE IF NOT EXISTS SANTAPALABRA_DB;

-- ==========================================================
-- IMPORTANTE: ASEGURAR QUE ESTAMOS USANDO LA BASE DE DATOS
-- Si obtienes el error "This session does not have a current database",
-- es porque esta línea no se ejecutó.
-- ==========================================================
USE DATABASE SANTAPALABRA_DB;
USE SCHEMA PUBLIC;

-- 3. Crear un Rol para la aplicación (Opcional)
CREATE ROLE IF NOT EXISTS SANTAPALABRA_ROLE;
GRANT USAGE ON WAREHOUSE COMPUTE_WH TO ROLE SANTAPALABRA_ROLE;
GRANT ALL PRIVILEGES ON DATABASE SANTAPALABRA_DB TO ROLE SANTAPALABRA_ROLE;
GRANT ALL PRIVILEGES ON SCHEMA PUBLIC TO ROLE SANTAPALABRA_ROLE;

-- 4. Crear la tabla de ingestión
-- Esta tabla recibirá los datos crudos desde la aplicación Next.js
CREATE TABLE IF NOT EXISTS RAW_DATA_INGESTION (
    ID STRING,
    SOURCE STRING,
    TITLE STRING,
    CONTENT STRING,
    CREATED_AT TIMESTAMP_NTZ
);

-- ==========================================
-- DATOS PARA TU .ENV.LOCAL
-- ==========================================
-- SNOWFLAKE_ACCOUNT: (Ver URL del navegador)
-- SNOWFLAKE_USERNAME: (Tu usuario)
-- SNOWFLAKE_PASSWORD: (Tu contraseña)
-- SNOWFLAKE_WAREHOUSE: COMPUTE_WH
-- SNOWFLAKE_DATABASE: SANTAPALABRA_DB
-- SNOWFLAKE_SCHEMA: PUBLIC
-- SNOWFLAKE_ROLE: ACCOUNTADMIN
