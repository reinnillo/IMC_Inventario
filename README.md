# IMC Group - Sistema de Gestión de Inventario

## Descripción General

El Sistema de Gestión de Inventario de IMC Group es una aplicación web completa diseñada para modernizar y optimizar los procesos de control de inventario físico. Esta herramienta facilita la colaboración en tiempo real entre administradores, contadores y verificadores, asegurando una mayor precisión, eficiencia y transparencia en los recuentos de inventario.

La arquitectura del sistema se basa en un stack tecnológico moderno, con un backend robusto desarrollado en **Node.js** y **Express**, y un frontend dinámico e interactivo construido con **React**. La comunicación con la base de datos se gestiona a través de **Supabase**, mientras que **Dexie.js** se implementa en el cliente para ofrecer capacidades offline robustas, garantizando la continuidad del trabajo incluso sin conexión a internet.

## Características Principales

### Backend (API REST)

- **Gestión de Autenticación y Roles**: Sistema seguro de inicio de sesión con roles de usuario (Administrador, Contador, Verificador) para controlar el acceso a las diferentes funcionalidades.
- **Operaciones CRUD**: Endpoints para gestionar productos, clientes, conteos, verificaciones e inventarios.
- **Generación de Reportes**: Creación de informes detallados en formato PDF y Excel sobre el estado del inventario, discrepancias y resultados finales.
- **Estadísticas en Tiempo Real**: Dashboards con métricas clave sobre el progreso de los conteos y verificaciones.
- **Auditoría y Supervisión**: Módulos especializados para la supervisión de la calidad del trabajo de contadores y verificadores.

### Frontend (Aplicación React)

- **Interfaz Moderna e Intuitiva**: Diseño limpio y fácil de usar que mejora la experiencia del usuario.
- **Capacidades Offline**: Gracias a **Dexie.js**, los contadores y verificadores pueden continuar su trabajo sin conexión. Los datos se almacenan localmente en IndexedDB y se sincronizan automáticamente con el servidor cuando se restablece la conexión.
- **Dashboards Interactivos con `Recharts`**: Se han implementado visualizaciones de datos avanzadas para el monitoreo de operaciones:
    - **Dashboard de Administrador**: Gráficos de pastel que muestran la distribución de la fuerza laboral y el estado general de la cartera de clientes.
    - **Supervisión en Tiempo Real**: Gráficos de barras que detallan la productividad del equipo (conteo y auditoría) y las áreas de mayor actividad, complementando las tablas de datos en vivo.
- **Componentes Reutilizables**: Una base de código organizada con componentes para cada funcionalidad, facilitando el mantenimiento y la escalabilidad.
- **Enrutamiento del Lado del Cliente**: Navegación fluida y rápida entre las diferentes secciones de la aplicación con **React Router**.
- **Context API para el Manejo de Estado**: Gestión centralizada de la autenticación, datos de usuario y estado de la aplicación.

## Requisitos Previos

Asegúrate de tener instalado lo siguiente antes de comenzar:

- **Node.js**: Versión 16.x o superior.
- **npm**: Generalmente se instala junto con Node.js.
- **Git**: Para clonar el repositorio.

## Instalación y Puesta en Marcha

Sigue estos pasos para configurar el entorno de desarrollo local.

### 1. Clonar el Repositorio

```bash
git clone https://github.com/reinnillo/IMC_Inventario.git
cd IMC_Inventario
```

### 2. Configuración del Backend

Navega al directorio del backend e instala las dependencias:

```bash
cd backend
npm install
```

Crea un archivo `.env` en la raíz del directorio `backend` y añade las credenciales de tu proyecto de Supabase:

```env
SUPABASE_URL=URL_DE_TU_PROYECTO_SUPABASE
SUPABASE_KEY=TU_API_KEY_DE_SUPABASE
```

Inicia el servidor de desarrollo del backend:

```bash
npm run dev
```

El servidor se ejecutará en `http://localhost:3000` (o el puerto que hayas configurado).

### 3. Configuración del Frontend

En una nueva terminal, navega al directorio del frontend e instala las dependencias:

```bash
cd frontend
npm install
```

Inicia el servidor de desarrollo de Vite:

```bash
npm run dev
```

La aplicación React estará disponible en `http://localhost:5173` (o el puerto que indique Vite).

## Estructura del Proyecto

```
IMC_Inventario/
├── backend/
│   ├── src/
│   │   ├── controllers/ # Lógica de negocio para cada endpoint
│   │   ├── routes/      # Definición de las rutas de la API
│   │   ├── services/    # Servicios auxiliares (auditoría, etc.)
│   │   └── app.js       # Punto de entrada del servidor
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/  # Componentes de React
    │   ├── context/     # Proveedores de Context API
    │   ├── db/          # Configuración de Dexie.js (IndexedDB)
    │   ├── App.jsx      # Componente raíz de la aplicación
    │   └── main.jsx     # Punto de entrada de React
    └── package.json
```

## 🗄️ Esquema de la Base de Datos

El sistema utiliza una arquitectura PostgreSQL sobre Supabase, implementando una estrategia de particionamiento de tablas para garantizar el rendimiento y la escalabilidad multi-tenant. A continuación, se detalla el esquema confirmado (`public`) basado en el DDL actual.

---

### 🔐 Gestión de Identidad y Accesos

