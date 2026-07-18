-- ==========================================================
-- SCRIPT DE SEMILLA (SEED): CATÁLOGO BASE DE DROPSHIPPING
-- Ejecuta este código en el SQL Editor de tu Supabase
-- para cargar 3 productos estrella con descripciones atractivas
-- y estructuradas en HTML.
-- ==========================================================

-- Primero limpiamos los productos de prueba anteriores para evitar duplicados por SKU
DELETE FROM productos WHERE sku IN ('SW-T900-ULTRA', 'SHAVER-PRO-20', 'TRAVEL-BAGS-6P');

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
  '<p>El <strong>Smartwatch T900 Ultra Series 8</strong> es el compañero tecnológico definitivo para tu estilo de vida activo y moderno.</p>
   <h4 style="margin: 1.2rem 0 0.6rem 0; color: #0f172a; font-weight: 800; font-size: 1.15rem;">🔥 Características Clave:</h4>
   <ul style="padding-left: 1.2rem; margin-bottom: 1.2rem; display: flex; flex-direction: column; gap: 0.5rem;">
     <li><strong>Pantalla Infinita de 1.99":</strong> Colores vibrantes y alta definición visible bajo cualquier condición de luz.</li>
     <li><strong>Llamadas Bluetooth HD:</strong> Micrófono y altavoz integrados para responder y realizar llamadas sin sacar tu celular.</li>
     <li><strong>Salud al Día:</strong> Monitoreo de frecuencia cardíaca, oxígeno en sangre, presión y control de sueño profundo.</li>
     <li><strong>Modos de Deporte Inteligentes:</strong> Registra calorías, pasos, distancia y rendimiento físico en tiempo real para 12 disciplinas.</li>
   </ul>
   <p style="margin-top: 1.2rem; font-weight: 600; color: #10b981;">💪 ¡Luce elegante, mantente conectado y monitorea tu día con el diseño deportivo más resistente del mercado!</p>',
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
  '<p>Consigue un afeitado ultra suave, delineados perfectos y contornos limpios sin irritación con la afeitadora profesional <strong>Shaver Pro 2.0</strong>.</p>
   <h4 style="margin: 1.2rem 0 0.6rem 0; color: #0f172a; font-weight: 800; font-size: 1.15rem;">✂️ Beneficios Destacados:</h4>
   <ul style="padding-left: 1.2rem; margin-bottom: 1.2rem; display: flex; flex-direction: column; gap: 0.5rem;">
     <li><strong>Cuchillas de Titanio Auto-afilables:</strong> Evitan la irritación y cortan con precisión quirúrgica el vello más grueso.</li>
     <li><strong>Motor Turbo de 7200 RPM:</strong> Potencia constante sin tirones de vello, ideal para todo tipo de cabello y barba.</li>
     <li><strong>Pantalla LED Digital:</strong> Monitorea en tiempo real el porcentaje de batería y alertas de lubricación.</li>
     <li><strong>Batería de Alta Capacidad:</strong> Hasta 120 minutos de uso continuo inalámbrico con carga rápida USB-C en 1.5 horas.</li>
   </ul>
   <p style="margin-top: 1.2rem; font-weight: 600; color: #10b981;">🛡️ ¡El accesorio ideal para el aseo diario masculino, brindando calidad de barbería en tu propia casa!</p>',
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
  '<p>Viaja con total comodidad, protege tu equipaje y mantén tus pertenencias 100% ordenadas con el <strong>Set Organizador de 6 Piezas</strong>.</p>
   <h4 style="margin: 1.2rem 0 0.6rem 0; color: #0f172a; font-weight: 800; font-size: 1.15rem;">✈️ ¿Por qué lo necesitas?</h4>
   <ul style="padding-left: 1.2rem; margin-bottom: 1.2rem; display: flex; flex-direction: column; gap: 0.5rem;">
     <li><strong>Ahorra hasta un 40% de Espacio:</strong> Comprime y distribuye tu equipaje eficientemente dentro de tu maleta.</li>
     <li><strong>Tejido Oxford Impermeable:</strong> Repela el agua y protege tus prendas de la humedad o derrames de líquidos.</li>
     <li><strong>Malla Superior de Ventilación:</strong> Identifica fácilmente el contenido sin desordenar nada y evita malos olores.</li>
     <li><strong>Kit Multifuncional Completo:</strong> Incluye 6 bolsas de tamaños específicos para ropa interior, calzado, camisas y accesorios.</li>
   </ul>
   <p style="margin-top: 1.2rem; font-weight: 600; color: #10b981;">🗂️ ¡Dile adiós al caos de armar y desarmar equipaje. Viaja cómodo, organizado y sin contratiempos!</p>',
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
