# 📊 Dashboard AI - Apprecio

Dashboard Analítico con Chatbot integrado, Autenticación y generación de reportes PDF.

![Apprecio Logo](https://estudios.apprecio.com/hubfs/Logo%20Apprecio-03-1.png)

## 🌟 Características

- **Autenticación Segura**: Sistema de login con JWT y bcrypt
- **Chatbot con IA**: Integración con Google Gemini para análisis inteligente de datos
- **Dashboard Visual**: Visualización de métricas con gráficos interactivos
- **Generación de PDF**: Reportes ejecutivos en PDF con Puppeteer
- **Integración n8n**: Envío automático a webhook para procesamiento (email + Drive)
- **Arquitectura Desacoplada**: Backend genera PDF, n8n maneja distribución
- **Responsive Design**: Optimizado para desktop y móvil
- **PostgreSQL**: Base de datos robusta con datos históricos

## ⚠️ Requisitos Importantes

**Chrome for Testing**: El proyecto requiere Chrome para generar PDFs localmente con Puppeteer. **NO está incluido en el repositorio** para mantener el tamaño reducido. 

Para instalarlo localmente:
```bash
npx @puppeteer/browsers install chrome@stable --path ./chrome
```

En producción (Railway), Puppeteer usará el Chrome del sistema automáticamente.

## 📁 Estructura del Proyecto

```
ai-dashboard/
├── client/                      # Frontend React + Vite
│   ├── public/
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   │   ├── Login.jsx
│   │   │   ├── Chat.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/           # Servicios de API
│   │   │   └── api.js
│   │   ├── styles/             # Estilos CSS
│   │   │   ├── index.css
│   │   │   ├── App.css
│   │   │   ├── Login.css
│   │   │   ├── Chat.css
│   │   │   └── Dashboard.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                      # Backend Node.js + Express
│   ├── db/                     # Base de datos
│   │   ├── schema.sql
│   │   └── seed.js
│   ├── routes/                 # Rutas de API
│   │   ├── auth.js
│   │   ├── chat.js
│   │   └── pdf.js
│   ├── services/               # Servicios del backend
│   │   ├── aiService.js
│   │   ├── pdfService.js
│   │   └── webhookService.js
│   └── index.js
├── reporte-ejecutivo-dash.json # Datos de ejemplo
├── style.css                   # Estilos de referencia
├── prompt-example.md           # Prompt de IA
├── Dockerfile                  # Configuración Docker
├── railway.json                # Configuración Railway
├── .env.example                # Variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Instalación Local

### Prerrequisitos

- Node.js 18+ ([Descargar](https://nodejs.org/))
- PostgreSQL 14+ ([Descargar](https://www.postgresql.org/download/))
- Cuenta de Google Cloud Platform (para APIs)
- API Key de Google Gemini

### Paso 1: Clonar el Repositorio

```bash
git clone <tu-repositorio>
cd ai-dashboard
```

### Paso 2: Instalar Dependencias

```bash
# Instalar dependencias del backend
npm install

# Instalar dependencias del frontend
cd client
npm install
cd ..
```

### Paso 3: Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/ai_dashboard

# Google Gemini API
GOOGLE_API_KEY=tu_api_key_de_gemini

# n8n Webhook (para procesamiento de PDFs)
N8N_WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/pdf-report

# JWT Secret
JWT_SECRET=un_secreto_muy_seguro_cambialo_en_produccion

# App Configuration
CLIENT_URL=http://localhost:5173
```

### Paso 4: Configurar Base de Datos PostgreSQL

#### 4.1 Crear Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE ai_dashboard;

# Salir de psql
\q
```

#### 4.2 Ejecutar Seed

```bash
npm run seed
```

Este comando creará:
- Las tablas necesarias (`users`, `reportes`)
- Un usuario administrador por defecto: `admin@apprecio.com` / `admin123`
- Cargará los datos desde `reporte-ejecutivo-dash.json`

### Paso 5: Ejecutar en Modo Desarrollo

```bash
# Ejecutar frontend y backend simultáneamente
npm run dev
```

Esto iniciará:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173

## 🔑 Obtener Credenciales de Google

### Google Gemini API

1. Visita [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea un nuevo proyecto o selecciona uno existente
3. Genera una API Key
4. Copia la clave en `GOOGLE_API_KEY`

### Configurar n8n Webhook

El sistema utiliza n8n para procesar PDFs y enviarlos por email/Drive. Ver **[N8N_WEBHOOK_SETUP.md](./N8N_WEBHOOK_SETUP.md)** para instrucciones detalladas.

**Resumen rápido**:

1. Crea un workflow en n8n con:
   - **Webhook** → recibe POST con PDF binario
   - **Google Drive** → sube el PDF
   - **Gmail** → envía email con PDF adjunto
   - **Response** → confirma éxito

2. Copia la URL del webhook a `.env`:
   ```env
   N8N_WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/pdf-report
   ```

3. El backend enviará automáticamente:
   - `pdf`: Buffer binario del archivo
   - `userEmail`: Destinatario
   - `userName`: Nombre del usuario
   - `reportSummary`: Resumen del reporte
   - `reportDate`: Fecha del reporte
   - `fileName`: Nombre del archivo

📖 **Documentación completa**: [N8N_WEBHOOK_SETUP.md](./N8N_WEBHOOK_SETUP.md)

## 📦 Despliegue en Railway

### Guía Completa de Deployment

📖 **Ver documentación completa**: **[RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)**

Esta guía paso a paso incluye:
- ✅ Configuración de PostgreSQL
- ✅ Variables de entorno requeridas
- ✅ Inicialización de base de datos
- ✅ Troubleshooting común
- ✅ Comandos útiles de Railway CLI

### Quick Start

1. **Crear proyecto en Railway**:
   - Ve a [Railway.app](https://railway.app/)
   - Deploy from GitHub repo → Selecciona `Dashboard-AI`

2. **Agregar PostgreSQL**:
   - New → Database → PostgreSQL
   - Railway crea automáticamente `DATABASE_URL`

3. **Configurar Variables**:
   ```env
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=tu-secreto-seguro-de-32-chars
   GOOGLE_API_KEY=AIzaSyA...
   N8N_WEBHOOK_URL=https://n8n.openip.cl/webhook/pdf-report
   CLIENT_URL=${{RAILWAY_PUBLIC_DOMAIN}}
   ```

4. **Verificar deployment**:
   - Health check: `https://tu-app.up.railway.app/api/health`

⚠️ **Importante**: El webhook de n8n debe estar configurado y activo antes de generar PDFs.

### Paso 5: Ejecutar Seed

Después del primer despliegue, ejecuta el seed manualmente:

1. Ve a tu servicio en Railway
2. Abre la **Terminal**
3. Ejecuta:

```bash
npm run seed
```

### Paso 6: Verificar Despliegue

Railway generará una URL pública. Accede a ella para verificar que todo funciona.

## 🎯 Uso de la Aplicación

### 1. Login

Al abrir la aplicación, verás la pantalla de login.

**Credenciales por defecto:**
- Email: `admin@apprecio.com`
- Contraseña: `admin123`

### 2. Chat con IA

Una vez autenticado, verás el chat a la izquierda (o arriba en móvil).

**Ejemplos de preguntas:**

- "¿Cómo fue el desempeño en octubre?"
- "Muéstrame las métricas del canal Inbound"
- "¿Cuáles son las tendencias de leads este año?"
- "Analiza el desempeño de prospectos vs meta"
- "¿Qué canales están en alerta?"

### 3. Dashboard Visual

El dashboard mostrará automáticamente:
- Resumen ejecutivo
- Métricas principales (Leads, Prospectos, Clientes)
- Alertas y puntos de mejora
- Tendencias clave
- Oportunidades identificadas
- Riesgos potenciales

### 4. Generar y Enviar PDF

1. Después de recibir un análisis, verás el botón **"Enviar como PDF"**
2. Click en el botón
3. El sistema:
   - Generará un PDF profesional con tu reporte
   - Lo subirá a Google Drive
   - Te enviará un correo con el enlace al PDF

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia frontend y backend en modo desarrollo
npm run server:dev       # Solo backend
npm run client:dev       # Solo frontend

# Base de datos
npm run seed            # Ejecuta seed de la base de datos

# Producción
npm run build           # Construye el frontend para producción
npm start               # Inicia el servidor en producción
```

## 🔧 Tecnologías Utilizadas

### Frontend
- **React 18**: Framework UI
- **Vite**: Build tool y dev server
- **Recharts**: Gráficos y visualizaciones
- **Axios**: Cliente HTTP
- **Lucide React**: Íconos

### Backend
- **Node.js + Express**: Servidor web
- **PostgreSQL**: Base de datos
- **JWT + bcrypt**: Autenticación
- **Puppeteer**: Generación de PDF
- **Google Gemini**: IA para análisis
- **Google APIs**: Drive y Gmail

## 🎨 Personalización

### Cambiar Colores

Edita las variables CSS en `client/src/styles/index.css`:

```css
:root {
  --primary-color: #FA345E;
  --secondary-color: #FFFFFF;
  --text-primary: #1B1B1B;
  /* ... más colores */
}
```

### Agregar Nuevos Usuarios

Puedes agregar usuarios directamente en la base de datos:

```sql
-- Conectar a la base de datos
psql -d ai_dashboard

-- Insertar nuevo usuario (la contraseña será hasheada por el seed)
INSERT INTO users (email, password, nombre)
VALUES ('nuevo@email.com', '$2b$10$...', 'Nombre Usuario');
```

O modificar el archivo `server/db/seed.js` para agregar usuarios durante el seed.

## 🐛 Solución de Problemas

### Error: "Cannot connect to database"

Verifica que:
- PostgreSQL esté corriendo
- Las credenciales en `DATABASE_URL` sean correctas
- El firewall permita la conexión

### Error: "Puppeteer failed to launch"

En Railway, asegúrate de que el Dockerfile incluya las dependencias de Chromium.
En local, instala Chromium:

```bash
# macOS
brew install chromium

# Linux
sudo apt-get install chromium-browser
```

### Error: "Google API authentication failed"

Verifica que:
- Las credenciales de Service Account sean correctas
- Los permisos de Drive/Gmail estén habilitados
- El `GOOGLE_PRIVATE_KEY` mantenga los saltos de línea `\n`

### PDF no se envía por correo

Verifica que:
- La carpeta de Drive esté compartida con la Service Account
- La delegación domain-wide esté configurada (si usas Gmail)
- El scope de Gmail esté autorizado

## 📝 Licencia

MIT License

## 👥 Soporte

Para preguntas o problemas, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ para Apprecio**
