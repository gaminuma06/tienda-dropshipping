import { supabase } from './db.js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    // 1. Obtener pedidos pendientes de despacho de la Base de Datos
    const { data: orders, error: dbError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('estado_guia', 'Confirmado'); // O exportar todos los no despachados

    if (dbError) {
      console.error('Error al obtener pedidos de Supabase:', dbError);
      return res.status(500).json({ success: false, error: 'Error al consultar la base de datos' });
    }

    if (!orders || orders.length === 0) {
      return res.status(200).send('No hay pedidos confirmados para exportar en este momento.');
    }

    // 2. Definir cabeceras del CSV estilo Dropi Carga Masiva
    // Formato estándar Dropi: Nombre, Teléfono, Dirección, Ciudad, Departamento, SKU Producto, Cantidad, Precio Venta, Notas, Metodo Pago
    const headers = [
      'Nombre',
      'Telefono',
      'Direccion',
      'Ciudad',
      'Departamento',
      'SKU_Dropi',
      'Cantidad',
      'Precio_Venta',
      'Notas',
      'Metodo_Pago'
    ];

    // Mapear filas
    const rows = orders.map(order => {
      // Ajustar el SKU del producto según lo tengas en Dropi.
      // Puedes pasar un SKU por defecto o guardarlo en tu tabla de pedidos.
      const sku = order.sku || 'SKU-DEFECTO'; 
      const notas = `Pedido #${order.id} - Enviar lo antes posible.`;
      const metodoPago = 'Contra Entrega'; // Por defecto es contra entrega

      return [
        `"${order.nombre.replace(/"/g, '""')}"`,
        `"${order.celular.replace(/"/g, '""')}"`,
        `"${order.direccion.replace(/"/g, '""')}"`,
        `"${order.ciudad.replace(/"/g, '""')}"`,
        `"${order.departamento.replace(/"/g, '""')}"`,
        `"${sku}"`,
        order.cantidad,
        order.total,
        `"${notas.replace(/"/g, '""')}"`,
        `"${metodoPago}"`
      ];
    });

    // Unir cabeceras y filas con punto y coma (Excel en español prefiere ';')
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\r\n');

    // 3. Responder como un archivo descargable
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=pedidos_dropi_${new Date().toISOString().slice(0,10)}.csv`);
    
    // Añadir BOM (Byte Order Mark) para que Excel reconozca los caracteres en español (tildes, eñes)
    const bom = Buffer.from('\uFEFF', 'utf-8');
    res.status(200).send(Buffer.concat([bom, Buffer.from(csvContent, 'utf-8')]));

  } catch (error) {
    console.error('Error al exportar pedidos:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}
