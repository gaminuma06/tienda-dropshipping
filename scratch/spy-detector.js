import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Función para parsear manualmente el archivo .env sin dependencias
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const index = trimmed.indexOf('=');
        if (index !== -1) {
          const key = trimmed.substring(0, index).trim();
          let val = trimmed.substring(index + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          process.env[key] = val;
        }
      });
    }
  } catch (err) {
    console.error('Error al cargar .env:', err);
  }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_URL.includes('tu-proyecto')) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log('✅ Supabase conectado exitosamente.');
} else {
  console.log('⚠️ Credenciales de Supabase no configuradas localmente. Los anuncios se guardarán en un archivo JSON local.');
}

// Configuración de palabras clave para buscar en Colombia
const PALABRAS_CLAVE = ['pago contra entrega', 'envio gratis', 'paga al recibir'];
const DIAS_MINIMOS = 7; // Consideramos ganador a partir de 7 días corriendo campaña

// Traducir meses en español a números para parsear fechas
const MESES = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
};

// Parsea fechas del tipo "15 jul 2026", "5 de jun. de 2026", etc.
function parseFechaMeta(textoFecha) {
  try {
    if (!textoFecha) return new Date();
    
    // Normalizar texto
    let limpia = textoFecha.toLowerCase()
      .replace(/se empezó a emitir el/g, '')
      .replace(/inició circulación el/g, '')
      .replace(/desde el/g, '')
      .replace(/de/g, '')
      .replace(/\./g, '')
      .trim();

    // Buscar día, mes (letras) y año
    const partes = limpia.split(/\s+/);
    if (partes.length >= 3) {
      const dia = parseInt(partes[0], 10);
      const mesTexto = partes[1];
      const anio = parseInt(partes[2], 10);

      const mesNum = MESES[mesTexto] !== undefined ? MESES[mesTexto] : new Date().getMonth();
      return new Date(anio, mesNum, dia);
    }
  } catch (err) {
    console.error('Error al parsear fecha:', textoFecha, err);
  }
  return new Date();
}

