import { supabase } from './db.js';
import crypto from 'crypto';

// Función para cifrar en SHA-256 los datos del usuario para Meta Ads (Privacidad requerida por Facebook)
function sha256(text) {
  if (!text) return null;
  const cleanText = text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Normalizar acentos
  return crypto.createHash('sha256').update(cleanText).digest('hex');
}

// Función para enviar el pedido a la API de Dropi
async function sendOrderToDropi(orderData) {
  const dropiApiUrl = process.env.DROPI_API_URL || 'https://api.dropi.co';
  const dropiEmail = process.env.DROPI_EMAIL;
  const dropiPassword = process.env.DROPI_PASSWORD;
  
  if (!dropiEmail || !dropiPassword) {
    console.log('Dropi credentials not configured in environment variables. Skipping API integration.');
    return { success: false, error: 'Credenciales de Dropi no configuradas' };
  }
  
  try {
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
      id: parseInt(p.dropi_id) || 12345, // ID del producto en Dropi (configurado en Supabase)
      quantity: parseInt(p.cantidad) || 1,
      price: parseFloat(p.precio) || 79900
    }));
    
    const dropiPayload = {
      calculate_costs_and_shiping: true,
      state: orderData.departamento.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), // Sin tildes y en mayúscula
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
    
  } catch (error) {
    console.error('Error integrando con la API de Dropi:', error);
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const { nombre, celular, direccion, ciudad, departamento, producto, cantidad, total, productos, sourceUrl, userAgent, clientIp } = req.body;

    // 1. Validaciones Básicas
    if (!nombre || !celular || !direccion || !ciudad || !departamento) {
      return res.status(400).json({ success: false, error: 'Todos los campos de envío son obligatorios.' });
    }

    if (celular.trim().length !== 10) {
      return res.status(400).json({ success: false, error: 'El número de celular debe tener 10 dígitos.' });
    }

    // Adaptar productos si es un pedido de un único producto (para retrocompatibilidad)
    let finalProducts = productos;
    if (!finalProducts || !Array.isArray(finalProducts) || finalProducts.length === 0) {
      finalProducts = [{
        nombre: producto || 'Producto Único',
        cantidad: parseInt(cantidad) || 1,
        precio: parseFloat(total) || 79900,
        sku: 'SKU-DEFECTO',
        dropi_id: '12345'
      }];
    }

    // 2. Insertar pedido en la Base de Datos de Supabase
    const { data: dbData, error: dbError } = await supabase
      .from('pedidos')
      .insert([
        {
          nombre: nombre.trim(),
          celular: celular.trim(),
          direccion: direccion.trim(),
          ciudad: ciudad.trim(),
          departamento: departamento.trim(),
          producto: finalProducts.map(p => `${p.nombre} (x${p.cantidad})`).join(', '), // Resumen en texto
          cantidad: finalProducts.reduce((sum, p) => sum + (p.cantidad || 1), 0),
          total: parseFloat(total) || finalProducts.reduce((sum, p) => sum + ((p.precio * p.cantidad) || 0), 0),
          productos_json: finalProducts,
          estado_guia: 'Pendiente', // Pendiente, Confirmado, Despachado, Entregado, Devuelto, Cancelado
          dropi_status: 'Pendiente API',
          fecha: new Date().toISOString()
        }
      ])
      .select();

    if (dbError) {
      console.error('Error insertando en Supabase:', dbError);
    }

    const orderId = dbData && dbData[0] ? dbData[0].id : 'TEMP-' + Date.now();

    // 3. Integración Automática con Dropi (si hay credenciales configuradas)
    let dropiGuideNumber = null;
    let dropiStatusResult = 'Pendiente API';
    let dropiErrorResult = null;

    if (process.env.DROPI_EMAIL && process.env.DROPI_PASSWORD) {
      const dropiIntegration = await sendOrderToDropi({
        nombre: nombre.trim(),
        celular: celular.trim(),
        direccion: direccion.trim(),
        ciudad: ciudad.trim(),
        departamento: departamento.trim(),
        productos: finalProducts
      });

      if (dropiIntegration.success) {
        dropiGuideNumber = dropiIntegration.guideNumber;
        dropiStatusResult = 'Enviado';

        // Actualizar el pedido en Supabase con el número de guía de Dropi
        await supabase
          .from('pedidos')
          .update({
            id_guia_dropi: dropiGuideNumber,
            dropi_status: dropiStatusResult,
            estado_guia: 'Confirmado'
          })
          .eq('id', orderId);
      } else {
        dropiStatusResult = 'Error API';
        dropiErrorResult = dropiIntegration.error || 'Error desconocido';

        // Registrar el log de error en Supabase
        await supabase
          .from('pedidos')
          .update({
            dropi_status: dropiStatusResult,
            error_log: dropiErrorResult
          })
          .eq('id', orderId);
      }
    }

    // 4. Registrar Conversión en Meta Ads (API de Conversiones - CAPI)
    const pixelId = process.env.META_PIXEL_ID;
    const metaToken = process.env.META_ACCESS_TOKEN;
    const testCode = process.env.META_TEST_EVENT_CODE;

    if (pixelId && metaToken) {
      const unixTimestamp = Math.floor(Date.now() / 1000);

      // Cifrar datos sensibles del usuario
      const hashedPhone = sha256(celular.replace(/\D/g, '')); // Solo números
      const nombrePartes = nombre.split(' ');
      const hashedFirstName = sha256(nombrePartes[0]);
      const hashedLastName = sha256(nombrePartes.slice(1).join(' ') || '');
      const hashedCity = sha256(ciudad);
      const hashedState = sha256(departamento);

      const capiPayload = {
        data: [
          {
            event_name: 'Purchase',
            event_time: unixTimestamp,
            event_source_url: sourceUrl || 'https://tutienda.com',
            action_source: 'website',
            event_id: String(orderId), // deduplicar evento con el pixel del navegador
            user_data: {
              client_ip_address: clientIp || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
              client_user_agent: userAgent || req.headers['user-agent'],
              ph: hashedPhone ? [hashedPhone] : undefined,
              fn: hashedFirstName ? [hashedFirstName] : undefined,
              ln: hashedLastName ? [hashedLastName] : undefined,
              ct: hashedCity ? [hashedCity] : undefined,
              st: hashedState ? [hashedState] : undefined,
              country: [sha256('co')] // Colombia
            },
            custom_data: {
              currency: 'COP',
              value: parseFloat(total) || finalProducts.reduce((sum, p) => sum + ((p.precio * p.cantidad) || 0), 0),
              content_type: 'product',
              contents: finalProducts.map(p => ({
                id: p.sku || 'producto_unico',
                quantity: p.cantidad || 1
              }))
            },
            opt_out: false
          }
        ]
      };

      if (testCode) {
        capiPayload.test_event_code = testCode;
      }

      try {
        const metaResponse = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${metaToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(capiPayload)
        });
        const metaResData = await metaResponse.json();
        console.log('Meta CAPI response:', metaResData);
      } catch (metaErr) {
        console.error('Error enviando a Meta CAPI:', metaErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Pedido registrado con éxito.',
      orderId: orderId,
      dropiStatus: dropiStatusResult,
      dropiGuide: dropiGuideNumber
    });

  } catch (error) {
    console.error('Error general en create-order:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}
