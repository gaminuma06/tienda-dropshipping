-- ==========================================================
-- SCRIPT DE SEMILLA (SEED): CATÁLOGO BASE DE DROPSHIPPING
-- Ejecuta este código en el SQL Editor de tu Supabase
-- para cargar 3 productos estrella listos para vender.
-- ==========================================================

INSERT INTO productos (
  nombre, 
  descripcion, 
  precio, 
  precio_antiguo, 
  sku, 
  dropi_id, 
  proveedor, 
  imagenes, 
  opciones, 
  slug, 
  beneficios, 
  testimonios, 
  activo
) VALUES 
(
  'Smartwatch T900 Ultra Series 8',
  'El reloj inteligente más vendido del mercado. Con pantalla táctil de alta definición, monitoreo de ritmo cardíaco, llamadas Bluetooth directas y resistencia al agua. El accesorio ideal para tu día a día y deportes.',
  79900,
  135000,
  'SW-T900-ULTRA',
  '84725',
  'Dropi',
  ARRAY[
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600'
  ],
  '["Negro", "Naranja", "Gris"]'::jsonb,
  'smartwatch-t900-ultra',
  '[
    {"icon": "🔋", "title": "Batería de larga duración", "text": "Hasta 5 días de uso continuo y carga inalámbrica magnética rápida."},
    {"icon": "📞", "title": "Llamadas Bluetooth", "text": "Responde y realiza llamadas directamente desde tu muñeca sin sacar el celular."},
    {"icon": "🏃", "title": "Multideporte", "text": "Monitorea pasos, calorías y ritmo cardíaco en tiempo real para 12 disciplinas."}
  ]'::jsonb,
  '[
    {"stars": 5, "name": "Carlos M. (Bogotá)", "text": "Excelente reloj, llegó al día siguiente y pagué en efectivo al recibirlo. Muy buena pantalla."},
    {"stars": 5, "name": "Sandra P. (Medellín)", "text": "Super recomendado, la batería le dura bastante y se conecta muy fácil al iPhone."}
  ]'::jsonb,
  true
),
(
  'Afeitadora Profesional Shaver Pro 2.0',
  'Consigue un afeitado al ras y contornos perfectos sin irritación. Diseñada para uso profesional y personal, con motor de alta potencia, cuchillas de titanio hipoalergénicas y pantalla LED de batería.',
  89900,
  149000,
  'SHAVER-PRO-20',
  '91204',
  'Effi',
  ARRAY[
    'https://images.unsplash.com/photo-1621607512214-68297480165e?q=80&w=600',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600'
  ],
  '["Dorado", "Negro Metálico"]'::jsonb,
  'afeitadora-professional-shaver',
  '[
    {"icon": "⚡", "title": "Motor Turbo Potente", "text": "Motor de 7200 RPM que corta cualquier tipo de cabello o barba sin tirones."},
    {"icon": "🛡️", "title": "Sin Irritación", "text": "Cuchillas hipoalergénicas que protegen la piel sensible previniendo rojeces."},
    {"icon": "🔌", "title": "Carga USB Rápida", "text": "Batería de Litio de 1200mAh con carga rápida USB-C en 1.5 horas."}
  ]'::jsonb,
  '[
    {"stars": 5, "name": "Andrés F. (Cali)", "text": "La mejor afeitadora que he tenido, corta al ras perfecto y el diseño metálico se siente premium."},
    {"stars": 4, "name": "Manuel G. (Barranquilla)", "text": "Muy potente y fácil de limpiar. Llegó muy rápido a mi casa."}
  ]'::jsonb,
  true
),
(
  'Organizador de Viaje Impermeable Premium',
  'Mantén tu equipaje perfectamente ordenado y libre de humedad con este set de organizadores de viaje impermeables. Incluye 6 bolsas de diferentes tamaños con cremalleras reforzadas y malla respirable.',
  49900,
  85000,
  'TRAVEL-BAGS-6P',
  '120473',
  'Hoko',
  ARRAY[
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600',
    'https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=600'
  ],
  '["Azul Oscuro", "Rosa Pastel", "Gris Oxford"]'::jsonb,
  'organizador-viaje-impermeable',
  '[
    {"icon": "💦", "title": "Material Impermeable", "text": "Tela Oxford de alta calidad resistente al agua para proteger toda tu ropa."},
    {"icon": "🗂️", "title": "Set Completo de 6 Piezas", "text": "Diferentes tamaños para camisas, zapatos, ropa interior y accesorios de aseo."},
    {"icon": "💨", "title": "Malla Transpirable", "text": "Diseño superior de malla para identificar fácilmente el contenido y evitar malos olores."}
  ]'::jsonb,
  '[
    {"stars": 5, "name": "Patricia R. (Pereira)", "text": "Excelente compra. Me sirvió muchísimo para organizar mi maleta en las vacaciones. Todo queda ordenado."},
    {"stars": 5, "name": "Jorge T. (Bucaramanga)", "text": "Muy útiles y el material es fuerte. La entrega fue rápida y sin problemas de pago."}
  ]'::jsonb,
  true
);
