import { supabase } from '../db.js';

// Función para enviar el pedido a la API de Dropi (Misma que en create-order.js)
async function sendOrderToDropi(orderData) {
  const dropiApiUrl = process.env.DROPI_API_URL || 'https://api.dropi.co';
  const dropiEmail = process.env.DROPI_EMAIL;
  const dropiPassword = process.env.DROPI_PASSWORD;
  
  if (!dropiEmail || !dropiPassword) {
    throw new Error('Credenciales de Dropi no configuradas en las variables de entorno.');
  }
  
  // 1. Login en Dropi para obtener Token JWT
  const loginResponse = await fetch(`${dropiApiUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: dropiEmail.trim(),
      password: dropiPassword.trim()
    })
  });
  
  if (!loginResponse.ok) {
    const loginErr = await loginResponse.text();
    throw new Error(`Login en Dropi fallido: ${loginErr}`);
  }
  
  const loginResult = await loginResponse.json();
  const token = loginResult.token || (loginResult.data && loginResult.data.token) || loginResult.jwt;
  
  if (!token) {
    throw new Error('Token no encontrado en la respuesta del inicio de sesión de Dropi.');
  }
  
  // 2. Mapear datos a la estructura que requiere la API de Dropi
  const nameParts = orderData.nombre.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '.';
  
  const dropiProducts = orderData.productos.map(p => ({
    id: parseInt(p.dropi_id) || 12345,
    quantity: parseInt(p.cantidad) || 1,
    price: parseFloat(p.precio) || 79900
  }));
  
  const dropiPayload = {
    calculate_costs_and_shiping: true,
    state: orderData.departamento.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
    city: orderData.ciudad.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
    client_email: 'tienda@dropshipping.com',
    name: firstName,
    surname: lastName,
    dir: orderData.direccion,
    phone: orderData.celular,
    products: dropiProducts
  };
  
  // 3. Registrar la orden en Dropi
  const orderResponse = await fetch(`${dropiApiUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(dropiPayload)
  });
  
  if (!orderResponse.ok) {
    const orderErr = await orderResponse.text();
    throw new Error(`Error en creación de orden de Dropi: ${orderErr}`);
  }
  
  const orderResult = await orderResponse.json();
  
  const guideNumber = orderResult.shipping_guide_number || 
                      (orderResult.data && orderResult.data.numero_guia) || 
                      (orderResult.data && orderResult.data.id) ||
                      orderResult.id;
                      
  return {
    success: true,
    guideNumber: String(guideNumber || ''),
    data: orderResult
  };
}

function checkAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;
  
  const token = authHeader.replace('Bearer ', '').trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';
  
  return token === adminPassword;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Validar autorización
  if (!checkAuth(req)) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  try {
    // 1. Obtener listado de pedidos (GET)
    if (req.method === 'GET') {
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, pedidos });
    }

    // 2. Actualizar estado de un pedido (PATCH)
    if (req.method === 'PATCH') {
      const { id, estado_guia, id_guia_dropi, dropi_status } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Falta el ID del pedido' });
      }

      const updateData = {};
      if (estado_guia !== undefined) updateData.estado_guia = estado_guia;
      if (id_guia_dropi !== undefined) updateData.id_guia_dropi = id_guia_dropi;
      if (dropi_status !== undefined) updateData.dropi_status = dropi_status;

      const { data: pedidoActualizado, error } = await supabase
        .from('pedidos')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Pedido actualizado con éxito',
        pedido: pedidoActualizado[0]
      });
    }

    // 3. Reintentar conexión de pedido a Dropi (POST)
    if (req.method === 'POST') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Falta el ID del pedido' });
      }

      // Obtener pedido de la base de datos
      const { data: dbData, error: dbError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', id);

      if (dbError || !dbData || dbData.length === 0) {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
      }

      const pedido = dbData[0];
      const productos = pedido.productos_json || [];

      if (productos.length === 0) {
        return res.status(400).json({ success: false, error: 'El pedido no tiene productos cargados en formato JSON' });
      }

      // Intentar integración
      try {
        const dropiIntegration = await sendOrderToDropi({
          nombre: pedido.nombre,
          celular: pedido.celular,
          direccion: pedido.direccion,
          ciudad: pedido.ciudad,
          departamento: pedido.departamento,
          productos: productos
        });

        if (dropiIntegration.success) {
          const guideNumber = dropiIntegration.guideNumber;
          
          // Guardar éxito en Supabase
          await supabase
            .from('pedidos')
            .update({
              id_guia_dropi: guideNumber,
              dropi_status: 'Enviado',
              estado_guia: 'Confirmado',
              error_log: null
            })
            .eq('id', id);

          return res.status(200).json({
            success: true,
            guideNumber
          });
        } else {
          throw new Error(dropiIntegration.error || 'Error al conectar con Dropi');
        }
      } catch (dropiErr) {
        // Registrar error en Supabase
        await supabase
          .from('pedidos')
          .update({
            dropi_status: 'Error API',
            error_log: dropiErr.message
          })
          .eq('id', id);

        return res.status(500).json({
          success: false,
          error: dropiErr.message
        });
      }
    }

    // Método no soportado
    return res.status(405).json({ success: false, error: 'Método no permitido' });

  } catch (error) {
    console.error('Error en API de pedidos:', error);
    return res.status(500).json({ success: false, error: 'Error en la base de datos' });
  }
}
