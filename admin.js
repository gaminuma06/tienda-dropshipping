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
  if (authToken) {
    showDashboard();
  } else {
    showAuth();
  }
});

// Manejo de la autenticación
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = passwordInput.value;

  try {
    const response = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    const data = await response.json();

    if (data.success) {
      authToken = data.token;
      sessionStorage.setItem('admin_token', authToken);
      showDashboard();
    } else {
      alert(data.error || 'Contraseña incorrecta');
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
}

function showDashboard() {
  authScreen.style.display = 'none';
  mainDashboard.style.display = 'block';
  
  // Cargar datos
  cargarPedidos();
  cargarProductos();
}

function logout() {
  sessionStorage.removeItem('admin_token');
  authToken = null;
  showAuth();
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

  // Activar actual
  document.getElementById(tabId).classList.add('active');
  btnElement.classList.add('active');
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
          ${p.dropi_status !== 'Enviado' ? `
            <button class="action-btn btn-sync" onclick="reintentarLogistica(${p.id}, '${p.proveedor_logistico || 'Dropi'}')">🔄 Reintentar ${p.proveedor_logistico || 'Dropi'}</button>
          ` : '<span style="color:var(--accent)">✓ Integrado</span>'}
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
