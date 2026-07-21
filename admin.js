// Estado Global del Dashboard
let authToken = sessionStorage.getItem('admin_token') || null;

// Referencias del DOM
const authScreen = document.getElementById('auth-screen');
const mainDashboard = document.getElementById('main-dashboard');
const authForm = document.getElementById('auth-form');
const passwordInput = document.getElementById('password');

const pedidosTableBody = document.getElementById('pedidos-table-body');
const productosTableBody = document.getElementById('productos-table-body');

// Inputs del Modal de Productos
const productoModal = document.getElementById('producto-modal');
const productoForm = document.getElementById('producto-form');
const prodId = document.getElementById('prod-id');
const prodNombre = document.getElementById('prod-nombre');
const prodSku = document.getElementById('prod-sku');
const prodPrecio = document.getElementById('prod-precio');
const prodPrecioAntiguo = document.getElementById('prod-precio-antiguo');
const prodSlug = document.getElementById('prod-slug');
const prodDropiId = document.getElementById('prod-dropi-id');
const prodProveedor = document.getElementById('prod-proveedor');
const prodDescripcion = document.getElementById('prod-descripcion');
const prodImagenes = document.getElementById('prod-imagenes');
const prodOpciones = document.getElementById('prod-opciones');
const prodActivo = document.getElementById('prod-activo');
const prodBeneficios = document.getElementById('prod-beneficios');
const prodTestimonios = document.getElementById('prod-testimonios');
const modalTitle = document.getElementById('modal-title');

// Inicialización de la pantalla al cargar
document.addEventListener('DOMContentLoaded', () => {
  // Comprobar si viene redirigido con un token de recuperación en el Hash (Supabase)
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const type = hashParams.get('type');

  if (accessToken && type === 'recovery') {
    authToken = accessToken;
    sessionStorage.setItem('admin_token', accessToken);

    // Mostrar el formulario de restablecer contraseña y ocultar login
    authScreen.style.display = 'flex';
    mainDashboard.style.display = 'none';
    authForm.style.display = 'none';
    document.getElementById('auth-description').innerText = 'Establece tu nueva contraseña para acceder.';
    document.getElementById('reset-password-card').style.display = 'block';
  } else {
    if (authToken) {
      showDashboard();
    } else {
      showAuth();
    }
  }

  // Listener para cambiar ayuda dinámica de proveedor logístico
  prodProveedor.addEventListener('change', actualizarAyudaProveedor);
});

// Manejo de la autenticación
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = passwordInput.value;

  try {
    const response = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      authToken = data.token;
      sessionStorage.setItem('admin_token', authToken);
      showDashboard();
    } else {
      alert(data.error || 'Credenciales incorrectas');
      passwordInput.value = '';
    }
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    alert('Error al conectar con la API de autenticación.');
  }
});

function showAuth() {
  authScreen.style.display = 'flex';
  mainDashboard.style.display = 'none';
  authForm.style.display = 'block';
  document.getElementById('auth-description').style.display = 'block';
  document.getElementById('auth-description').innerText = 'Ingresa tu correo y contraseña registrados en Supabase Auth.';
  document.getElementById('recover-card').style.display = 'none';
  document.getElementById('reset-password-card').style.display = 'none';
}

function showDashboard() {
  authScreen.style.display = 'none';
  mainDashboard.style.display = 'block';
  
  // Cargar datos
  cargarPedidos();
  cargarProductos();
}

window.logout = function() {
  sessionStorage.removeItem('admin_token');
  authToken = null;
  showAuth();
}

// Funciones de Recuperación de Contraseña
window.abrirRecuperarCard = function(event) {
  event.preventDefault();
  authForm.style.display = 'none';
  document.getElementById('auth-description').style.display = 'none';
  document.getElementById('recover-card').style.display = 'block';
}

window.cancelarRecuperacion = function() {
  showAuth();
}

window.solicitarRecuperacion = async function() {
  const email = document.getElementById('recover-email').value;
  if (!email) {
    alert('Por favor ingresa tu correo electrónico.');
    return;
  }

  try {
    const response = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'recover', email })
    });

    const data = await response.json();
    if (data.success) {
      alert(data.message);
      showAuth();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (err) {
    console.error('Error al solicitar recuperación:', err);
    alert('Error al conectar con el servidor.');
  }
}

