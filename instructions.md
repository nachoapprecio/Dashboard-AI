Instrucciones Maestras para Generación de Web App: Dashboard AI Dinámico

Actúa como un Arquitecto de Software Senior y Desarrollador Full Stack experto en React, Node.js, Puppeteer y Despliegue en Railway.

Tu tarea es generar el código completo para un repositorio de GitHub que contiene una Web App de Dashboard Analítico con Chatbot integrado, Autenticación y generación de reportes PDF.

1. Arquitectura del Proyecto

El proyecto debe ser un Monorepo (o estructura organizada) listo para desplegar en Railway.

Frontend: React + Vite.

Backend: Node.js con Express.

Microservicio de Reportes: Puppeteer (integrado en el backend o como servicio worker).

Base de Datos: PostgreSQL (Provisionada en Railway).

IA: Google Gemini API (modelo gemini-1.5-pro).

Integraciones Google: Google Drive API y Gmail API.

2. Flujo de Datos (Crítico)

Inicialización (Seed):

Cargar datos de reporte-ejecutivo-dash.json en PostgreSQL.

Seed de Usuarios: Crear un usuario administrador inicial en la tabla de usuarios para poder acceder.

Autenticación (Bloqueante):

Al entrar a la web, el chat y dashboard están bloqueados/ocultos.

Se muestra un formulario de Login.

El backend valida contra la tabla users en PostgreSQL.

Si es correcto -> Desbloquea la interfaz principal.

Consulta del Usuario: El usuario escribe una pregunta (ej: "¿Cómo fue el desempeño en octubre?").

Backend Processing (IA):

Recibe la pregunta.

Consulta DB.

Construye Prompt Masivo (Rol Analista + JSON Schema + Datos + Pregunta).

Consulta a Gemini API.

Renderizado: Frontend actualiza textos y gráficos animados.

Generación de PDF y Envío (On-Demand):

El usuario ve un botón "Enviar como PDF" bajo los resultados.

Al hacer clic, se activa el microservicio que convierte la vista actual (o un HTML renderizado) a PDF.

Se sube a Google Drive.

Se envía por correo al usuario vía Gmail API.

3. Requerimientos de Frontend (React + Vite)

Configuración Global y Assets

Favicon: Usa estrictamente esta URL: https://estudios.apprecio.com/hubfs/Logo%20Apprecio-03-1-1.png

Logo en Header: Agrega este logo en la cabecera de la página: https://estudios.apprecio.com/hubfs/Logo%20Apprecio-03-1.png

Tipografía: Montserrat (Google Fonts).

Colores: Ver style.css.

Responsive: La webapp debe estar totalmente optimizada para Mobile. Los gráficos y el chat deben ser legibles y usables en pantallas pequeñas (stacking de columnas, menú hamburguesa si es necesario, tamaños de fuente ajustables).

Componentes Clave

Login Screen: Simple, limpio, pide Correo y Contraseña.

Panel de Chat: Izquierda (Desktop) / Drawer o Modal (Mobile).

Dashboard Visual: Derecha (Desktop) / Debajo (Mobile).

Botón de Acción: "Enviar reporte como PDF". Debe aparecer solo cuando hay resultados visibles.

4. Requerimientos de Backend (Node.js)

Autenticación

Endpoint /api/login.

Validar credenciales contra una tabla users en PostgreSQL.

Nota: No es necesario un sistema de registro público. Los usuarios se crean directamente en la DB (vía SQL o seed).

Lógica de IA

Endpoint /api/chat.

Manejo de Gemini API con el prompt del sistema (prompt-example.md).

Microservicio de Reportes (Puppeteer + Google APIs)

Crea un controlador específico o servicio para esto:

Input: Recibe el HTML del reporte generado por la IA (o la data para renderizar una plantilla HTML en el servidor).

Puppeteer:

Lanza una instancia headless.

Renderiza el contenido.

Genera un archivo PDF (page.pdf()).

Google Drive:

Usa las credenciales de servicio de Google.

Sube el PDF generado a una carpeta específica en Drive.

Obtén el enlace de visualización/descarga.

Gmail:

Pide a la IA (Gemini) que genere un cuerpo de correo breve y profesional en HTML para acompañar el reporte.

Usa la API de Gmail para enviar un correo al usuario logueado.

Adjunta el PDF o incluye el link de Drive en el cuerpo.

5. Configuración de Despliegue (Railway)

Configuración de Puppeteer en Railway: Asegúrate de incluir en las instrucciones de Dockerfile o build pack las librerías necesarias para correr Chrome headless en Linux (ej. libnss3, libatk, etc., o usar un buildpack de puppeteer).

Variables de Entorno (.env.example):

PORT

DATABASE_URL

GOOGLE_API_KEY (Gemini)

GOOGLE_CLIENT_EMAIL (Service Account para Drive/Gmail)

GOOGLE_PRIVATE_KEY (Service Account para Drive/Gmail)

SMTP_USER / SMTP_PASS (Si decides usar Nodemailer como fallback, aunque la instrucción pide API de Google).

6. Archivos de Contexto

A. Datos: reporte-ejecutivo-dash.json

B. Estilos: style.css

C. Prompt: prompt-example.md

Entregables Esperados

Genera el código para:

package.json (incluyendo puppeteer, googleapis, pg, etc.).

server/index.js (Entry point).

server/auth.js (Rutas y lógica de login).

server/services/pdfService.js (Lógica de Puppeteer).

server/services/googleService.js (Lógica de Drive y Gmail).

client/src/App.jsx y Componentes (incluyendo Login y botón PDF).

Dockerfile (Optimizado para Node + Puppeteer en Railway).

README.md (DOCUMENTACIÓN):

Debe estar escrito íntegramente en Español.

Debe ser extremadamente detallado y claro.

Incluir secciones para:

Instalación Local: Pasos paso a paso (npm install, configuración de .env, npm run dev).

Estructura del Proyecto: Explicación breve de qué hace cada carpeta.

Variables de Entorno: Lista detallada de qué variables se necesitan y cómo obtener las credenciales de Google (Drive/Gmail API) y Gemini.

Despliegue en Railway: Guía rápida de cómo conectar el repo a Railway y configurar las variables.

Uso: Cómo loguearse (credenciales por defecto) y cómo usar el chat.

¡Comienza la generación!