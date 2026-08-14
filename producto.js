// Base de datos de municipios de Colombia
const ubicacionesColombia = {
  "Bogotá D.C.": ["Bogotá D.C."],
  "Antioquia": ["Medellín", "Bello", "Itagüí", "Envigado", "Rionegro", "Sabaneta", "Caldas", "Copacabana", "La Estrella", "Marinilla"],
  "Valle del Cauca": ["Cali", "Palmira", "Tuluá", "Yumbo", "Buga", "Jamundí", "Cartago", "Buenaventura"],
  "Atlántico": ["Barranquilla", "Soledad", "Malambo", "Puerto Colombia", "Sabanalarga"],
  "Santander": ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja"],
  "Cundinamarca": ["Soacha", "Chía", "Zipaquirá", "Facatativá", "Fusagasugá", "Mosquera", "Funza", "Madrid", "Cajicá", "Girardot"],
  "Bolívar": ["Cartagena", "Turbaco", "Arjona", "Magangué"],
  "Risaralda": ["Pereira", "Dosquebradas", "Santa Rosa de Cabal"],
  "Caldas": ["Manizales", "Villamaría", "Chinchiná"],
  "Quindío": ["Armenia", "Calarcá", "Tebaida"],
  "Norte de Santander": ["Cúcuta", "Villa del Rosario", "Los Patios", "Ocaña"],
  "Tolima": ["Ibagué", "Espinal", "Melgar", "Mariquita"],
  "Huila": ["Neiva", "Pitalito", "Garzón"],
  "Meta": ["Villavicencio", "Acacías", "Granada"],
  "Cesar": ["Valledupar", "Aguachica"],
  "Córdoba": ["Montería", "Cereté", "Lorica"],
  "Magdalena": ["Santa Marta", "Ciénaga"]
};

// Variables globales del producto
let productoActual = null;
let opcionSeleccionada = null;
let ofertaSeleccionada = {
  cantidad: 1,
  precio: 0
};

// Estado del carrusel de imágenes (avanza solo, sin que el cliente tenga que hacer nada)
let carruselImagenes = [];
let carruselIndice = 0;
let carruselTimer = null;
const CARRUSEL_INTERVALO_MS = 3500;

// Referencias del DOM
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const productContent = document.getElementById('product-content');

const landingTitle = document.getElementById('landing-title');
const landingDescription = document.getElementById('landing-description');
const landingPriceOld = document.getElementById('landing-price-old');
const landingPriceCurrent = document.getElementById('landing-price-current');
const landingMainImg = document.getElementById('landing-main-img');
const landingThumbsGrid = document.getElementById('landing-thumbs-grid');
const landingDiscount = document.getElementById('landing-discount');

const heroTitle = document.getElementById('hero-title');
const heroTagline = document.getElementById('hero-tagline');

const variationsContainer = document.getElementById('variations-container');
const optionsButtonsGrid = document.getElementById('options-buttons-grid');

const benefitsSectionContainer = document.getElementById('benefits-section-container');
const benefitsCardsGrid = document.getElementById('benefits-cards-grid');

const reviewsSectionContainer = document.getElementById('reviews-section-container');
const reviewsCardsGrid = document.getElementById('reviews-cards-grid');

const departamentoSelect = document.getElementById('departamento');
const ciudadSelect = document.getElementById('ciudad');
const checkoutForm = document.getElementById('checkout-form');
const successScreen = document.getElementById('success-screen');
const submitBtn = document.getElementById('submit-btn');

// Selector de ofertas e información de totales
const ofertaCardsGrid = document.getElementById('offer-cards-grid');
const btnTotalVal = document.getElementById('btn-total-val');

// Barra flotante de compra (móvil)
const mobileBuyBar = document.getElementById('mobile-buy-bar');
const mobileBuyBarPrice = document.getElementById('mobile-buy-bar-price');

// Obtener el slug del producto desde la URL (?slug=tenis-deportivos o desde la ruta /p/slug)
const urlParams = new URLSearchParams(window.location.search);
let productSlug = urlParams.get('slug');

if (!productSlug) {
  const pathParts = window.location.pathname.split('/');
  const pIndex = pathParts.indexOf('p');
  if (pIndex !== -1 && pathParts[pIndex + 1]) {
    productSlug = pathParts[pIndex + 1];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!productSlug) {
    showError();
    return;
  }
  inicializarUbicaciones();
  inicializarPasoFormulario();
  cargarDatosProducto();
});

