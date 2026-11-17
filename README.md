# API REST de Productos (Práctica Backend)

API REST en **Node.js + Express.js** para la tabla real `tienda.productos` de PostgreSQL, con arquitectura de **N capas** y patrones **Chain of Responsibility**, **Repository** y **Singleton**. El acceso a datos usa **Sequelize (ORM)** en el modelo/repositorio. No incluye frontend ni lógica de e-commerce. **JSON** se usa únicamente como formato de intercambio en solicitudes/respuestas HTTP. Lista para desplegar en **Render** (`render.yaml`).

## Inspección realizada (estado previo)

- Proyecto inicialmente vacío (sin `package.json` ni código previo). Se creó la estructura sin reemplazar funcionalidad existente (no había).
- Gestor/driver: **PostgreSQL** con **Sequelize 6 (ORM)** sobre `pg` (Node.js, CommonJS).
- Base de datos real: `"Productos"` (PostgreSQL 18.6), schema `tienda`.
- Tabla real inspeccionada: `tienda.productos`
  - `id` integer, `NOT NULL`, PK, default `nextval('tienda.productos_id_seq'::regclass)`
  - `nombre` varchar(200), `NOT NULL`
  - `categoria` varchar(100), `NOT NULL`
  - `precio_venta_publico` numeric(10,2), `NOT NULL`
- No se recreó, eliminó ni alteró la tabla ni sus datos existentes.

## Arquitectura (N capas)

```text
src/
  app.js                     # Configuración de Express y cadena de middleware
  server.js                  # Arranque, verificación de conexión y cierre controlado
  config/database.js         # Singleton: instancia Sequelize (ORM) compartida
  models/producto.model.js   # Modelo Sequelize mapeado a tienda.productos
  repositories/producto.repository.js  # Repository: acceso a datos vía ORM
  services/producto.service.js         # Reglas de negocio
  controllers/producto.controller.js   # Traducción HTTP/JSON
  routes/producto.routes.js           # Definición de endpoints
  middleware/
    requestLogger.js
    security.js
    sanitize.js
    validateProducto.js
    pagination.js
    notFound.js
    errorHandler.js
  utils/httpError.js
postman/
  Productos_API.postman_collection.json
  Productos_API.postman_environment.json
```

Flujo: **Ruta → Middlewares (Chain of Responsibility) → Controlador → Servicio → Repositorio (Singleton DB) → PostgreSQL**. El controlador/servicio no ejecutan SQL directamente.

## Patrones de diseño

### Chain of Responsibility (middleware)
Cadena en `src/app.js` mediante `(req, res, next)` / `next(error)`:
1. `requestLogger`: asigna `X-Request-Id`, registra método, ruta, estado y duración (sin datos sensibles).
2. Seguridad: `helmet`, CORS restrictivo configurable (`CORS_ORIGIN`), limitación de solicitudes, límite de cuerpo JSON (`100kb`).
3. `express.json()` y manejo de JSON malformado.
4. `sanitizeBody`: normalización conservadora (trim y remoción de caracteres de control en strings) sin alterar indebidamente contenido válido.
5. Validación por ruta (`validateProducto`, `validateIdParam`) y paginación (`pagination`) en listados.
6. Controlador.
7. `notFound` (404) y `errorHandler` global al final.

Cada middleware tiene responsabilidad única, evita doble respuesta y responde con JSON consistente al rechazar.

### Repository
`ProductoRepository` (`src/repositories/producto.repository.js`) centraliza todo el acceso a `tienda.productos` usando el **modelo Sequelize** (ORM): `count`, `findAll({ page, limit })` (con `limit`/`offset`), `findById` (`findByPk`), `create`, `update` (PUT), `partialUpdate` (PATCH) y `delete` (`destroy`). Sequelize parametriza automáticamente las consultas (prevención de inyección SQL); la sanitización no reemplaza validación. Devuelve entidades normalizadas con `precio_venta_publico` como número (getter del modelo).

