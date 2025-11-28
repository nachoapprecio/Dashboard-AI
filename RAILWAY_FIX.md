# 🎯 Quick Fix - Railway "Cannot GET /" Error

## Problema Actual

Al abrir la URL de Railway obtienes: **"Cannot GET /"**

## ✅ Solución Inmediata

### 1. Verificar que el Build Está Completo

En Railway:
1. Ve a **Deployments**
2. Verifica que el último deploy muestra **"Success"** (no "Building" ni "Failed")
3. Si está en "Failed", mira los logs para ver el error

### 2. Verificar Variables de Entorno

En Railway → **Variables**, asegúrate de tener TODAS estas:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=cualquier-string-largo-y-seguro-de-32-chars-minimo
GOOGLE_API_KEY=AIzaSyAGy1_u2qRIxLMW5a2K2RDrbFtv2XwQ6D0
N8N_WEBHOOK_URL=https://n8n.openip.cl/webhook/pdf-report
CLIENT_URL=https://tu-dominio.up.railway.app
```

⚠️ **NO agregues** `DATABASE_URL` manualmente - Railway la crea automáticamente cuando agregas PostgreSQL.

### 3. Verificar que PostgreSQL Está Activo

1. En Railway, verifica que tienes un servicio **PostgreSQL**
2. Si NO lo tienes: Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Espera 30 segundos a que se active
4. Railway creará automáticamente la variable `DATABASE_URL`

### 4. Forzar Re-Deploy

Después de agregar variables o PostgreSQL:

1. Ve a **Settings** (del servicio backend, no de PostgreSQL)
2. Scroll hasta **"Danger Zone"**
3. Click en **"Redeploy"**

O simplemente haz un push vacío:
```bash
git commit --allow-empty -m "Trigger Railway redeploy"
git push
```

### 5. Verificar Health Check

Una vez que el deploy termine, abre en tu navegador:

```
https://tu-dominio.up.railway.app/api/health
```

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

Si ves esto, ¡el backend funciona! Ahora prueba la raíz:

```
https://tu-dominio.up.railway.app/
```

Deberías ver el login de la aplicación.

## 🐛 Si Sigue Sin Funcionar

### Revisa los Logs

En Railway:
1. Click en el servicio (backend)
2. Ve a la pestaña **"Logs"**
3. Busca errores como:
   - `Cannot find module` → Falta un `npm install`
   - `ENOENT: no such file or directory, open '.../dist/index.html'` → El frontend NO se compiló
   - `Connection refused` → PostgreSQL no está conectado
   - `Invalid API key` → La API Key de Gemini es incorrecta

### Frontend No Se Compiló

Si ves el error de `dist/index.html`:

**Causa**: El build del frontend falló o no se ejecutó.

**Solución**:
```bash
# Localmente, verifica que el build funciona
cd client
npm install
npm run build

# Verifica que se creó client/dist/index.html
ls client/dist/

# Si funciona local, commitea y pushea
git add .
git commit -m "Fix build"
git push
```

### PostgreSQL No Conecta

**Solución**:
1. Verifica que PostgreSQL está en estado **"Active"** (no "Deploying")
2. En el servicio de PostgreSQL, ve a **"Variables"**
3. Copia el valor de `DATABASE_URL`
4. En el servicio de **backend**, ve a **"Variables"** 
5. Verifica que `DATABASE_URL` existe y tiene el mismo valor

⚠️ Si NO existe en backend, Railway debería crearla automáticamente. Si no:
- Ve a **Settings** → **"Service Variables"**
- Habilita el checkbox de compartir variables entre servicios

## 📝 Checklist Rápido

- [ ] PostgreSQL agregado y activo
- [ ] `NODE_ENV=production` configurada
- [ ] `JWT_SECRET` configurada (mínimo 32 caracteres)
- [ ] `GOOGLE_API_KEY` configurada con tu API key real
- [ ] `N8N_WEBHOOK_URL` configurada
- [ ] `CLIENT_URL` configurada con tu dominio de Railway
- [ ] `DATABASE_URL` existe (creada automáticamente)
- [ ] Build completado sin errores
- [ ] `/api/health` responde con JSON
- [ ] `/` muestra el login

## 🔧 Comando de Emergencia

Si nada funciona, en Railway Settings:

1. **Delete** el servicio actual (NO borres PostgreSQL)
2. **+ New** → **GitHub Repo** → Selecciona `Dashboard-AI`
3. Vuelve a configurar las variables de entorno
4. El servicio se reconstruirá desde cero

## 📞 Siguiente Paso

Si completaste el checklist y sigue sin funcionar, copia el output de:

1. Railway Logs (últimas 50 líneas)
2. La respuesta de `/api/health` (si existe)
3. Las variables de entorno que tienes configuradas (sin mostrar los valores secretos)

---

**Documentación completa**: Ver [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)