// Carga el producto desde la base de datos de Supabase a través de la API pública
async function cargarDatosProducto() {
  try {
    const response = await fetch(`/api/admin/productos?slug=${productSlug}`);
    const data = await response.json();

    if (data.success && data.productos && data.productos.length > 0) {
      productoActual = data.productos[0];
      renderizarProducto();
      inicializarPixel();
    } else {
      showError();
    }
  } catch (err) {
    console.error('Error al cargar datos del producto:', err);
    showError();
  }
}

function showError() {
  loadingState.style.display = 'none';
  errorState.style.display = 'block';
  productContent.style.display = 'none';
}

// Quita etiquetas HTML de la descripción para usarla como texto plano (tagline del hero)
function extraerTextoPlano(html, maxLen) {
  const temp = document.createElement('div');
  temp.innerHTML = html || '';
  const texto = (temp.textContent || '').replace(/\s+/g, ' ').trim();
  if (texto.length <= maxLen) return texto;
  return texto.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

function renderizarProducto() {
  document.title = `${productoActual.nombre} - Tienda Contra Entrega`;

  // Poblar información textual
  landingTitle.innerText = productoActual.nombre;
  landingDescription.innerHTML = productoActual.descripcion || 'Sin descripción disponible.';

  // Titular magnético + UVP (propuesta única de valor) del hero
  if (heroTitle) heroTitle.innerText = productoActual.nombre;
  if (heroTagline) heroTagline.innerText = extraerTextoPlano(productoActual.descripcion, 150);

  // Calcular precios y ofertas
  const price = parseFloat(productoActual.precio);
  const oldPrice = productoActual.precio_antiguo ? parseFloat(productoActual.precio_antiguo) : price * 1.5;

  landingPriceCurrent.innerText = `$${price.toLocaleString('es-CO')} COP`;
  landingPriceOld.innerText = `$${oldPrice.toLocaleString('es-CO')} COP`;

  // Descuento calculado
  const discountPct = Math.round(((oldPrice - price) / oldPrice) * 100);
  landingDiscount.innerText = `🔥 -${discountPct}% DTO. SÓLO HOY`;

  // Inicializar Oferta por Defecto (1 unidad)
  ofertaSeleccionada = {
    cantidad: 1,
    precio: price
  };

  // Poblar tarjetas de oferta por cantidad (ahorro visible, sin esconderlo en un dropdown)
  const priceQty2 = (price * 2) - 20000; // Descuento de 20k
  const priceQty3 = price * 2; // Paga 2 y lleva 3

  if (ofertaCardsGrid) {
    ofertaCardsGrid.innerHTML = `
      <label class="offer-card">
        <input type="radio" name="oferta" value="1" checked>
        <span class="offer-card-title">Llevar 1 Unidad</span>
        <span class="offer-card-price">$${price.toLocaleString('es-CO')}</span>
      </label>
      <label class="offer-card">
        <span class="offer-card-badge">MÁS ELEGIDA</span>
        <input type="radio" name="oferta" value="2">
        <span class="offer-card-title">Llevar 2 Unidades</span>
        <span class="offer-card-save">Ahorras $20.000</span>
        <span class="offer-card-price">$${priceQty2.toLocaleString('es-CO')}</span>
      </label>
      <label class="offer-card">
        <input type="radio" name="oferta" value="3">
        <span class="offer-card-title">Llevar 3 Unidades</span>
        <span class="offer-card-save">Paga 2, lleva 3</span>
        <span class="offer-card-price">$${priceQty3.toLocaleString('es-CO')}</span>
      </label>
    `;
  }

  actualizarResumenPrecios();

  // Poblar Imágenes como carrusel automático (pasan solas, sin que el cliente tenga que hacer nada)
  const imagenes = productoActual.imagenes || [];
  if (imagenes.length > 0) {
    landingMainImg.src = imagenes[0];

    // Crear miniaturas (también sirven de indicador y de control manual)
    landingThumbsGrid.innerHTML = imagenes.map((img, idx) => `
      <div class="thumb-item ${idx === 0 ? 'active' : ''}" onclick="cambiarImagenPrincipal(${idx})">
        <img src="${img}" alt="Miniatura ${idx + 1}">
      </div>
    `).join('');

    iniciarCarrusel(imagenes);
  }

  // Poblar Opciones / Variaciones (Talla, Color, Tamaño, etc. según tipo_opcion)
  const opciones = productoActual.opciones || [];
  if (opciones.length > 0) {
    variationsContainer.style.display = 'block';
    const tipoOpcion = productoActual.tipo_opcion || 'Opción';
    const variationsTitle = document.getElementById('variations-title');
    if (variationsTitle) {
      variationsTitle.innerText = `SELECCIONA ${tipoOpcion.toUpperCase()}:`;
    }
    optionsButtonsGrid.innerHTML = opciones.map((op, idx) => `
      <button type="button" class="option-btn" onclick="seleccionarOpcion(this, '${op}')">${op}</button>
    `).join('');
  }

  // Poblar Beneficios (resuelven un dolor, no solo listan características)
  const beneficios = productoActual.beneficios || [];
  if (beneficios.length > 0 && benefitsSectionContainer) {
    benefitsSectionContainer.style.display = 'block';
    benefitsCardsGrid.innerHTML = beneficios.map(b => `
      <div class="benefit-card">
        <div class="benefit-icon">${b.icon || '☁️'}</div>
        <h3>${b.title}</h3>
        <p>${b.text}</p>
      </div>
    `).join('');
  }

  // Poblar Prueba Social (testimonios reales)
  const testimonios = productoActual.testimonios || [];
  if (testimonios.length > 0 && reviewsSectionContainer) {
    reviewsSectionContainer.style.display = 'block';
    reviewsCardsGrid.innerHTML = testimonios.map(t => `
      <div class="review-card">
        <div class="review-stars-inline">${'⭐'.repeat(t.stars || 5)}</div>
        <p>"${t.text}"</p>
        <strong>- ${t.name}</strong>
      </div>
    `).join('');
  }

  // Ocultar Carga y Mostrar Contenido
  loadingState.style.display = 'none';
  productContent.style.display = 'block';

  // Configurar manejadores de clicks de ofertas
  configurarManejadoresOfertas(price, priceQty2, priceQty3);
  configurarEnvioFormulario();
  configurarBarraFlotanteMovil();
}

// Muestra la imagen de un índice dado y actualiza la miniatura activa
function mostrarImagenCarrusel(idx) {
  if (!carruselImagenes[idx]) return;
  carruselIndice = idx;

  landingMainImg.style.opacity = '0';
  setTimeout(() => {
    landingMainImg.src = carruselImagenes[idx];
    landingMainImg.style.opacity = '1';
  }, 200);

  document.querySelectorAll('.thumb-item').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === idx);
  });
}

