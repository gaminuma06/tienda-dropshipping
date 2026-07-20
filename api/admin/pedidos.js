import { supabase } from '../db.js';

// ---------------------------------------------------------
// 1. INTEGRACIÓN CON DROPI
// ---------------------------------------------------------
async function sendOrderToDropi(orderData) {
  const dropiApiUrl = process.env.DROPI_API_URL || 'https://api.dropi.co';
  const dropiEmail = process.env.DROPI_EMAIL;
  const dropiPassword = process.env.DROPI_PASSWORD;
  
  if (!dropiEmail || !dropiPassword) {
    throw new Error('Credenciales de Dropi no configuradas en las variables de entorno.');
  }
  
  const loginResponse = await fetch(`${dropiApiUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: dropiEmail.trim(), password: dropiPassword.trim() })
  });
  
  if (!loginResponse.ok) {
    const loginErr = await loginResponse.text();
    throw new Error(`Login en Dropi fallido: ${loginErr}`);
  }
  
  const loginResult = await loginResponse.json();
  const token = loginResult.token || (loginResult.data && loginResult.data.token) || loginResult.jwt;
  
  if (!token) throw new Error('Token no encontrado en la respuesta de Dropi');
  
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
                      
  return { success: true, guideNumber: String(guideNumber || ''), data: orderResult };
}

// ---------------------------------------------------------
// 2. INTEGRACIÓN CON EFFI
// ---------------------------------------------------------
async function sendOrderToEffi(orderData) {
  const effiApiUrl = process.env.EFFI_API_URL || 'https://api.effisystems.com';
  const effiApiKey = process.env.EFFI_API_KEY;
  const effiToken = process.env.EFFI_TOKEN;
  
  if (!effiApiKey || !effiToken || effiApiKey.includes('tu-api-key')) {
    throw new Error('Credenciales de Effi no configuradas en las variables de entorno.');
  }
  
  const effiPayload = {
    apiKey: effiApiKey,
    token: effiToken,
    pedido: {
      nombre_cliente: orderData.nombre.trim(),
      celular_cliente: orderData.celular.trim(),
      direccion_entrega: orderData.direccion.trim(),
      ciudad_destinatario: orderData.ciudad.toUpperCase(),
      departamento_destinatario: orderData.departamento.toUpperCase(),
      tipo_despacho: "CONTRAENTREGA",
      productos: orderData.productos.map(p => ({
        sku: p.sku || 'SKU-DEFECTO',
        cantidad: p.cantidad || 1,
        valor_venta: p.precio || 79900
      }))
    }
  };

  const response = await fetch(`${effiApiUrl}/pedidos/crear`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${effiToken}`
    },
    body: JSON.stringify(effiPayload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API de Effi respondió con error: ${errText}`);
  }

  const result = await response.json();
  const guideNumber = result.guia || result.id_guia || (result.data && result.data.guia) || result.numero_pedido;
  
  return { success: true, guideNumber: String(guideNumber || ''), data: result };
}

// ---------------------------------------------------------
// 3. INTEGRACIÓN CON HOKO
// ---------------------------------------------------------
async function sendOrderToHoko(orderData) {
  const hokoApiUrl = process.env.HOKO_API_URL || 'https://api.hoko.com.co';
  const hokoApiKey = process.env.HOKO_API_KEY;
  
  if (!hokoApiKey || hokoApiKey.includes('tu-api-key')) {
    throw new Error('Credenciales de Hoko no configuradas en las variables de entorno.');
  }
  
  const hokoPayload = {
    cliente: {
      nombre: orderData.nombre.trim(),
      celular: orderData.celular.trim(),
      direccion: orderData.direccion.trim(),
      ciudad: orderData.ciudad.toUpperCase(),
      departamento: orderData.departamento.toUpperCase(),
      pais: "COLOMBIA"
    },
    orden: {
      metodo_pago: "contraentrega",
      detalles_envio: "Envio gratis",
      productos: orderData.productos.map(p => ({
        referencia_sku: p.sku || 'SKU-DEFECTO',
        unidades: p.cantidad || 1,
        precio_unidad: p.precio || 79900
      }))
    }
  };

  const response = await fetch(`${hokoApiUrl}/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': hokoApiKey
    },
    body: JSON.stringify(hokoPayload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API de Hoko respondió con error: ${errText}`);
  }

  const result = await response.json();
  const guideNumber = result.numero_guia || (result.data && result.data.guia) || result.id_orden;
  
  return { success: true, guideNumber: String(guideNumber || ''), data: result };
}

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

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,POST,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Validar autorización
  const isAuthorized = await checkAuth(req);
  if (!isAuthorized) {
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

    // 3. Reintentar conexión de pedido a plataforma logística (POST)
    if (req.method === 'POST') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Falta el ID del pedido' });
      }

      const { data: dbData, error: dbError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', id);

      if (dbError || !dbData || dbData.length === 0) {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
      }

      const pedido = dbData[0];
      const productos = pedido.productos_json || [];
      const proveedorLogistico = pedido.proveedor_logistico || 'Dropi';

      if (productos.length === 0) {
        return res.status(400).json({ success: false, error: 'El pedido no tiene productos cargados en formato JSON' });
      }

      const orderPayload = {
        nombre: pedido.nombre,
        celular: pedido.celular,
        direccion: pedido.direccion,
        ciudad: pedido.ciudad,
        departamento: pedido.departamento,
        productos: productos
      };

      try {
        let integrationResponse = { success: false, error: 'Proveedor no soportado' };
        
        if (proveedorLogistico === 'Dropi') {
          integrationResponse = await sendOrderToDropi(orderPayload);
        } else if (proveedorLogistico === 'Effi') {
          integrationResponse = await sendOrderToEffi(orderPayload);
        } else if (proveedorLogistico === 'Hoko') {
          integrationResponse = await sendOrderToHoko(orderPayload);
        }

        if (integrationResponse.success) {
          const guideNumber = integrationResponse.guideNumber;
          
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
          throw new Error(integrationResponse.error || 'Error al conectar con la API logótica.');
        }
      } catch (syncErr) {
        await supabase
          .from('pedidos')
          .update({
            dropi_status: 'Error API',
            error_log: syncErr.message
          })
          .eq('id', id);

        return res.status(500).json({
          success: false,
          error: syncErr.message
        });
      }
    }

    // 4. Eliminar un pedido (DELETE)
    if (req.method === 'DELETE') {
      const { id: deleteId } = req.query;

      if (!deleteId) {
        return res.status(400).json({ success: false, error: 'Falta el ID del pedido a eliminar' });
      }

      const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Pedido eliminado exitosamente'
      });
    }

    return res.status(405).json({ success: false, error: 'Método no permitido' });

  } catch (error) {
    console.error('Error en API de pedidos:', error);
    return res.status(500).json({ success: false, error: 'Error en la base de datos' });
  }
}