#### `usuarios`
- **Razón de ser**: Tabla central de identidad que complementa a `auth.users`. Gestiona los perfiles, roles (RBAC) y metadatos operativos.
- **Campos Clave**:
  - `id`: `bigint` (FK implícita).
  - `nombre`, `correo` (Unique), `cedula` (Unique).
  - `role`: `enum ('admin', 'supervisor', 'contador', 'verificador')`.
  - `user_type`: `text` (Default: 'Fijo').
  - `cliente_id`: `bigint` (Para usuarios restringidos a un solo cliente).
  - `activo`: `boolean`, `ultimo_acceso`: `timestamptz`.

#### `guest_links`
- **Razón de ser**: Permite generar accesos temporales para auditores externos sin necesidad de crear una cuenta completa.
- **Campos Clave**:
  - `token`: `uuid` (Unique, generado automáticamente).
  - `expires_at`: `timestamptz`.
  - `alias_auditoria`: `text`.

---

### 📦 Núcleo del Negocio (Tablas Particionadas)

> **Nota sobre Particionamiento**: Las tablas críticas de inventario (`conteos`, `inventarios_cliente`, `inventario_verificado`) están particionadas físicamente (ej. `conteos_p0` ... `conteos_p7`) para optimizar consultas masivas por cliente.

#### `conteos_part`
- **Razón de ser**: Input Transaccional. Registra cada escaneo o input manual desde los dispositivos móviles. Es la "materia prima" del inventario.
- **Campos Clave**:
  - `id`: `bigint` (identity).
  - `cliente_id`: `bigint` (Partition Key).
  - `marbete`: `varchar` (Agrupador físico).
  - `codigo_producto`: `varchar`, `cantidad`: `integer`.
  - `device_id`: `varchar`, `nombre_contador`: `varchar`.
  - `fecha_escaneo`: `timestamptz`, `tiempo_tomado`: `integer` (segundos).
  - `verificado`: `boolean` (Flag de estado).
  - `batch_id`: `uuid` (Agrupación por lote de sincronización).

#### `inventario_verificado_part`
- **Razón de ser**: Fuente de la Verdad. Almacena el resultado consolidado tras la auditoría. Aquí se calculan las variaciones finales (Diferencias).
- **Campos Clave**:
  - `cantidad_sistema`: `numeric` (Snapshot del teórico).
  - `cantidad_conteo`: `numeric` (Suma de `conteos_part`).
  - `cantidad_final`: `numeric` (Decisión del auditor).
  - `diferencia`: `numeric` (Calculado: Final - Sistema).
  - `es_forzado`: `boolean` (Si se aceptó la diferencia sin reconteo).
  - `verificador_id`: `bigint`, `tiempo_verificacion`: `integer`.
  - `estado`: `USER-DEFINED` (Enum de estado).

#### `inventarios_cliente_part`
- **Razón de ser**: Maestro de Artículos. Contiene el stock teórico (System Stock) importado desde el ERP del cliente.
- **Campos Clave**:
  - `codigo_producto`, `barcode`: `varchar`.
  - `descripcion`: `text`.
  - `cantidad`: `numeric` (Stock Teórico).
  - `costo`: `numeric`, `unidad_medida`: `varchar`.
  - `ubicacion`, `area`: `varchar` (Ubicación teórica).
  - `fuente_archivo`: `varchar` (Origen de la carga).

---

### 🏢 Gestión de Clientes y Configuración

#### `clientes`
- **Razón de ser**: Entidad padre para la segregación de datos.
- **Campos Clave**:
  - `nombre_comercial`, `ruc`: `varchar`.
  - `estado`: `enum` (activo, etc.).
  - `contacto_principal`, `telefono`, `direccion`.

#### `cliente_mapeos`
- **Razón de ser**: Motor de integración. Guarda la configuración JSON para mapear columnas de archivos CSV/Excel dinámicos a la estructura de la base de datos.
- **Campos Clave**:
  - `cliente_id`: `bigint`.
  - `columnas_origen`: `text[]`.
  - `mapeo`: `jsonb` (Configuración de columnas).

---

### 📊 Métricas y Auditoría (Gamification & Logs)

#### `employee_stats` (Globales)
- **Razón de ser**: Acumulado histórico del rendimiento del usuario.
- **Campos**: `piezas_totales_contadas`, `precision_global`, `velocidad_promedio`, `horas_totales_trabajadas`.

#### `employee_session_stats` (Por Sesión)
- **Razón de ser**: Rendimiento granular por jornada de trabajo.
- **Campos**: `velocidad_sesion`, `precision_sesion`, `tiempo_activo`, `hora_inicio`, `hora_fin`.

#### `audit_log`
- **Razón de ser**: Trazabilidad de seguridad inmutable.
- **Campos Clave**:
  - `actor_id`, `actor_role`.
  - `action`, `module`.
  - `details`: `jsonb` (Cambios específicos, payload).
  - `ip_address`: `text`.


## Scripts Disponibles

### Backend

- `npm start`: Inicia el servidor en modo producción.
- `npm run dev`: Inicia el servidor en modo desarrollo con Nodemon para recarga automática.

### Frontend

- `npm run dev`: Inicia el servidor de desarrollo de Vite.
- `npm run build`: Compila la aplicación para producción.
- `npm run lint`: Ejecuta el linter de ESLint.
- `npm run preview`: Previsualiza la build de producción localmente.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas mejorar el proyecto, por favor sigue estos pasos:

1. Haz un fork del repositorio.
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commit (`git commit -m 'Añade nueva funcionalidad'`).
4. Empuja tus cambios a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

---
**© 2024 IMC Group - Todos los derechos reservados.**
