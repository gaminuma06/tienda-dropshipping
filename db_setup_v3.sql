-- ==========================================================
-- SCRIPT DE MIGRACIÓN: TIPO DE OPCIÓN (Talla / Color / Tamaño)
-- Ejecuta este código en el SQL Editor de tu Supabase
-- ==========================================================

ALTER TABLE productos ADD COLUMN IF NOT EXISTS tipo_opcion text DEFAULT 'Opción';
