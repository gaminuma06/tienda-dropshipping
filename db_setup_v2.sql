-- ==========================================================
-- SCRIPT DE MIGRACIÓN: SOPORTE MULTI-PROVEEDOR LOGÍSTICO
-- Ejecuta este código en el SQL Editor de tu Supabase
-- ==========================================================

-- 1. Agregar columna 'proveedor' a la tabla de productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS proveedor text DEFAULT 'Dropi';

-- 2. Agregar columna 'proveedor_logistico' a la tabla de pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS proveedor_logistico text DEFAULT 'Dropi';