// Arranca el avance automático de imágenes (una tras otra, en loop)
function iniciarCarrusel(imagenes) {
  carruselImagenes = imagenes;
  carruselIndice = 0;
  if (carruselTimer) clearInterval(carruselTimer);
  if (imagenes.length <= 1) return;

  carruselTimer = setInterval(() => {
    const siguiente = (carruselIndice + 1) % carruselImagenes.length;
    mostrarImagenCarrusel(siguiente);
  }, CARRUSEL_INTERVALO_MS);
}

// Clic manual en una miniatura: cambia la imagen y reinicia el conteo automático
window.cambiarImagenPrincipal = function (idx) {
  mostrarImagenCarrusel(idx);
  if (carruselTimer) {
    clearInterval(carruselTimer);
    carruselTimer = setInterval(() => {
      const siguiente = (carruselIndice + 1) % carruselImagenes.length;
      mostrarImagenCarrusel(siguiente);
    }, CARRUSEL_INTERVALO_MS);
  }
}

// Seleccionar Talla/Color
window.seleccionarOpcion = function (element, valor) {
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  element.classList.add('selected');
  opcionSeleccionada = valor;
}

function configurarManejadoresOfertas(p1, p2, p3) {
  const preciosPorCantidad = {
    1: p1,
    2: p2,
    3: p3
  };

  ofertaCardsGrid.addEventListener('change', (e) => {
    if (e.target.name !== 'oferta') return;

    const qty = parseInt(e.target.value);
    const price = preciosPorCantidad[qty] || p1;

    ofertaSeleccionada = {
      cantidad: qty,
      precio: price
    };

    actualizarResumenPrecios();

    // Track Pixel (InitiateCheckout)
    if (typeof fbq === 'function') {
      fbq('track', 'InitiateCheckout', {
        content_name: productoActual.nombre,
        value: price,
        currency: 'COP'
      });
    }
  });
}

