// 1. Base de datos local de Municipios y Departamentos de Colombia (Principales zonas de cobertura)
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

// 2. Variables de Elementos del DOM (Se inicializan cuando el DOM está listo)
let departamentoSelect;
let ciudadSelect;
let checkoutForm;
let successScreen;
let submitBtn;
let offerOptions;
let summarySubtotal;
let summaryTotal;

// Estado del Carrito
let ofertaSeleccionada = {
  cantidad: 1,
  precio: 79900,
  nombre: "Tenis UltraComfort Pro (Llevar 1 Par)"
};

// 3. Inicializar Selectores de Ubicación
function inicializarUbicaciones() {
  if (!departamentoSelect || !ciudadSelect) return;

  // Cargar departamentos ordenados alfabéticamente
  const departamentosOrdenados = Object.keys(ubicacionesColombia).sort();
  
  departamentosOrdenados.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept;
    option.textContent = dept;
    departamentoSelect.appendChild(option);
  });

  // Evento al cambiar de departamento
  departamentoSelect.addEventListener('change', (e) => {
    const depto = e.target.value;
    
    // Limpiar ciudades
    ciudadSelect.innerHTML = '<option value="">Selecciona tu municipio...</option>';
    
    if (depto && ubicacionesColombia[depto]) {
      ciudadSelect.disabled = false;
      
      // Cargar ciudades del departamento
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

// 4. Galería de Imágenes
window.changeImage = function(element) {
  // Cambiar imagen principal
  const mainImg = document.getElementById('main-product-img');
  if (!mainImg) return;
  mainImg.style.opacity = '0';
  
  setTimeout(() => {
    mainImg.src = element.src;
    mainImg.style.opacity = '1';
  }, 200);

  // Actualizar clase activa en miniaturas
  document.querySelectorAll('.gallery-thumbnails img').forEach(thumb => {
    thumb.classList.remove('active-thumb');
  });
  element.classList.add('active-thumb');
}

// 5. Manejador de Ofertas (Precio y Cantidad)
function inicializarOfertas() {
  if (!offerOptions) return;
  offerOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Quitar clase activa de todas las opciones
      offerOptions.forEach(opt => opt.classList.remove('active-offer'));
      
      // Seleccionar radio button interno
      const radio = option.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      
      // Activar opción visualmente
      option.classList.add('active-offer');
      
      // Actualizar datos del carrito
      const qty = parseInt(option.getAttribute('data-qty'));
      const price = parseFloat(option.getAttribute('data-price'));
      const title = option.querySelector('strong').innerText;

      ofertaSeleccionada = {
        cantidad: qty,
        precio: price,
        nombre: `Tenis UltraComfort Pro (${title})`
      };

      // Actualizar Totales del Checkout
      const precioFormateado = `$${price.toLocaleString('es-CO')} COP`;
      if (summarySubtotal) summarySubtotal.innerText = precioFormateado;
      if (summaryTotal) summaryTotal.innerText = precioFormateado;

      // Disparar evento de Meta Pixel (InitiateCheckout)
      if (typeof fbq === 'function') {
        fbq('track', 'InitiateCheckout', {
          content_name: ofertaSeleccionada.nombre,
          value: price,
          currency: 'COP'
        });
      }
    });
  });
}

// 6. Envío del Formulario
function inicializarFormulario() {
  if (!checkoutForm) return;
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Deshabilitar botón para evitar envíos duplicados
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "⏳ PROCESANDO TU PEDIDO...";
    }

    const formData = {
      nombre: document.getElementById('nombre').value,
      celular: document.getElementById('celular').value,
      direccion: document.getElementById('direccion').value,
      departamento: departamentoSelect.value,
      ciudad: ciudadSelect.value,
      producto: ofertaSeleccionada.nombre,
      cantidad: ofertaSeleccionada.cantidad,
      total: ofertaSeleccionada.precio,
      sourceUrl: window.location.href,
      userAgent: navigator.userAgent
    };

    try {
      // Registrar en backend local
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const resData = await response.json();

      if (resData.success) {
        // Disparar evento de Meta Pixel del lado del cliente (Deduplicación con Server-Side usando ID de Orden)
        if (typeof fbq === 'function') {
          fbq('track', 'Purchase', {
            content_name: ofertaSeleccionada.nombre,
            value: ofertaSeleccionada.precio,
            currency: 'COP',
            content_type: 'product',
            contents: [{
              id: 'tenis_ultracomfort',
              quantity: ofertaSeleccionada.cantidad
            }]
          }, {
            eventID: String(resData.orderId) // ID coincidente con CAPI
          });
        }

        // Mostrar pantalla de éxito
        const successClientName = document.getElementById('success-client-name');
        const successClientPhone = document.getElementById('success-client-phone');
        const successOrderId = document.getElementById('success-order-id');

        if (successClientName) successClientName.innerText = formData.nombre;
        if (successClientPhone) successClientPhone.innerText = formData.celular;
        if (successOrderId) successOrderId.innerText = resData.orderId;
        
        // Ocultar formulario de manera animada
        checkoutForm.classList.add('hidden');
        const checkoutHeader = document.querySelector('.checkout-header');
        if (checkoutHeader) checkoutHeader.classList.add('hidden');
        if (successScreen) successScreen.classList.remove('hidden');
        
        // Hacer scroll hasta el inicio de la sección de éxito
        const checkoutSection = document.getElementById('checkout-section');
        if (checkoutSection) checkoutSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        alert(`Error al registrar el pedido: ${resData.error || 'Error desconocido'}`);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = "🟢 CONFIRMAR PEDIDO CONTRAENTREGA";
        }
      }
    } catch (err) {
      console.error('Error al enviar la petición:', err);
      alert('Hubo un error de conexión al procesar tu pedido. Por favor intenta de nuevo.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "🟢 CONFIRMAR PEDIDO CONTRAENTREGA";
      }
    }
  });
}

// Restablecer formulario después de compra exitosa
window.resetCheckout = function() {
  if (checkoutForm) checkoutForm.reset();
  if (checkoutForm) checkoutForm.classList.remove('hidden');
  const checkoutHeader = document.querySelector('.checkout-header');
  if (checkoutHeader) checkoutHeader.classList.remove('hidden');
  if (successScreen) successScreen.classList.add('hidden');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerText = "🟢 CONFIRMAR PEDIDO CONTRAENTREGA";
  }
  if (ciudadSelect) ciudadSelect.disabled = true;
}

// Inicialización de la Tienda
function setupStore() {
  departamentoSelect = document.getElementById('departamento');
  ciudadSelect = document.getElementById('ciudad');
  checkoutForm = document.getElementById('checkout-form');
  successScreen = document.getElementById('success-screen');
  submitBtn = document.getElementById('submit-btn');
  offerOptions = document.querySelectorAll('.offer-option');
  summarySubtotal = document.getElementById('summary-subtotal');
  summaryTotal = document.getElementById('summary-total');

  inicializarUbicaciones();
  inicializarOfertas();
  inicializarFormulario();
}

// Ejecutar inicialización según el estado de carga de la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupStore);
} else {
  setupStore();
}

