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

// Selector de ofertas
const offerOption1 = document.getElementById('offer-qty-1');
const offerOption2 = document.getElementById('offer-qty-2');
const offerOption3 = document.getElementById('offer-qty-3');
const summarySubtotal = document.getElementById('summary-subtotal');
const summaryTotal = document.getElementById('summary-total');

// Obtener el slug del producto desde la URL (?slug=tenis-deportivos)
const urlParams = new URLSearchParams(window.location.search);
const productSlug = urlParams.get('slug');

document.addEventListener('DOMContentLoaded', () => {
  if (!productSlug) {
    showError();
    return;
  }
  inicializarUbicaciones();
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

function renderizarProducto() {
  document.title = `${productoActual.nombre} - Tienda Contra Entrega`;

  // Poblar información textual
  landingTitle.innerText = productoActual.nombre;
  landingDescription.innerText = productoActual.descripcion || 'Sin descripción disponible.';
  
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

  // Poblar precios de las opciones de oferta
  document.getElementById('offer-price-1').innerText = `$${price.toLocaleString('es-CO')} COP`;
  
  const priceQty2 = (price * 2) - 20000; // Descuento de 20k
  document.getElementById('offer-price-2').innerText = `$${priceQty2.toLocaleString('es-CO')} COP`;
  
  const priceQty3 = price * 2; // Paga 2 y lleva 3
  document.getElementById('offer-price-3').innerText = `$${priceQty3.toLocaleString('es-CO')} COP`;

  actualizarResumenPrecios();

  // Poblar Imágenes
  const imagenes = productoActual.imagenes || [];
  if (imagenes.length > 0) {
    landingMainImg.src = imagenes[0];
    
    // Crear miniaturas
    landingThumbsGrid.innerHTML = imagenes.map((img, idx) => `
      <div class="thumb-item ${idx === 0 ? 'active' : ''}" onclick="cambiarImagenPrincipal(this, '${img}')">
        <img src="${img}" alt="Miniatura ${idx + 1}">
      </div>
    `).join('');
  }

  // Poblar Opciones / Variaciones (Tallas o Colores)
  const opciones = productoActual.opciones || [];
  if (opciones.length > 0) {
    variationsContainer.style.display = 'block';
    optionsButtonsGrid.innerHTML = opciones.map((op, idx) => `
      <button type="button" class="option-btn" onclick="seleccionarOpcion(this, '${op}')">${op}</button>
    `).join('');
  }

  // Poblar Beneficios
  const beneficios = productoActual.beneficios || [];
  if (beneficios.length > 0) {
    benefitsSectionContainer.style.display = 'block';
    benefitsCardsGrid.innerHTML = beneficios.map(b => `
      <div class="benefit-card">
        <div class="benefit-icon">${b.icon || '☁️'}</div>
        <h3>${b.title}</h3>
        <p>${b.text}</p>
      </div>
    `).join('');
  }

  // Poblar Testimonios
  const testimonios = productoActual.testimonios || [];
  if (testimonios.length > 0) {
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
}

// Cambiar la imagen grande
window.cambiarImagenPrincipal = function(element, imgSrc) {
  landingMainImg.style.opacity = '0';
  
  setTimeout(() => {
    landingMainImg.src = imgSrc;
    landingMainImg.style.opacity = '1';
  }, 200);

  document.querySelectorAll('.thumb-item').forEach(thumb => {
    thumb.classList.remove('active');
  });
  element.classList.add('active');
}

// Seleccionar Talla/Color
window.seleccionarOpcion = function(element, valor) {
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  element.classList.add('selected');
  opcionSeleccionada = valor;
}

function configurarManejadoresOfertas(p1, p2, p3) {
  const opcionesOferta = [
    { element: offerOption1, qty: 1, price: p1 },
    { element: offerOption2, qty: 2, price: p2 },
    { element: offerOption3, qty: 3, price: p3 }
  ];

  opcionesOferta.forEach(opt => {
    opt.element.addEventListener('click', () => {
      // Remover clase activa
      opcionesOferta.forEach(o => o.element.classList.remove('active-offer'));
      
      // Activar
      opt.element.classList.add('active-offer');
      const radio = opt.element.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      // Actualizar estado global de la oferta seleccionada
      ofertaSeleccionada = {
        cantidad: opt.qty,
        precio: opt.price
      };

      actualizarResumenPrecios();

      // Track Pixel (InitiateCheckout)
      if (typeof fbq === 'function') {
        fbq('track', 'InitiateCheckout', {
          content_name: productoActual.nombre,
          value: opt.price,
          currency: 'COP'
        });
      }
    });
  });
}

function actualizarResumenPrecios() {
  const totalStr = `$${ofertaSeleccionada.precio.toLocaleString('es-CO')} COP`;
  summarySubtotal.innerText = totalStr;
  summaryTotal.innerText = totalStr;
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
      alert('Por favor selecciona una talla o color antes de confirmar.');
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
      dropi_id: productoActual.dropi_id || '12345'
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
        document.getElementById('success-product-name').innerText = nombreCompuesto;
        
        checkoutForm.classList.add('hidden');
        document.querySelector('.checkout-header').classList.add('hidden');
        successScreen.classList.remove('hidden');

        document.getElementById('checkout-form-section').scrollIntoView({ behavior: 'smooth' });
      } else {
        alert(`Error al guardar el pedido: ${resData.error || 'Error desconocido'}`);
        submitBtn.disabled = false;
        submitBtn.innerText = "🟢 CONFIRMAR PEDIDO CONTRAENTREGA";
      }
    } catch (err) {
      console.error('Error al enviar petición:', err);
      alert('Hubo un error de conexión al procesar tu pedido. Intenta nuevamente.');
      submitBtn.disabled = false;
      submitBtn.innerText = "🟢 CONFIRMAR PEDIDO CONTRAENTREGA";
    }
  });
}

// Inicializar Pixel de Meta
function inicializarPixel() {
  // Configurar pixel dinámicamente si existe algún identificador configurado
  // O el pre-inicializado en el HTML
  if (typeof fbq === 'function') {
    fbq('track', 'PageView');
    fbq('track', 'ViewContent', {
      content_name: productoActual.nombre,
      value: parseFloat(productoActual.precio),
      currency: 'COP'
    });
  }
}