### Singleton (gestor de conexión compartido)
`Database` en `src/config/database.js` mantiene **una única instancia de Sequelize** (ORM) y su pool interno durante la vida del proceso. Todos los repositorios/modelos se registran una sola vez vía `Database.getInstance().initModels()`; no se crea una conexión por solicitud/controlador.

Se incluye verificación de conexión al iniciar (`sequelize.authenticate()` mediante `verifyConnection`) y cierre ordenado en señales de terminación. Soporta `DATABASE_URL` (Render) o variables `DB_*` por separado (local), con SSL configurable vía `DB_SSL`.

## API REST

| Método | Ruta | Función | Respuestas |
|---|---|---|---|
| GET | `/api/productos` | Listado paginado | 200 |
| GET | `/api/productos/:id` | Consultar producto | 200 / 404 |
| POST | `/api/productos` | Crear producto | 201 / 400,422 |
| PUT | `/api/productos/:id` | Reemplazo completo | 200 / 404 / 400,422 |
| PATCH | `/api/productos/:id` | Actualización parcial | 200 / 404 / 400,422 |
| DELETE | `/api/productos/:id` | Eliminar producto | 204 / 404 |
| GET | `/health` | Estado API y conectividad BD | 200 / 503 |

- `GET /api/productos`: `page` (default 1), `limit` (default 10, máx. 100). Respuesta: `{ success, data, pagination: { page, limit, total, totalPages } }`.
- `DELETE` responde `204` sin cuerpo.
- Errores: 400/422 entrada inválida, 404 inexistente, 409 conflicto de integridad, 500 interno, 503 sin conectividad BD. Formato: `{ success: false, error: { code, message, details? } }` sin filtrar trazas/secretos.

### Campos reales (cuerpos JSON)

Basados en `tienda.productos` (no se asumieron columnas distintas):
- `nombre` (string, requerido en POST/PUT, máx. 200)
- `categoria` (string, requerido en POST/PUT, máx. 100)
- `precio_venta_publico` (number, requerido en POST/PUT, >= 0, máx. 2 decimales, dentro de numeric(10,2))

`PATCH` acepta uno o más de estos campos. Campos inesperados se rechazan. `id` es autogenerado y no se acepta en el cuerpo.

## Validación, sanitización, logs, paginación y seguridad

- **Validación:** IDs enteros positivos, tipos, obligatorios, longitudes y rangos según esquema; rechazo de campos inesperados y de cuerpos no objeto.
- **Sanitización:** conservadora (espacios/caracteres de control); no modifica contenido legítimo de productos. SQL siempre parametrizado.
- **Logs:** JSON con `requestId`, método, ruta, estado y duración; sin contraseñas, `DATABASE_URL`, tokens ni datos sensibles.
- **Paginación:** defaults y máximo razonable, manejo de entradas inválidas, `total` y `totalPages`.
- **Seguridad:** Helmet, CORS configurable, rate limiting, límite de cuerpo, consultas parametrizadas y manejo seguro de errores. **La API no implementa autenticación** (no requerida): es solo para práctica local y **no debe exponerse públicamente con escritura habilitada**.

## Configuración y ejecución

1. Requisitos: Node.js y acceso a la base PostgreSQL con la tabla `tienda.productos` existente.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   # Editar .env con credenciales reales (no commitear .env)
   ```
   Variables: `PORT`, `NODE_ENV`, `CORS_ORIGIN`, `DATABASE_URL` (Render; si no está, se usan `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`), `DB_SCHEMA` (default `tienda`), `DB_POOL_MAX`, `DB_SSL` (`true` en Render/producción).
4. Ejecutar:
   ```bash
   npm start      # producción/ejecución normal
   npm run dev    # desarrollo con watch (Node --watch)
   ```
5. Verificar: `GET http://localhost:3000/health` debe responder 200 con conectividad a BD. (En producción: `https://practicasapi-productos.onrender.com/health`.)

