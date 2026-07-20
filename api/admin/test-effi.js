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

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  // Verificar autenticación del admin
  const isAuthorized = await checkAuth(req);
  if (!isAuthorized) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const effiApiUrl = process.env.EFFI_API_URL || 'https://api.effisystems.com';
  const effiApiKey = process.env.EFFI_API_KEY;
  const effiToken = process.env.EFFI_TOKEN;

  if (!effiApiKey || !effiToken || effiApiKey.includes('tu-api-key')) {
    return res.status(400).json({ 
      success: false, 
      error: 'Las credenciales de Effi no están configuradas en las variables de entorno o contienen el valor por defecto.' 
    });
  }

  try {
    // Realizamos una consulta simulada enviando un payload mínimo inválido de pedido.
    // Si la autenticación es exitosa, el servidor de Effi validará las credenciales primero
    // y nos responderá con un error de validación de campos del pedido (lo cual confirma que el Token es correcto).
    // Si responde 401, 403 o error de token, entonces la autenticación falló.
    const response = await fetch(`${effiApiUrl}/pedidos/crear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effiToken}`
      },
      body: JSON.stringify({
        apiKey: effiApiKey,
        token: effiToken,
        pedido: {} // Pedido vacío para forzar validación del esquema de datos
      })
    });

    const status = response.status;
    const responseText = await response.text();
    let responseData = null;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      // No es JSON, manejamos texto plano
    }

    // Análisis de la respuesta de Effi
    if (status === 200 || status === 201) {
      // Caso improbable (que un pedido vacío cree algo, pero si ocurre, las credenciales son válidas)
      return res.status(200).json({ 
        success: true, 
        message: 'Conexión exitosa. Las credenciales de Effi Systems son correctas.' 
      });
    }

    // Errores comunes de autenticación
    if (status === 401 || status === 403 || (responseData && (responseData.error === 'Unauthorized' || responseText.toLowerCase().includes('token') || responseText.toLowerCase().includes('key')))) {
      return res.status(400).json({
        success: false,
        error: 'Error de Autenticación en Effi: Clave API o Token inválidos.',
        details: responseData || responseText
      });
    }

    // Si devuelve errores del tipo de datos (por ejemplo, "falta nombre_cliente", "pedido vacío"),
    // significa que logramos superar la barrera de autenticación (la llave es correcta).
    if (status === 400 || status === 422 || responseText.includes('nombre_cliente') || responseText.includes('celular_cliente')) {
      return res.status(200).json({
        success: true,
        message: 'Conexión exitosa. El servidor de Effi validó las credenciales correctamente (Respuesta: Esquema de Pedido validado).'
      });
    }

    // Cualquier otro error de servidor o de red
    return res.status(status).json({
      success: false,
      error: `Respuesta inesperada de Effi (Código ${status})`,
      details: responseData || responseText
    });

  } catch (error) {
    console.error('Error testeando conexión con Effi:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error al conectar con la API de Effi: ' + error.message 
    });
  }
}
