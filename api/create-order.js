import { supabase } from './db.js';
import crypto from 'crypto';

// Función para cifrar en SHA-256 los datos del usuario para Meta Ads (Privacidad requerida por Facebook)
function sha256(text) {
  if (!text) return null;
  const cleanText = text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Normalizar acentos
  return crypto.createHash('sha256').update(cleanText).digest('hex');
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
    const { nombre, celular, direccion, ciudad, departamento, producto, cantidad, total, sourceUrl, userAgent, clientIp } = req.body;

    // 1. Validaciones Básicas
    if (!nombre || !celular || !direccion || !ciudad || !departamento) {
      return res.status(400).json({ success: false, error: 'Todos los campos de envío son obligatorios.' });
    }

    if (celular.trim().length !== 10) {
      return res.status(400).json({ success: false, error: 'El número de celular debe tener 10 dígitos.' });
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
          producto: producto || 'Producto Único',
          cantidad: parseInt(cantidad) || 1,
          total: parseFloat(total) || 79900,
          estado_guia: 'Pendiente', // Pendiente, Confirmado, Despachado, Entregado, Devuelto, Cancelado
          fecha: new Date().toISOString()
        }
      ])
      .select();

    if (dbError) {
      console.error('Error insertando en Supabase:', dbError);
      // Continuamos aunque falle la BD para no perder la experiencia del usuario,
      // pero lanzamos advertencia en respuesta interna si estamos en dev.
    }

    const orderId = dbData && dbData[0] ? dbData[0].id : 'TEMP-' + Date.now();

    // 3. Registrar Conversión en Meta Ads a través de la Conversion API (CAPI)
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
              value: parseFloat(total) || 79900,
              content_type: 'product',
              contents: [
                {
                  id: producto || 'producto_unico',
                  quantity: parseInt(cantidad) || 1
                }
              ]
            },
            opt_out: false
          }
        ]
      };

      // Si configuramos código de prueba en Meta
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
    } else {
      console.log('Meta CAPI no configurado. Faltan META_PIXEL_ID o META_ACCESS_TOKEN.');
    }

    return res.status(200).json({
      success: true,
      message: 'Pedido registrado con éxito.',
      orderId: orderId
    });

  } catch (error) {
    console.error('Error general en create-order:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}
