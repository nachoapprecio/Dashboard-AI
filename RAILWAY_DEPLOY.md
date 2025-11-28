# 🚀 Deployment en Railway

Esta guía te ayudará a desplegar el Dashboard AI en Railway con PostgreSQL.

## 📋 Pre-requisitos

- Cuenta en [Railway.app](https://railway.app)
- Repositorio en GitHub (https://github.com/nachoapprecio/Dashboard-AI)
- API Key de Google Gemini
- URL de webhook n8n configurado

## 🔧 Paso 1: Crear Proyecto en Railway

1. Ve a [Railway.app](https://railway.app) e inicia sesión
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Autoriza Railway a acceder a tu cuenta de GitHub
5. Selecciona el repositorio `Dashboard-AI`

## 💾 Paso 2: Agregar PostgreSQL

1. En tu proyecto de Railway, click en **"+ New"**
2. Selecciona **"Database"** → **"Add PostgreSQL"**
3. Railway creará automáticamente la variable `DATABASE_URL`
4. Espera a que la base de datos esté lista (aprox. 30 segundos)

## 🗄️ Paso 3: Inicializar Base de Datos

Railway ejecutará automáticamente las migraciones, pero puedes verificar:

1. Click en el servicio de PostgreSQL
2. Ve a la pestaña **"Data"**
3. Verifica que existan las tablas: `users`, `conversations`

Si necesitas ejecutar manualmente:
```bash
# Conectarse a PostgreSQL desde Railway CLI
railway connect postgres

# O ejecutar seed desde el proyecto
railway run npm run seed
```

## 🔐 Paso 4: Configurar Variables de Entorno

En el servicio de **backend** (no en PostgreSQL), ve a **Variables** y agrega:

### Variables Requeridas:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=un-secreto-super-seguro-de-al-menos-32-caracteres
GOOGLE_API_KEY=AIzaSyA...tu-api-key-de-gemini
N8N_WEBHOOK_URL=https://n8n.openip.cl/webhook/pdf-report
CLIENT_URL=${{RAILWAY_PUBLIC_DOMAIN}}
```

### Variables Automáticas (NO las agregues manualmente):
- `DATABASE_URL` - Creada automáticamente por Railway al agregar PostgreSQL

### Cómo obtener CLIENT_URL:

1. Railway te dará un dominio automático como `tu-app.up.railway.app`
2. O puedes usar tu dominio personalizado
3. La variable `${{RAILWAY_PUBLIC_DOMAIN}}` se autocompleta

## 📦 Paso 5: Deploy Automático

Railway detectará automáticamente el proyecto Node.js y:

1. ✅ Instalará dependencias del root (`npm ci`)
2. ✅ Instalará dependencias del cliente (`cd client && npm ci`)
3. ✅ Compilará el frontend React (`cd client && npm run build`)
4. ✅ Iniciará el servidor (`node server/index.js`)

El proceso toma aproximadamente 3-5 minutos.

## 🌐 Paso 6: Verificar Deployment

1. Espera a que el build termine (status: **Active**)
2. Click en el botón de **"Open App"** o visita tu dominio
3. Verifica el health check: `https://tu-app.up.railway.app/api/health`

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2025-11-28T...",
  "environment": "production",
  "database": "configured",
  "webhook": "configured"
}
```

## 👤 Paso 7: Crear Usuario Admin

Ejecuta el seed para crear el usuario de prueba:

```bash
railway run npm run seed
```

O conéctate a la base de datos y ejecuta manualmente:

```sql
INSERT INTO users (email, password, name)
VALUES (
  'imolina@apprecio.com',
  '$2b$10$...', -- Hash de 'admin123'
  'Ignacio Molina'
);
```

## 🔄 Configurar Auto-Deploy

Railway ya tiene auto-deploy configurado por defecto:

1. Cada push a `main` en GitHub → Deploy automático
2. Ve a **Settings** → **Deploy** para cambiar la rama
3. Puedes desactivar auto-deploy si prefieres deployments manuales

## 🐛 Troubleshooting

### Error: "Cannot GET /"

**Causa**: El frontend no se compiló o no se está sirviendo correctamente.

**Solución**:
```bash
# Verificar que client/dist existe
railway run ls client/dist

# Re-ejecutar build manualmente
railway run npm run build
```

### Error: "Database connection failed"

**Causa**: Variable `DATABASE_URL` no está configurada.

**Solución**:
1. Verifica que PostgreSQL esté activo
2. Railway debería crear `DATABASE_URL` automáticamente
3. Ve a Variables y confirma que existe

### Error: "Gemini API failed"

**Causa**: API Key incorrecta o no configurada.

**Solución**:
1. Verifica `GOOGLE_API_KEY` en Variables
2. Confirma que la API Key es válida en [Google AI Studio](https://makersuite.google.com/app/apikey)

### Error: "Webhook failed"

**Causa**: URL de n8n incorrecta o workflow inactivo.

**Solución**:
1. Verifica `N8N_WEBHOOK_URL` en Variables
2. Prueba el webhook manualmente con curl
3. Confirma que el workflow n8n está activo

## 📊 Monitoreo

Railway provee métricas automáticas:

1. **Deployments** - Historial de deploys
2. **Metrics** - CPU, RAM, Network
3. **Logs** - Console output en tiempo real

Para ver logs en vivo:
```bash
railway logs
```

## 💰 Pricing

- **Starter Plan** (Gratis): $5 USD de crédito mensual
- **Developer Plan**: $20 USD/mes
- El proyecto consume aprox. $5-10 USD/mes dependiendo del uso

## 🔒 Seguridad

1. ✅ Cambiar `JWT_SECRET` a un valor único y complejo
2. ✅ No commitear `.env` al repositorio (ya en `.gitignore`)
3. ✅ Usar HTTPS (Railway lo provee automáticamente)
4. ✅ Limitar CORS a tu dominio específico (ya configurado)

## 📝 Comandos Útiles de Railway CLI

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Conectar a proyecto
railway link

# Ver variables
railway variables

# Ejecutar comandos
railway run node server/db/seed.js

# Ver logs
railway logs

# Conectar a PostgreSQL
railway connect postgres
```

## 🎯 Checklist de Deploy

- [ ] PostgreSQL agregado y activo
- [ ] Variables de entorno configuradas
- [ ] Build completado exitosamente
- [ ] Health check responde correctamente
- [ ] Usuario admin creado
- [ ] Login funciona
- [ ] Chat con Gemini responde
- [ ] Generación de PDF funciona
- [ ] Webhook n8n recibe PDFs
- [ ] Email con PDF llega correctamente

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs: `railway logs`
2. Verifica health check: `/api/health`
3. Consulta docs de Railway: https://docs.railway.app
4. Consulta docs del proyecto: `README.md`

---

**Última actualización**: 28 de noviembre de 2025
