// Elementos del DOM
const homeProductsGrid = document.getElementById('home-products-grid');

document.addEventListener('DOMContentLoaded', () => {
  cargarProductosCatalogo();
  inicializarPixelHome();
});

// Cargar productos activos desde Supabase
async function cargarProductosCatalogo() {
  try {
    const response = await fetch('/api/admin/productos');
    const data = await response.json();

    if (data.success && data.productos && data.productos.length > 0) {
      // Filtrar solo productos activos
      const productosActivos = data.productos.filter(p => p.activo);
      
      if (productosActivos.length > 0) {
        renderizarProductos(productosActivos);
      } else {
        renderizarSinProductos();
      }
    } else {
      renderizarSinProductos();
    }
  } catch (err) {
    console.error('Error al cargar catálogo de productos:', err);
    if (homeProductsGrid) {
      homeProductsGrid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 3rem; text-align: center; color: #ef4444;">
          <h3>⚠️ Error de conexión</h3>
          <p>No se pudo establecer conexión con la base de datos de productos. Intenta de nuevo más tarde.</p>
        </div>
      `;
    }
  }
}

function renderizarProductos(productos) {
  if (!homeProductsGrid) return;

  homeProductsGrid.innerHTML = productos.map(p => {
    const mainImg = p.imagenes && p.imagenes.length > 0 ? p.imagenes[0] : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=300';
    const price = parseFloat(p.precio);
    const oldPrice = p.precio_antiguo ? parseFloat(p.precio_antiguo) : price * 1.5;
    
    // Descuento calculado
    const discountPct = Math.round(((oldPrice - price) / oldPrice) * 100);
    const landingUrl = `/p/${p.slug}`;

    return `
      <div class="product-card" onclick="window.location.href='${landingUrl}'">
        <span class="product-card-badge">🔥 -${discountPct}% DTO</span>
        <img src="${mainImg}" alt="${p.nombre}" class="product-card-img">
        <div class="product-card-body">
          <h3 class="product-card-title">${p.nombre}</h3>
          <div class="product-card-prices">
            <span class="product-card-price-current">$${price.toLocaleString('es-CO')} COP</span>
            <span class="product-card-price-old">$${oldPrice.toLocaleString('es-CO')} COP</span>
          </div>
          <button class="product-card-btn">🟢 COMPRA CONTRAENTREGA</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderizarSinProductos() {
  if (!homeProductsGrid) return;
  
  homeProductsGrid.innerHTML = `
    <div style="grid-column: 1/-1; padding: 4rem 2rem; text-align: center; background: #f8fafc; border-radius: 16px; border: 1px dashed #cbd5e1;">
      <h3 style="color:#0f172a; margin-bottom: 0.5rem; font-size: 1.3rem;">👋 ¡Próximamente novedades!</h3>
      <p style="color:#64748b; margin-bottom: 0;">Estamos preparando el catálogo de nuestras mejores ofertas. Regresa pronto.</p>
    </div>
  `;
}

// Inicializar Pixel de Meta en Home
function inicializarPixelHome() {
  if (typeof fbq === 'function') {
    fbq('track', 'PageView');
  }
}
