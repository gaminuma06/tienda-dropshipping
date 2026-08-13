export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  const pixelId = process.env.META_PIXEL_ID;
  const isConfigured = pixelId && !pixelId.includes('tu-id-del-pixel');

  return res.status(200).json({
    success: true,
    metaPixelId: isConfigured ? pixelId : null
  });
}