// Analizador heurístico de marketing para copys
function analizarCopyYViabilidad(copy, pageName, allPageNames) {
  if (!copy) {
    return {
      diagnostico: 'El anuncio no tiene copy de texto visible.',
      oportunidad: 'Sin copy para analizar.',
      copyMejorado: 'N/A',
      competencia: 'Baja'
    };
  }

  // Estimar nivel de competencia (basado en cuántas veces aparece esta misma página en los resultados)
  const repeticiones = allPageNames.filter(name => name === pageName).length;
  let competencia = 'Baja';
  if (repeticiones > 4) competencia = 'Alta';
  else if (repeticiones > 1) competencia = 'Media';

  // Diagnóstico del copy
  const tieneCTA = /compra|pide|adquiere|link|enlace|haz clic|escríbenos|whatsapp|url/i.test(copy);
  const tieneUrgencia = /hoy|últimas|quedan|pocas|descuento|promo|sólo por/i.test(copy);
  const tieneGarantia = /garantía|seguro|confianza|devolución/i.test(copy);
  const cantidadEmojis = (copy.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;

  let diagnostico = '';
  if (!tieneCTA) diagnostico += 'Le falta una Llamada a la Acción (CTA) clara y directa. ';
  if (!tieneUrgencia) diagnostico += 'No genera sentido de urgencia o escasez para el lector. ';
  if (!tieneGarantia) diagnostico += 'Le falta mencionar garantías o pago seguro para generar confianza. ';
  if (cantidadEmojis < 3) diagnostico += 'Tiene pocos emojis, lo que reduce la escaneabilidad visual del anuncio. ';

  if (!diagnostico) {
    diagnostico = '¡Copy excelente! Estructurado, persuasivo y con elementos de conversión adecuados.';
  } else {
    diagnostico = 'Mejorable. ' + diagnostico;
  }

  // Oportunidad / Cómo sacarle partido
  let oportunidad = '';
  if (competencia === 'Baja') {
    oportunidad = `¡Alta Oportunidad! Hay muy poca competencia activa anunciando este producto en este momento. Es el momento perfecto para escalarlo rápido con anuncios creativos propios.`;
  } else {
    oportunidad = `Competencia moderada/alta. Para sacarle partido, debes crear ofertas más atractivas (ej. combos Paga 1 Lleva 2) y creativos en video que capten la atención antes de los primeros 3 segundos.`;
  }

  // Sugerencia de Copy Optimizado (Estructura AIDA)
  let copyMejorado = `🔥 ¡PRODUCTO GANADOR DETECTADO! 🔥\n\n`;
  copyMejorado += `🚨 ATENCIÓN: ¿Cansado de buscar la solución perfecta? Nosotros la tenemos para ti.\n\n`;
  copyMejorado += `✨ BENEFICIOS CLAVE:\n`;
  copyMejorado += `✅ Calidad Premium garantizada.\n`;
  copyMejorado += `✅ Práctico, fácil de usar y con resultados inmediatos.\n\n`;
  copyMejorado += `💸 PROMO IMPERDIBLE: Solo por hoy, llévatelo con un 50% de DESCUENTO.\n\n`;
  copyMejorado += `🚚 ENVÍO GRATIS a todo el país y lo mejor: ¡PAGAS AL RECIBIR en la puerta de tu casa! (Pago Contra Entrega 🤝)\n\n`;
  copyMejorado += `👇 ¡Pide el tuyo ahora mismo en el enlace de abajo! Quedan pocas unidades en inventario.\n`;
  copyMejorado += `🔗 [Pega aquí tu enlace de compra de la tienda]`;

  return {
    diagnostico,
    oportunidad,
    copyMejorado,
    competencia
  };
}

async function espiarMeta() {
  console.log('🤖 Iniciando robot de espionaje en Meta Ads Library...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Fingir agente real para saltar protecciones anti-bot de Facebook
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  const anunciosDetectados = [];

  for (const palabra of PALABRAS_CLAVE) {
    const query = encodeURIComponent(`"${palabra}"`);
    const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=CO&q=${query}&media_type=all`;
    
    console.log(`🔍 Buscando anuncios activos con la palabra clave: "${palabra}"...`);
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Auto-scroll para cargar más anuncios (Facebook carga dinámicamente)
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight || totalHeight > 3000) { // Limitamos el scroll para no tardar tanto
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });

      await page.waitForTimeout(2000);

      // Extraer datos de las tarjetas de anuncios
      const ads = await page.evaluate(() => {
        const cards = document.querySelectorAll('div[class*="_7jvw"], div[class*="_8n1_"]'); // Selectores comunes de Meta Ads Card
        const list = [];
        
        cards.forEach(card => {
          try {
            // ID de anuncio
            const idMatch = card.innerText.match(/ID(?: de anuncio)?:?\s*(\d+)/i);
            const adId = idMatch ? idMatch[1] : null;

            // Nombre de la página
            const pageEl = card.querySelector('a[class*="_8n1b"], span[class*="_8n1b"]');
            const pageName = pageEl ? pageEl.innerText.trim() : 'Página Competidora';

            // Fecha de circulación
            const dateEl = card.querySelector('div[class*="_7jvx"]'); // Contenedor que indica cuándo empezó a circular
            const dateText = dateEl ? dateEl.innerText.trim() : null;

            // Copy del anuncio
            const copyEl = card.querySelector('div[class*="_a1sz"], div[class*="_8n1h"]');
            const copyText = copyEl ? copyEl.innerText.trim() : null;

            // Creativo (imagen o video)
            const imgEl = card.querySelector('img[class*="_8n1k"]');
            const creativeUrl = imgEl ? imgEl.src : null;

            // Link al anuncio original
            const linkEl = card.querySelector('a[href*="/ads/library/"]');
            const adLink = linkEl ? linkEl.href : null;

            if (adId && dateText) {
              list.push({ adId, pageName, dateText, copyText, creativeUrl, adLink });
            }
          } catch (e) {
            // Ignorar errores en tarjetas individuales
          }
        });
        
        return list;
      });

      console.log(`📈 Se encontraron ${ads.length} anuncios potenciales para "${palabra}". Procesando...`);

      const todosLosNombresPagina = ads.map(a => a.pageName);

      // Filtrar y estructurar
      ads.forEach(ad => {
        const startDate = parseFechaMeta(ad.dateText);
        const hoy = new Date();
        const diffTime = Math.abs(hoy - startDate);
        const daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Filtrar ganadores (que tengan campañas activas de mínimo 7 días)
        if (daysActive >= DIAS_MINIMOS) {
          // Evitar duplicados en el lote actual
          if (!anunciosDetectados.some(existente => existente.adId === ad.adId)) {
            const analisis = analizarCopyYViabilidad(ad.copyText, ad.pageName, todosLosNombresPagina);
            
            anunciosDetectados.push({
              ad_id: ad.adId,
              page_name: ad.pageName,
              start_date: startDate.toISOString(),
              days_active: daysActive,
              copy_text: ad.copyText || 'Sin copy de texto.',
              creative_url: ad.creativeUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
              ad_link: ad.adLink || `https://www.facebook.com/ads/library/?id=${ad.adId}`,
              competencia: analisis.competencia,
              oportunidad: analisis.oportunidad,
              diagnostico_copy: analisis.diagnostico,
              copy_mejorado: analisis.copyMejorado
            });
          }
        }
      });

    } catch (err) {
      console.error(`❌ Error al rastrear la palabra clave "${palabra}":`, err);
    }
  }

  console.log(`🎯 Detección completada. Total de anuncios ganadores con alta duración: ${anunciosDetectados.length}`);

  // Guardar resultados
  if (anunciosDetectados.length > 0) {
    if (supabase) {
      console.log('📤 Subiendo anuncios ganadores a Supabase...');
      for (const ad of anunciosDetectados) {
        try {
          const { error } = await supabase
            .from('anuncios_espia')
            .upsert(ad, { onConflict: 'ad_id' });
            
          if (error) console.error(`Error al guardar anuncio #${ad.ad_id}:`, error.message);
        } catch (e) {
          console.error(`Excepción al subir anuncio #${ad.ad_id}:`, e);
        }
      }
      console.log('✅ Base de datos actualizada en Supabase.');
    } else {
      // Guardar localmente en archivo JSON
      const outputPath = path.resolve(process.cwd(), 'anuncios_ganadores.json');
      fs.writeFileSync(outputPath, JSON.stringify(anunciosDetectados, null, 2), 'utf8');
      console.log(`💾 Resultados guardados localmente en: ${outputPath}`);
    }
  } else {
    console.log('ℹ️ No se detectaron anuncios que cumplieran el filtro de duración mínima de 7 días.');
  }

  await browser.close();
  console.log('🤖 Robot apagado.');
}

espiarMeta().catch(console.error);
