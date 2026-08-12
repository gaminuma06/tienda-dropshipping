import { supabase } from '../db.js';

async function checkAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return false;
    return true;
  } catch (err) {
    return false;
  }
}

// Dropi no documenta públicamente el nombre exacto de cada campo del producto,
// así que probamos los alias más comunes hasta encontrar un valor.
function pick(obj, keys, fallback = null) {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return fallback;
}

function normalizeDropiProduct(raw) {
  const id = pick(raw, ['id', 'product_id', 'productId']);
  const nombre = pick(raw, ['name', 'nombre', 'title', 'nombre_producto'], 'Producto sin nombre');
  const precio = parseFloat(pick(raw, ['price', 'precio', 'sale_price', 'suggested_price', 'precio_sugerido_de_venta'], 0)) || 0;
  const sku = pick(raw, ['sku', 'SKU', 'reference', 'referencia']);

  let imagenes = pick(raw, ['images', 'imagenes', 'gallery', 'photos', 'galeria'], []);
  if (!Array.isArray(imagenes)) {
    imagenes = imagenes ? [imagenes] : [];
  }
  imagenes = imagenes
    .map(img => (typeof img === 'string' ? img : (img && (img.url || img.image || img.src)) || null))
    .filter(Boolean);
  if (imagenes.length === 0) {
    const single = pick(raw, ['image', 'imagen', 'main_image', 'thumbnail']);
    if (single) imagenes = [single];
  }

  const descripcion = pick(raw, ['description', 'descripcion'], '');
  const stock = pick(raw, ['stock', 'quantity', 'disponible']);

  return { dropi_id: id !== null ? String(id) : null, nombre, precio, sku, imagenes, descripcion, stock };
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  const isAuthorized = await checkAuth(req);
  if (!isAuthorized) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const dropiApiUrl = process.env.DROPI_API_URL || 'https://api.dropi.co';
  const dropiIntegrationKey = process.env.DROPI_INTEGRATION_KEY;

  if (!dropiIntegrationKey || dropiIntegrationKey.includes('tu-clave-de-integracion')) {
    return res.status(400).json({
      success: false,
      error: 'DROPI_INTEGRATION_KEY no está configurada. Genera la clave de integración en el panel de Dropi (sección Integraciones) y pégala en tus variables de entorno.'
    });
  }

  const page = parseInt(req.query.page) || 1;
  const keywords = req.query.keywords ? String(req.query.keywords).trim() : '';

  try {
    const dropiResponse = await fetch(`${dropiApiUrl}/integrations/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'dropi-integration-key': dropiIntegrationKey
      },
      body: JSON.stringify({
        page,
        order_by: 'id',
        order_type: 'DESC',
        keywords,
        category: []
      })
    });

    const rawText = await dropiResponse.text();
    let dropiData = null;
    try {
      dropiData = JSON.parse(rawText);
    } catch (e) {
      // Respuesta no-JSON de Dropi (poco común)
    }

    if (!dropiResponse.ok || (dropiData && dropiData.isSuccess === false)) {
      const dropiMessage = (dropiData && dropiData.message) || rawText || 'Error desconocido de Dropi';
      console.error('Dropi rechazó la consulta del catálogo:', dropiResponse.status, dropiMessage, dropiData);
      return res.status(502).json({
        success: false,
        error: `Dropi rechazó la conexión: ${dropiMessage}`,
        dropi_detail: dropiData || rawText
      });
    }

    const items = Array.isArray(dropiData) ? dropiData
      : Array.isArray(dropiData.data) ? dropiData.data
      : Array.isArray(dropiData.products) ? dropiData.products
      : Array.isArray(dropiData.objects) ? dropiData.objects
      : [];

    if (items.length > 0) {
      // Log de depuración: ayuda a ajustar los alias de normalizeDropiProduct
      // con la forma real del primer producto devuelto por Dropi.
      console.log('Dropi - forma cruda del primer producto:', JSON.stringify(items[0]));
    }

    const productos = items.map(normalizeDropiProduct);

    return res.status(200).json({ success: true, page, productos });
  } catch (error) {
    console.error('Error consultando el catálogo de Dropi:', error);
    return res.status(500).json({ success: false, error: 'Error de conexión con la API de Dropi: ' + error.message });
  }
}
