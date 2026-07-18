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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 1. Lectura pública de productos (GET)
  // Permitimos GET sin estar autenticado para poder renderizar las Landing Pages y el catálogo principal.
  if (req.method === 'GET') {
    try {
      const { slug, id } = req.query;

      let query = supabase.from('productos').select('*');

      if (slug) {
        query = query.eq('slug', slug).eq('activo', true);
      } else if (id) {
        query = query.eq('id', id);
      } else {
        // Si no hay filtro, listar todos (para el admin o el catálogo)
        query = query.order('id', { ascending: true });
      }

      const { data: productos, error } = await query;
      if (error) throw error;

      return res.status(200).json({ success: true, productos });
    } catch (error) {
      console.error('Error al consultar productos:', error);
      return res.status(500).json({ success: false, error: 'Error en la base de datos' });
    }
  }

  // A partir de aquí, TODOS los demás métodos (POST, PUT, DELETE) requieren autorización
  const isAuthorized = await checkAuth(req);
  if (!isAuthorized) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  try {
    const { id, nombre, descripcion, precio, precio_antiguo, sku, dropi_id, imagenes, opciones, slug, beneficios, testimonios, activo, proveedor } = req.body;

    // 2. Crear un producto (POST)
    if (req.method === 'POST') {
      if (!nombre || !sku || !slug || !precio || !imagenes) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios para el producto.' });
      }

      const { data: nuevoProducto, error } = await supabase
        .from('productos')
        .insert([
          {
            nombre: nombre.trim(),
            descripcion: descripcion ? descripcion.trim() : '',
            precio: parseFloat(precio),
            precio_antiguo: precio_antiguo ? parseFloat(precio_antiguo) : null,
            sku: sku.trim().toUpperCase(),
            dropi_id: dropi_id ? dropi_id.trim() : null,
            proveedor: proveedor ? proveedor.trim() : 'Dropi',
            imagenes: Array.isArray(imagenes) ? imagenes : [imagenes],
            opciones: Array.isArray(opciones) ? opciones : [],
            slug: slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, ''), // URL friendly
            beneficios: Array.isArray(beneficios) ? beneficios : [],
            testimonios: Array.isArray(testimonios) ? testimonios : [],
            activo: activo !== undefined ? activo : true
          }
        ])
        .select();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        producto: nuevoProducto[0]
      });
    }

    // 3. Editar un producto (PUT)
    if (req.method === 'PUT') {
      if (!id) {
        return res.status(400).json({ success: false, error: 'Falta el ID del producto a editar' });
      }

      const updateData = {};
      if (nombre !== undefined) updateData.nombre = nombre.trim();
      if (descripcion !== undefined) updateData.descripcion = descripcion.trim();
      if (precio !== undefined) updateData.precio = parseFloat(precio);
      if (precio_antiguo !== undefined) updateData.precio_antiguo = precio_antiguo ? parseFloat(precio_antiguo) : null;
      if (sku !== undefined) updateData.sku = sku.trim().toUpperCase();
      if (dropi_id !== undefined) updateData.dropi_id = dropi_id ? dropi_id.trim() : null;
      if (proveedor !== undefined) updateData.proveedor = proveedor.trim();
      if (imagenes !== undefined) updateData.imagenes = Array.isArray(imagenes) ? imagenes : [imagenes];
      if (opciones !== undefined) updateData.opciones = Array.isArray(opciones) ? opciones : [];
      if (slug !== undefined) updateData.slug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
      if (beneficios !== undefined) updateData.beneficios = Array.isArray(beneficios) ? beneficios : [];
      if (testimonios !== undefined) updateData.testimonios = Array.isArray(testimonios) ? testimonios : [];
      if (activo !== undefined) updateData.activo = activo;

      const { data: productoEditado, error } = await supabase
        .from('productos')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Producto actualizado exitosamente',
        producto: productoEditado[0]
      });
    }

    // 4. Eliminar un producto (DELETE)
    if (req.method === 'DELETE') {
      const { id: deleteId } = req.query;

      if (!deleteId) {
        return res.status(400).json({ success: false, error: 'Falta el ID del producto a eliminar' });
      }

      // En lugar de borrar físicamente, se puede desactivar para no romper el historial de pedidos
      const { error } = await supabase
        .from('productos')
        .update({ activo: false })
        .eq('id', deleteId);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Producto desactivado exitosamente'
      });
    }

    // Método no soportado
    return res.status(405).json({ success: false, error: 'Método no permitido' });

  } catch (error) {
    console.error('Error en API de productos:', error);
    return res.status(500).json({ success: false, error: 'Error en la base de datos' });
  }
}
