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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Comprobar autorización para ver los anuncios espías
  const isAuthorized = await checkAuth(req);
  if (!isAuthorized) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    try {
      // Consultar anuncios espía ordenados por más días activos
      const { data: anuncios, error } = await supabase
        .from('anuncios_espia')
        .select('*')
        .order('days_active', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ success: true, anuncios });
    } catch (err) {
      console.error('Error al consultar anuncios espía:', err);
      return res.status(500).json({ success: false, error: 'Error en la base de datos' });
    }
  }

  return res.status(405).json({ success: false, error: 'Método no permitido' });
}