function actualizarResumenPrecios() {
  const totalStr = `$${ofertaSeleccionada.precio.toLocaleString('es-CO')}`;
  if (btnTotalVal) {
    btnTotalVal.innerText = totalStr;
  }
  if (mobileBuyBarPrice) {
    mobileBuyBarPrice.innerText = `${totalStr} COP`;
  }
}

// En móvil, el formulario de compra ya no vive en el flujo de la página
// (solo imagen + descripción se navegan ahí) — la barra flotante está
// siempre visible y es la única forma de abrir el panel de compra.
function configurarBarraFlotanteMovil() {
  if (!mobileBuyBar) return;
  mobileBuyBar.classList.add('visible');
}

// Botón de la barra flotante: en móvil abre el panel de compra como overlay;
// en escritorio (donde el formulario ya está siempre visible) solo enfoca el campo
window.irAComprar = function () {
  const checkoutSection = document.getElementById('checkout-form-section');
  if (!checkoutSection) return;

  if (window.innerWidth <= 900) {
    checkoutSection.classList.add('mobile-drawer-open');
    document.body.style.overflow = 'hidden';
    if (mobileBuyBar) mobileBuyBar.classList.remove('visible');
    return;
  }

  checkoutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  setTimeout(() => {
    const nombreInput = document.getElementById('nombre');
    if (nombreInput) nombreInput.focus();
  }, 400);
}

// Cierra el panel de compra en móvil y vuelve a mostrar la barra flotante
window.cerrarPanelCompra = function () {
  const checkoutSection = document.getElementById('checkout-form-section');
  if (checkoutSection) checkoutSection.classList.remove('mobile-drawer-open');
  document.body.style.overflow = '';
  if (mobileBuyBar) mobileBuyBar.classList.add('visible');
}

// Inicializar Selectores de Ubicación
function inicializarUbicaciones() {
  const departamentosOrdenados = Object.keys(ubicacionesColombia).sort();

  departamentosOrdenados.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept;
    option.textContent = dept;
    departamentoSelect.appendChild(option);
  });

  departamentoSelect.addEventListener('change', (e) => {
    const depto = e.target.value;
    ciudadSelect.innerHTML = '<option value="">Selecciona tu municipio...</option>';

    if (depto && ubicacionesColombia[depto]) {
      ciudadSelect.disabled = false;
      ubicacionesColombia[depto].sort().forEach(ciudad => {
        const option = document.createElement('option');
        option.value = ciudad;
        option.textContent = ciudad;
        ciudadSelect.appendChild(option);
      });
    } else {
      ciudadSelect.disabled = true;
    }
  });
}

