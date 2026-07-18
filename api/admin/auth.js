import { supabase } from '../db.js';
import { createClient } from '@supabase/supabase-js';

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
    const { action, email, password } = req.body;

    // 1. FLUJO DE RECUPERACIÓN DE CONTRASEÑA POR EMAIL
    if (action === 'recover') {
      if (!email) {
        return res.status(400).json({ success: false, error: 'Falta el correo electrónico' });
      }

      // Enviar correo de restablecimiento redirigiendo a la ruta /admin de la app
      const redirectUrl = `${req.headers.origin}/admin`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl
      });

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.status(200).json({
        success: true,
        message: 'Correo de recuperación enviado. Por favor revisa tu bandeja de entrada.'
      });
    }

    // 2. FLUJO DE RESTABLECIMIENTO DE NUEVA CONTRASEÑA (CON TOKEN)
    if (action === 'reset-password') {
      if (!password) {
        return res.status(400).json({ success: false, error: 'Falta la nueva contraseña' });
      }

      // Obtener el token de autorización de los headers
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ success: false, error: 'No autorizado. Falta el token de sesión.' });
      }

      const token = authHeader.replace('Bearer ', '').trim();

      // Crear un cliente temporal de Supabase asociado al token del usuario
      const userSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });

      // Actualizar la contraseña en Supabase Auth
      const { error } = await userSupabase.auth.updateUser({ password });

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.status(200).json({
        success: true,
        message: 'Contraseña actualizada con éxito. Ya puedes iniciar sesión.'
      });
    }

    // 3. FLUJO DE INICIO DE SESIÓN ESTÁNDAR
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Faltan campos obligatorios (Email/Contraseña)' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      token: data.session.access_token,
      email: data.user.email
    });

  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}