## Despliegue en Render

El archivo `render.yaml` define un **Web Service** (Node) y una **base PostgreSQL** en el plan free.

1. Sube el repo a GitHub/GitLab y crea un nuevo **Blueprint** en Render apuntando a `render.yaml`, o crea los recursos manualmente.
2. El blueprint inyecta automáticamente `DATABASE_URL` desde la base, además de `DB_SCHEMA=tienda`, `DB_SSL=true` y `CORS_ORIGIN`.
3. **Importante:** la base de Render creada por el blueprint está vacía. Como el código no crea la tabla (para no alterar datos), crea `tienda.productos` una vez en el SQL editor de Render:
   ```sql
   CREATE SCHEMA IF NOT EXISTS tienda;
   CREATE TABLE IF NOT EXISTS tienda.productos (
     id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
     nombre varchar(200) NOT NULL,
     categoria varchar(100) NOT NULL,
     precio_venta_publico numeric(10,2) NOT NULL
   );
   ```
   Si en cambio usas tu base PostgreSQL existente, omite esto y configura `DATABASE_URL` con esa cadena de conexión.
4. Verifica `https://<tu-servicio>.onrender.com/health` → 200. Render puede tardar unos minutos en el primer arranque (plan free se duerme tras inactividad).

## Pruebas manuales con Postman

1. Importar el entorno `postman/Productos_API.postman_environment.json` y seleccionarlo (ajusta `baseUrl` si es necesario). No contiene credenciales reales.
2. Importar la colección `postman/Productos_API.postman_collection.json`.
3. Arrancar el servidor (`npm start` o `npm run dev`).
4. Ejecutar solicitudes y comprobar códigos/respuestas:
   - `GET /health` → 200 (o 503 si no hay BD).
   - Listado: página 1, página 2 (200) y límite inválido (400).
   - `GET /api/productos/{{productoId}}` existente (200) e inexistente `99999999` (404).
   - `POST` válido (201, guarda el `id` devuelto en `{{productoId}}` si vas a probar PUT/PATCH/DELETE sobre ese registro de prueba) e inválido (422).
   - `PUT` válido (200, reemplazo completo) e inválido por campo faltante (422).
   - `PATCH` válido (200) e inválido con cuerpo vacío (422).
   - `DELETE` por ID de prueba (204) e inexistente (404).

**Importante para no afectar datos reales:** la tabla ya contiene registros. Para `PUT`, `PATCH` y `DELETE`, utiliza preferentemente un **ID creado por ti** en la prueba de `POST` válido (dato de prueba controlado) y evita usar IDs de registros reales existentes. No se afirma que las pruebas en Postman ya hayan sido ejecutadas por el usuario.

## Comprobaciones técnicas realizadas por el agente

- Inspección de esquema real de `tienda.productos` y verificación de existencia de datos (solo lectura).
- Instalación de dependencias (`npm install`) completada sin vulnerabilidades reportadas.
- Verificación de sintaxis de módulos Node (`node --check` sobre archivos fuente principales) correcta.
- Arranque de la API con **Sequelize (ORM)** y verificación de conectividad: `GET /health` respondió 200 y `GET /api/productos?page=1&limit=2` respondió 200 con datos reales y metadatos de paginación (consultas de solo lectura, sin modificar registros). Precio devuelto como número gracias al getter del modelo.

## Pendiente de validación humana

- Ejecución manual completa de la colección en Postman (todos los casos válidos/inválidos y códigos HTTP) desde tu entorno.
- Revisión de comportamiento frente a casos específicos de tu contexto (CORS desde origen deseado, límites/rate limit, y cualquier política adicional).
- Pruebas de escritura (POST/PUT/PATCH/DELETE) sobre **datos de prueba controlados** según tu criterio, para no afectar registros reales.
