# Guía Logística: Registro y Obtención de Credenciales para Effi y Hoko

Esta guía explica detalladamente qué son **Effi (EffiSystems)** y **Hoko**, cómo registrarse en ellas para hacer dropshipping con pago contra entrega en Colombia, y cómo obtener las credenciales de API para activar su sincronización automática en tu tienda.

---

## 1. HOKO LOGÍSTICA

Hoko es una plataforma de dropshipping y logística enfocada en envíos con pago contra entrega en Colombia. Trabaja directamente integrando múltiples transportadoras (como Envía, Servientrega, Interrapidísimo, Coordinadora, etc.).

### 🤝 Cómo crear tu cuenta en Hoko
1. Ve al sitio web oficial: [www.hoko.com.co](https://www.hoko.com.co).
2. Haz clic en **Regístrate** o **Crear Cuenta**.
3. Completa tus datos personales, de contacto y los datos bancarios donde Hoko te consignará el dinero recaudado de tus ventas en efectivo (monedero / recaudo).
4. Un asesor de Hoko se comunicará contigo vía WhatsApp o llamada telefónica para darte la bienvenida, validar tu cuenta y asignarte a un canal de soporte.

### 🔑 Cómo obtener tus Credenciales API de Hoko
Hoko maneja su documentación e integración de forma privada para evitar abusos de consumo. Sigue estos pasos para obtener tu acceso:
1. Una vez que tengas tu cuenta activa, ingresa al panel principal de Hoko.
2. Busca la sección de **Configuraciones / Integraciones / API** en tu perfil. Si no ves una opción de generación de llave de API en tu panel de forma directa, debes **solicitarla a tu asesor asignado de Hoko o a través de su chat de soporte**.
3. Indícales: *"Hola, tengo un e-commerce en código propio y requiero conectarme vía API para crear las órdenes automáticamente. ¿Podrían suministrarme mi **x-api-key** y la documentación técnica de endpoints?"*
4. Ellos te entregarán:
   * **`x-api-key`**: Una clave alfanumérica única.
   * **API URL de producción** (usualmente: `https://api.hoko.com.co` o similar).
5. **Configuración en tu tienda:** Pega estos valores en tu archivo `.env` en Vercel o local en las siguientes variables:
   ```env
   HOKO_API_URL=https://api.hoko.com.co
   HOKO_API_KEY=tu_x_api_key_entregada_por_hoko
   ```

---

## 2. EFFI SYSTEMS (EFFI ERP)

Effi es una de las herramientas ERP de administración, inventario y dropshipping más potentes en Colombia. Cuenta con integraciones robustas con transportadoras y catálogos de proveedores locales.

### 🤝 Cómo crear tu cuenta en Effi
1. Visita el sitio web oficial: [www.effisystems.com](https://www.effisystems.com).
2. Completa el formulario de contacto o haz clic en solicitar cuenta.
3. Al ser un ERP avanzado, Effi suele requerir un breve proceso comercial para seleccionar tu plan (tienen planes para dropshippers pequeños y medianos).
4. El equipo comercial te guiará para configurar tu bodega (si tienes inventario propio) o tu rol de dropshipper para acceder a inventarios de terceros.

### 🔑 Cómo obtener tus Credenciales API de Effi
La API de Effi Systems opera con autenticación segura por Token y API Key asignada. Para obtener tus llaves:
1. Ingresa a tu panel ERP de Effi.
2. Ve al menú **Configuración > Api Keys / Integraciones** (o su equivalente en el menú administrativo).
3. Si no encuentras la opción, abre un ticket en su soporte técnico o escribe a su canal oficial de WhatsApp de asistencia técnica (**+57 320 569 5371**).
4. Pídeles: *"Necesito integrar mi tienda en código propio para enviar pedidos y generar remisiones a través de su API. ¿Podrían proporcionarme mi **apiKey** y **token de acceso** para el endpoint de pedidos?"*
5. Ellos te entregarán:
   * **`apiKey`**
   * **`token`**
   * **API URL de producción** (usualmente: `https://api.effisystems.com` o similar).
6. **Configuración en tu tienda:** Pega estos valores en tu archivo `.env` en Vercel o local en las siguientes variables:
   ```env
   EFFI_API_URL=https://api.effisystems.com
   EFFI_API_KEY=tu_api_key_de_effi
   EFFI_TOKEN=tu_token_de_acceso_de_effi
   ```

---

## 3. ¿Cómo activar y probar el soporte Multi-Proveedor en tu Tienda?

Una vez tengas tus credenciales:

1. **Configúralas en Vercel:** Agrégalas en el panel de control de tu proyecto Vercel (*Settings > Environment Variables*) y redespliega.
2. **Crea el producto en `/admin`:**
   * Entra a tu Panel de Administración.
   * Agrega un nuevo producto.
   * En el campo **Plataforma Logística**, selecciona `Effi` o `Hoko`.
   * En el campo **ID de Producto en Plataforma**, ingresa el ID del producto (SKU o ID) correspondiente en el inventario de la plataforma que elegiste.
3. **Prueba el flujo:**
   * Haz una compra en la Landing Page de ese producto.
   * En el panel de `/admin`, en la pestaña de **Pedidos**, verás que el pedido se marca con la plataforma asignada (`(Effi)` o `(Hoko)`).
   * Si las credenciales son válidas, la integración generará la guía automáticamente.
   * Si están vacías o son incorrectas, verás el estado `Error API`. Al corregirlas, podrás presionar el botón **🔄 Reintentar [Effi / Hoko]** para enviar el pedido al instante de forma manual sin que tu cliente deba repetir la compra.