// Configurar el envío del Formulario de Compra Rápida
function configurarEnvioFormulario() {
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validar que se haya seleccionado variación si existen opciones
    const opciones = productoActual.opciones || [];
    if (opciones.length > 0 && !opcionSeleccionada) {
      const tipoOpcion = productoActual.tipo_opcion || 'una opción';
      alert(`Por favor selecciona ${tipoOpcion.toLowerCase() === 'una opción' ? tipoOpcion : 'un(a) ' + tipoOpcion.toLowerCase()} antes de confirmar.`);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "⏳ PROCESANDO TU PEDIDO...";

    const nombreCompuesto = opcionSeleccionada
      ? `${productoActual.nombre} (${opcionSeleccionada})`
      : productoActual.nombre;

    // Formatear los productos comprados para la API
    const listaProductos = [{
      id: productoActual.id,
      nombre: nombreCompuesto,
      cantidad: ofertaSeleccionada.cantidad,
      precio: ofertaSeleccionada.precio / ofertaSeleccionada.cantidad,
      sku: productoActual.sku,
      dropi_id: productoActual.dropi_id || '12345',
      proveedor: productoActual.proveedor || 'Dropi'
    }];

    const payload = {
      nombre: document.getElementById('nombre').value,
      celular: document.getElementById('celular').value,
      direccion: document.getElementById('direccion').value,
      departamento: departamentoSelect.value,
      ciudad: ciudadSelect.value,
      producto: nombreCompuesto,
      cantidad: ofertaSeleccionada.cantidad,
      total: ofertaSeleccionada.precio,
      productos: listaProductos,
      sourceUrl: window.location.href,
      userAgent: navigator.userAgent
    };

    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (resData.success) {
        // Track Pixel Purchase
        if (typeof fbq === 'function') {
          fbq('track', 'Purchase', {
            content_name: nombreCompuesto,
            value: ofertaSeleccionada.precio,
            currency: 'COP',
            content_type: 'product',
            contents: [{
              id: productoActual.sku,
              quantity: ofertaSeleccionada.cantidad
            }]
          }, {
            eventID: String(resData.orderId)
          });
        }

        // Mostrar Éxito
        document.getElementById('success-client-name').innerText = payload.nombre;
        document.getElementById('success-client-phone').innerText = payload.celular;
        document.getElementById('success-order-id').innerText = resData.orderId;
        
        // Incluir cantidad comprada en el texto descriptivo
        document.getElementById('success-product-name').innerText = `${ofertaSeleccionada.cantidad}x ${nombreCompuesto}`;
        
        // Cargar productos recomendados (Cross-Selling)
        cargarRecomendacionesExito();

        checkoutForm.classList.add('hidden');
        const checkoutHeader = document.querySelector('.checkout-header');
        if (checkoutHeader) {
          checkoutHeader.classList.add('hidden');
        }
        const productInfo = document.querySelector('.checkout-product-info');
        if (productInfo) {
          productInfo.classList.add('hidden');
        }
        successScreen.classList.remove('hidden');

        document.getElementById('checkout-form-section').scrollIntoView({ behavior: 'smooth' });
      } else {
        alert(`Error al guardar el pedido: ${resData.error || 'Error desconocido'}`);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '🟢 SÍ, LO QUIERO — TOTAL: <span id="btn-total-val"></span>';
        actualizarResumenPrecios();
      }
    } catch (err) {
      console.error('Error al enviar petición:', err);
      alert('Hubo un error de conexión al procesar tu pedido. Intenta nuevamente.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '🟢 SÍ, LO QUIERO — TOTAL: <span id="btn-total-val"></span>';
      actualizarResumenPrecios();
    }
  });
}

// Inicializar Pixel de Meta (fbq('init', ...) real, no solo el snippet base)
async function inicializarPixel() {
  if (typeof fbq !== 'function') return;

  try {
    const response = await fetch('/api/config');
    const data = await response.json();

    if (data.success && data.metaPixelId) {
      fbq('init', data.metaPixelId);
      fbq('track', 'PageView');
      fbq('track', 'ViewContent', {
        content_name: productoActual.nombre,
        value: parseFloat(productoActual.precio),
        currency: 'COP'
      });
    }
  } catch (err) {
    console.error('Error inicializando Meta Pixel:', err);
  }
}

// Lógica de Formulario Progresivo (Removido para mostrar el formulario ultra compacto de una sola vista)
function inicializarPasoFormulario() {
  // El formulario es ahora 100% visible desde el inicio
}

// Cargar recomendaciones de otros productos en la pantalla de éxito
async function cargarRecomendacionesExito() {
  try {
    const response = await fetch('/api/admin/productos');
    const data = await response.json();
    
    if (data.success && data.productos) {
      // Filtrar el producto actual y los inactivos
      const recomendados = data.productos
        .filter(p => p.id !== productoActual.id && p.activo)
        .slice(0, 2);
      
      if (recomendados.length > 0) {
        const recGrid = document.getElementById('recommendations-grid');
        recGrid.innerHTML = recomendados.map(p => {
          const price = parseFloat(p.precio);
          const image = p.imagenes && p.imagenes.length > 0 
            ? p.imagenes[0] 
            : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=300';
          return `
            <div style="background: white; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; cursor: pointer; text-align: left;" onclick="window.location.href='/p/${p.slug}'">
              <img src="${image}" alt="${p.nombre}" style="width: 100%; height: 120px; object-fit: cover;">
              <div style="padding: 8px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <h5 style="font-size: 0.8rem; font-weight: 700; color: var(--text-dark); margin: 0 0 4px 0; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${p.nombre}</h5>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                  <span style="font-size: 0.85rem; font-weight: 800; color: var(--danger);">$${price.toLocaleString('es-CO')}</span>
                  <span style="font-size: 0.65rem; background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 2px 6px; border-radius: 4px; font-weight: 700;">Ver</span>
                </div>
              </div>
            </div>
          `;
        }).join('');
        
        document.getElementById('success-recommendations').style.display = 'block';
      }
    }
  } catch (err) {
    console.error('Error cargando recomendaciones de éxito:', err);
  }
}