window.guardarNuevaContrasena = async function() {
  const newPassword = document.getElementById('reset-password-val').value;
  if (!newPassword || newPassword.length < 6) {
    alert('La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  try {
    const response = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ action: 'reset-password', password: newPassword })
    });

    const data = await response.json();
    if (data.success) {
      alert('Tu contraseña se ha restablecido correctamente.');
      
      // Limpiar hash URL
      window.history.replaceState(null, null, ' ');
      
      showAuth();
    } else {
      alert('Error al restablecer contraseña: ' + data.error);
    }
  } catch (err) {
    console.error('Error al guardar nueva contraseña:', err);
    alert('Error al conectar con el servidor.');
  }
}

// Navegación entre pestañas
window.switchTab = function(tabId, btnElement) {
  // Ocultar todas las pestañas
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Desactivar todos los botones
  document.querySelectorAll('.tab-nav .tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Activar pestaña seleccionada
  document.getElementById(tabId).classList.add('active');
  
  // Activar botón seleccionado
  btnElement.classList.add('active');

  // Si entra al espía, cargar anuncios
  if (tabId === 'espia-tab') {
    cargarAnunciosEspia();
  }
}

// ==========================================
// SECCIÓN DE PEDIDOS
// ==========================================
async function cargarPedidos() {
  if (!authToken) return;

  try {
    const response = await fetch('/api/admin/pedidos', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.status === 401) return logout();
    const data = await response.json();

    if (data.success) {
      renderPedidos(data.pedidos);
      calcularEstadisticas(data.pedidos);
    } else {
      pedidosTableBody.innerHTML = `<tr><td colspan="11" style="text-align:center; color:var(--danger)">Error: ${data.error}</td></tr>`;
    }
  } catch (err) {
    console.error('Error cargando pedidos:', err);
    pedidosTableBody.innerHTML = `<tr><td colspan="11" style="text-align:center; color:var(--danger)">Error de conexión al cargar pedidos</td></tr>`;
  }
}

function renderPedidos(pedidos) {
  if (!pedidos || pedidos.length === 0) {
    pedidosTableBody.innerHTML = `<tr><td colspan="11" style="text-align: center; color: var(--text-muted); padding: 3rem;">No se encontraron pedidos registrados.</td></tr>`;
    return;
  }

  pedidosTableBody.innerHTML = pedidos.map(p => {
    const fechaFormateada = new Date(p.fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const totalFormateado = `$${parseFloat(p.total).toLocaleString('es-CO')} COP`;
    
    // Clases para estados de Dropi
    let dropiBadge = 'badge-warning';
    if (p.dropi_status === 'Enviado') dropiBadge = 'badge-success';
    if (p.dropi_status === 'Error API') dropiBadge = 'badge-danger';

    // Clases para estados de despacho
    let envioBadge = 'badge-info';
    if (p.estado_guia === 'Confirmado') envioBadge = 'badge-success';
    if (p.estado_guia === 'Despachado') envioBadge = 'badge-success';
    if (p.estado_guia === 'Cancelado') envioBadge = 'badge-danger';

    // Construcción de fila
    return `
      <tr>
        <td><strong>#${p.id}</strong></td>
        <td>${fechaFormateada}</td>
        <td>${p.nombre}</td>
        <td>
          <a href="https://wa.me/57${p.celular}" target="_blank" style="color:var(--accent); text-decoration:none;">📲 ${p.celular}</a>
        </td>
        <td><small>${p.ciudad} (${p.departamento})<br>${p.direccion}</small></td>
        <td><small>${p.producto}</small></td>
        <td><strong>${totalFormateado}</strong></td>
        <td>
          ${p.id_guia_dropi || '<span style="color:var(--text-muted)">-</span>'}
          <br><small style="color:var(--text-muted)">(${p.proveedor_logistico || 'Dropi'})</small>
        </td>
        <td><span class="badge ${dropiBadge}">${p.dropi_status || 'Pendiente'}</span></td>
        <td>
          <select onchange="cambiarEstadoPedido(${p.id}, this.value)" style="background:rgba(15,23,42,0.6); color:white; border:1px solid var(--border-card); padding:2px; border-radius:4px;">
            <option value="Pendiente" ${p.estado_guia === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="Confirmado" ${p.estado_guia === 'Confirmado' ? 'selected' : ''}>Confirmado</option>
            <option value="Despachado" ${p.estado_guia === 'Despachado' ? 'selected' : ''}>Despachado</option>
            <option value="Cancelado" ${p.estado_guia === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
          </select>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            ${p.dropi_status !== 'Enviado' ? `
              <button class="action-btn btn-sync" onclick="reintentarLogistica(${p.id}, '${p.proveedor_logistico || 'Dropi'}')">🔄 Reintentar ${p.proveedor_logistico || 'Dropi'}</button>
            ` : '<span style="color:var(--accent); text-align: center; display: block; margin-bottom: 2px;">✓ Integrado</span>'}
            <button class="action-btn" style="background:var(--danger); color:white;" onclick="eliminarPedido(${p.id})">🗑️ Borrar</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Cambiar estado del pedido
window.cambiarEstadoPedido = async function(id, nuevoEstado) {
  try {
    const response = await fetch('/api/admin/pedidos', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ id, estado_guia: nuevoEstado })
    });

    const data = await response.json();
    if (!data.success) {
      alert('Error al actualizar el estado: ' + data.error);
    } else {
      cargarPedidos();
    }
  } catch (err) {
    console.error('Error al actualizar estado del pedido:', err);
  }
}

// Reintentar conexión con la API logística para un pedido fallido
window.reintentarLogistica = async function(id, proveedor = 'Dropi') {
  if (!confirm(`¿Deseas reenviar este pedido a ${proveedor}?`)) return;
  
  try {
    const response = await fetch('/api/admin/pedidos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ id })
    });

    const data = await response.json();
    if (data.success) {
      alert(`Pedido enviado a ${proveedor} con éxito. Guía generada: ` + data.guideNumber);
      cargarPedidos();
    } else {
      alert(`Fallo de integración con ${proveedor}: ` + data.error);
      cargarPedidos();
    }
  } catch (err) {
    console.error(`Error al reintentar ${proveedor}:`, err);
    alert('Error de conexión con el servidor backend.');
  }
}

// Eliminar un pedido definitivamente de la base de datos
window.eliminarPedido = async function(id) {
  if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente el pedido #${id}?\nEsta acción no se puede deshacer.`)) return;

  try {
    const response = await fetch(`/api/admin/pedidos?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    if (data.success) {
      alert('Pedido eliminado correctamente.');
      cargarPedidos();
    } else {
      alert('Error al eliminar pedido: ' + data.error);
    }
  } catch (err) {
    console.error('Error al borrar pedido:', err);
    alert('Error de conexión al servidor backend.');
  }
}

function calcularEstadisticas(pedidos) {
  const totalOrders = pedidos.length;
  let successSync = 0;
  let pendingSync = 0;
  let totalSales = 0;

  pedidos.forEach(p => {
    totalSales += parseFloat(p.total) || 0;
    if (p.dropi_status === 'Enviado') {
      successSync++;
    } else {
      pendingSync++;
    }
  });

  document.getElementById('stat-total-orders').innerText = totalOrders;
  document.getElementById('stat-total-sales').innerText = `$${totalSales.toLocaleString('es-CO')} COP`;
  document.getElementById('stat-dropi-success').innerText = successSync;
  document.getElementById('stat-dropi-pending').innerText = pendingSync;
}


// ==========================================
// SECCIÓN DE PRODUCTOS
// ==========================================
async function cargarProductos() {
  if (!authToken) return;

  try {
    const response = await fetch('/api/admin/productos', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.status === 401) return logout();
    const data = await response.json();

    if (data.success) {
      renderProductos(data.productos);
    } else {
      productosTableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--danger)">Error: ${data.error}</td></tr>`;
    }
  } catch (err) {
    console.error('Error cargando productos:', err);
    productosTableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--danger)">Error de conexión al cargar productos</td></tr>`;
  }
}

function renderProductos(productos) {
  if (!productos || productos.length === 0) {
    productosTableBody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 3rem;">No hay productos en la base de datos. Crea uno nuevo.</td></tr>`;
    return;
  }

  productosTableBody.innerHTML = productos.map(p => {
    const mainImg = p.imagenes && p.imagenes.length > 0 ? p.imagenes[0] : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=150';
    const precioFormateado = `$${parseFloat(p.precio).toLocaleString('es-CO')} COP`;
    const productLandingUrl = `${window.location.origin}/p/${p.slug}`;

    return `
      <tr>
        <td><strong>#${p.id}</strong></td>
        <td><img src="${mainImg}" style="width:50px; height:50px; object-fit:cover; border-radius:6px; border:1px solid var(--border-card);"></td>
        <td><strong>${p.nombre}</strong></td>
        <td><code>${p.sku}</code></td>
        <td>
          <span class="badge" style="font-size:0.75rem; background:rgba(79, 70, 229, 0.2); color:#818cf8; padding: 2px 6px; border-radius:4px; font-weight:600; border: 1px solid rgba(129, 140, 248, 0.3);">
            ${p.proveedor || 'Dropi'}
          </span>
          <br>
          <small style="color:var(--text-muted)">ID: ${p.dropi_id || 'N/A'}</small>
        </td>
        <td><strong>${precioFormateado}</strong></td>
        <td><code>/p/${p.slug}</code></td>
        <td>
          <a href="${productLandingUrl}" target="_blank" style="color:var(--accent); text-decoration:none;">🔗 Ver Landing Page</a>
        </td>
        <td>
          <span class="badge ${p.activo ? 'badge-success' : 'badge-danger'}">
            ${p.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <button class="action-btn btn-edit" onclick="editarProducto(${JSON.stringify(p).replace(/"/g, '&quot;')})">✏️ Editar</button>
          <button class="action-btn" style="background:var(--danger); color:white;" onclick="eliminarProducto(${p.id})">🗑️ Borrar</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Modales de Producto
window.abrirModalProducto = function() {
  modalTitle.innerText = "Agregar Nuevo Producto";
  productoForm.reset();
  prodId.value = '';
  actualizarAyudaProveedor();
  productoModal.style.display = 'flex';
}

window.cerrarModalProducto = function() {
  productoModal.style.display = 'none';
}

window.editarProducto = function(product) {
  modalTitle.innerText = "Editar Producto #" + product.id;
  
  prodId.value = product.id;
  prodNombre.value = product.nombre;
  prodSku.value = product.sku;
  prodPrecio.value = product.precio;
  prodPrecioAntiguo.value = product.precio_antiguo || '';
  prodSlug.value = product.slug;
  prodProveedor.value = product.proveedor || 'Dropi';
  prodDropiId.value = product.dropi_id || '';
  prodDescripcion.value = product.descripcion || '';
  prodImagenes.value = product.imagenes.join('\n');
  prodOpciones.value = product.opciones ? product.opciones.join(', ') : '';
  prodActivo.checked = product.activo;
  
  prodBeneficios.value = product.beneficios ? JSON.stringify(product.beneficios, null, 2) : '';
  prodTestimonios.value = product.testimonios ? JSON.stringify(product.testimonios, null, 2) : '';
  
  actualizarAyudaProveedor();
  productoModal.style.display = 'flex';
}

// Envío del formulario de producto (Nuevo / Editar)
productoForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = prodId.value;
  const method = id ? 'PUT' : 'POST';

  // Parsear campos complejos
  const imagenesArray = prodImagenes.value.split('\n').map(url => url.trim()).filter(url => url.length > 0);
  const opcionesArray = prodOpciones.value.split(',').map(op => op.trim()).filter(op => op.length > 0);
  
  let beneficiosJson = [];
  if (prodBeneficios.value.trim().length > 0) {
    try {
      beneficiosJson = JSON.parse(prodBeneficios.value);
    } catch(err) {
      alert('Error en formato JSON de Beneficios. Por favor revisa la sintaxis.');
      return;
    }
  }

  let testimoniosJson = [];
  if (prodTestimonios.value.trim().length > 0) {
    try {
      testimoniosJson = JSON.parse(prodTestimonios.value);
    } catch(err) {
      alert('Error en formato JSON de Testimonios. Por favor revisa la sintaxis.');
      return;
    }
  }

  const payload = {
    nombre: prodNombre.value,
    sku: prodSku.value,
    precio: parseFloat(prodPrecio.value),
    precio_antiguo: prodPrecioAntiguo.value ? parseFloat(prodPrecioAntiguo.value) : null,
    slug: prodSlug.value,
    proveedor: prodProveedor.value,
    dropi_id: prodDropiId.value || null,
    descripcion: prodDescripcion.value,
    imagenes: imagenesArray,
    opciones: opcionesArray,
    activo: prodActivo.checked,
    beneficios: beneficiosJson,
    testimonios: testimoniosJson
  };

  if (id) {
    payload.id = parseInt(id);
  }

  try {
    const response = await fetch('/api/admin/productos', {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.success) {
      alert(id ? 'Producto editado correctamente' : 'Producto agregado con éxito');
      cerrarModalProducto();
      cargarProductos();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (err) {
    console.error('Error al guardar producto:', err);
    alert('Error de conexión al guardar el producto.');
  }
});

// Eliminar producto
window.eliminarProducto = async function(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este producto del catálogo?\nNota: Se marcará como inactivo para no romper el historial de ventas.')) return;
  
  try {
    const response = await fetch(`/api/admin/productos?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    if (data.success) {
      alert('Producto eliminado correctamente.');
      cargarProductos();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (err) {
    console.error('Error al borrar producto:', err);
  }
}

// Función dinámica de ayuda para los proveedores en el formulario
function actualizarAyudaProveedor() {
  const proveedor = prodProveedor.value;
  const helpText = document.getElementById('proveedor-help-text');
  const lblDropiId = document.getElementById('lbl-dropi-id');

  if (!helpText || !lblDropiId) return;

  if (proveedor === 'Effi') {
    helpText.innerHTML = '💡 <strong>Nota para Effi Systems:</strong> El SKU del producto debe coincidir exactamente con el SKU del artículo en tu ERP de Effi. El campo "ID de Producto en Plataforma" no es obligatorio para Effi y puede quedar vacío.';
    helpText.style.display = 'block';
    helpText.style.color = '#10b981';
    helpText.style.borderColor = 'rgba(16, 185, 129, 0.2)';
    helpText.style.background = 'rgba(16, 185, 129, 0.1)';
    lblDropiId.innerText = 'ID de Producto en Effi (Opcional)';
  } else if (proveedor === 'Hoko') {
    helpText.innerHTML = '💡 <strong>Nota para Hoko Logística:</strong> El SKU del producto debe coincidir con la Referencia asignada en el catálogo de Hoko. El campo "ID de Producto en Plataforma" puede quedar vacío.';
    helpText.style.display = 'block';
    helpText.style.color = '#3b82f6';
    helpText.style.borderColor = 'rgba(59, 130, 246, 0.2)';
    helpText.style.background = 'rgba(59, 130, 246, 0.1)';
    lblDropiId.innerText = 'ID de Producto en Hoko (Opcional)';
  } else {
    helpText.innerHTML = '💡 <strong>Nota para Dropi:</strong> El ID de Producto en Plataforma es <strong>obligatorio</strong> y debe corresponder al ID numérico asignado por Dropi para ese producto.';
    helpText.style.display = 'block';
    helpText.style.color = '#f59e0b';
    helpText.style.borderColor = 'rgba(245, 158, 11, 0.2)';
    helpText.style.background = 'rgba(245, 158, 11, 0.1)';
    lblDropiId.innerText = 'ID de Producto en Dropi *';
  }
}

// Función global para testear la comunicación de la API de Effi
window.testConexionEffi = async function() {
  if (!authToken) return;

  const btn = document.getElementById('btn-test-effi');
  if (!btn) return;

  const oldText = btn.innerText;
  btn.disabled = true;
  btn.innerText = '⏳ Conectando...';

  try {
    const response = await fetch('/api/admin/test-effi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();

    if (data.success) {
      alert('✅ CONEXIÓN EXITOSA CON EFFI SYSTEMS:\n\n' + data.message);
    } else {
      alert('❌ ERROR DE CONEXIÓN CON EFFI SYSTEMS:\n\n' + data.error + (data.details ? '\n\nDetalles: ' + JSON.stringify(data.details) : ''));
    }
  } catch (err) {
    console.error('Error testeando conexión con Effi:', err);
    alert('❌ Error de red al intentar comunicarse con el servidor de la tienda.');
  } finally {
    btn.disabled = false;
    btn.innerText = oldText;
  }
}

// Cargar anuncios ganadores desde la API de Supabase
window.cargarAnunciosEspia = async function() {
  if (!authToken) return;

  const container = document.getElementById('espia-cards-container');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 4rem;">
      <span style="font-size: 2.5rem; display: block; margin-bottom: 1rem; animation: spin 1s infinite linear;">🔄</span>
      <p>Consultando base de datos de anuncios ganadores...</p>
    </div>
  `;

  try {
    const response = await fetch('/api/admin/espia', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.status === 401) return logout();
    const data = await response.json();

    if (data.success) {
      renderAnunciosEspia(data.anuncios);
    } else {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--danger); padding: 4rem;">
          <p>❌ Error al cargar anuncios: ${data.error}</p>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error cargando anuncios espía:', err);
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--danger); padding: 4rem;">
        <p>❌ Error de red al intentar conectar con el servidor.</p>
      </div>
    `;
  }
}

function renderAnunciosEspia(anuncios) {
  const container = document.getElementById('espia-cards-container');
  if (!container) return;

  if (!anuncios || anuncios.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 4rem 2rem; background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border-card);">
        <span style="font-size: 2.5rem; display: block; margin-bottom: 1rem;">📭</span>
        <p>No hay anuncios ganadores registrados en Supabase.</p>
        <p style="font-size: 0.8rem; margin-top: 0.5rem;">Ejecuta el script <code>npm run spy</code> localmente para poblar la base de datos.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = anuncios.map(ad => {
    // Etiqueta de calor según días activos
    let badgeClass = '';
    if (ad.days_active >= 30) badgeClass = 'muy-activo';

    const fechaFormateada = new Date(ad.start_date).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    // Color del badge de competencia
    let compColor = '#34d399'; // Verde
    let compBg = 'rgba(16, 185, 129, 0.15)';
    if (ad.competencia === 'Alta') {
      compColor = '#f87171'; // Rojo
      compBg = 'rgba(239, 68, 68, 0.15)';
    } else if (ad.competencia === 'Media') {
      compColor = '#fbbf24'; // Amarillo
      compBg = 'rgba(245, 158, 11, 0.15)';
    }

    return `
      <div class="espia-card">
        <div class="espia-card-header">
          <div>
            <h3>${ad.page_name}</h3>
            <p>Inició: ${fechaFormateada}</p>
          </div>
          <span class="espia-badge-duration ${badgeClass}">
            🔥 ${ad.days_active} días activo
          </span>
        </div>

        <div class="espia-card-body">
          <!-- Copy Original -->
          <div>
            <div class="espia-section-title">📝 Copy Original</div>
            <div class="espia-box">${ad.copy_text.replace(/\n/g, '<br>')}</div>
          </div>

          <!-- Análisis de Viabilidad -->
          <div class="espia-analysis-grid">
            <div class="analysis-item">
              <strong>📊 Competencia</strong>
              <span class="badge" style="background:${compBg}; color:${compColor}; font-size:0.7rem; padding:1px 6px;">
                ${ad.competencia}
              </span>
            </div>
            <div class="analysis-item">
              <strong>💡 Diagnóstico</strong>
              <small style="color:var(--text-muted); font-size:0.75rem;">${ad.diagnostico_copy || 'Analizado'}</small>
            </div>
          </div>

          <!-- Recomendación / Oportunidad -->
          <div>
            <div class="espia-section-title">🚀 Cómo sacarle partido</div>
            <div class="espia-box" style="background: rgba(59, 130, 246, 0.05); border-color: rgba(59, 130, 246, 0.15); font-size: 0.8rem;">
              ${ad.oportunidad || 'N/A'}
            </div>
          </div>

          <!-- Copy Optimizado Propuesto -->
          <div class="copy-mejorado-container">
            <div class="espia-section-title">🎯 Copy Recomendado (Mejorado)</div>
            <button class="btn-copiar" onclick="copiarTexto('copy-propuesto-${ad.id}')">📋 Copiar</button>
            <div class="espia-box" id="copy-propuesto-${ad.id}" style="background: rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.15); font-size: 0.8rem; font-family: monospace; white-space: pre-wrap;">${ad.copy_mejorado || 'N/A'}</div>
          </div>
        </div>

        <div class="espia-card-footer">
          <img src="${ad.creative_url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-card);">
          <a href="${ad.ad_link}" target="_blank" class="action-btn btn-edit" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.3rem;">
            🔗 Ver Anuncio en Meta
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// Copiar texto al portapapeles de forma amigable
window.copiarTexto = function(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  // Extraer el texto limpio (deshacer el HTML si hay)
  const text = el.innerText;

  navigator.clipboard.writeText(text).then(() => {
    alert('✅ Copy copiado al portapapeles correctamente.');
  }).catch(err => {
    console.error('Error al copiar:', err);
    alert('❌ No se pudo copiar automáticamente. Por favor selecciónalo manualmente.');
  });
}

