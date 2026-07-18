export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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

  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';

    if (password === adminPassword) {
      return res.status(200).json({
        success: true,
        token: adminPassword // Usamos la contraseña como token de autorización seguro por HTTPS
      });
    } else {
      return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
    }
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}
