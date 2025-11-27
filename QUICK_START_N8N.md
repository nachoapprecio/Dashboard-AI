# 🚀 Inicio Rápido: Configuración de n8n

## ¿Qué necesitas?

1. Una instancia de n8n (puede ser n8n Cloud o self-hosted)
2. Cuenta de Google con acceso a Gmail y Drive

## Configuración en 5 minutos

### 1️⃣ Crear el Workflow en n8n

**a) Crea un nuevo workflow**
- Nombre: `PDF Report Processor`

**b) Agrega los nodos en este orden:**

```
Webhook → Google Drive → Gmail → Respond to Webhook
```

### 2️⃣ Configurar cada nodo

#### Nodo 1: Webhook
- HTTP Method: `POST`
- Path: `pdf-report`
- Response Mode: `Response Node`
- **Input Data Field Name**: `data` (dejar por defecto)

**Importante**: El webhook recibirá un `multipart/form-data` con:
- Campo binario: `pdf` (el archivo PDF)
- Campos de texto: `fileName`, `userEmail`, `userName`, `reportSummary`, `reportDate`

#### Nodo 2: Google Drive
- Operation: `Upload a file`
- Drive: `My Drive` (o selecciona un Drive compartido)
- Folder: Selecciona la carpeta donde guardar PDFs
- File Name: `{{ $json.fileName }}`
- Binary Data: `✓` (activado)
- Binary Property Name: `pdf`

**Credenciales**: Conecta tu cuenta de Google (OAuth2)

#### Nodo 3: Gmail
- Operation: `Send Email`
- To Email: `{{ $json.userEmail }}`
- Subject: `Reporte Ejecutivo - {{ $json.reportDate }}`
- Email Type: `HTML`
- Message (HTML):
```html
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <img src="https://estudios.apprecio.com/hubfs/Logo%20Apprecio-03-1.png" style="width: 150px;">
    <h2 style="color: #FA345E;">Reporte Ejecutivo</h2>
    <p>Estimado/a {{ $json.userName }},</p>
    <p>{{ $json.reportSummary }}</p>
    <p><a href="{{ $node['Google Drive'].json.webViewLink }}" style="background: #FA345E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Ver en Drive</a></p>
  </div>
</body>
</html>
```

**Attachments**:
- Add Attachment → `Binary`
- Binary Property: `pdf`
- File Name: `{{ $json.fileName }}`

**Credenciales**: Conecta tu cuenta de Gmail (OAuth2)

#### Nodo 4: Respond to Webhook
- Respond With: `JSON`
- Response Body:
```json
{
  "success": true,
  "message": "PDF procesado correctamente",
  "driveLink": "={{ $node['Google Drive'].json.webViewLink }}"
}
```

### 3️⃣ Activar y Copiar URL

1. **Activa** el workflow (toggle en la parte superior)
2. **Copia** la URL del webhook (aparece en el nodo Webhook)
3. Ejemplo: `https://tu-n8n.com/webhook/pdf-report`

### 4️⃣ Configurar en el Backend

Edita `.env`:
```env
N8N_WEBHOOK_URL=https://tu-n8n.com/webhook/pdf-report
```

### 5️⃣ Probar

```bash
npm run test:webhook
```

Si todo está bien, verás:
```
✅ PRUEBA COMPLETADA EXITOSAMENTE
```

Y recibirás un email en `test@apprecio.com` con el PDF adjunto.

## ✅ Checklist

- [ ] Workflow creado en n8n
- [ ] Webhook configurado (POST /pdf-report)
- [ ] Google Drive conectado
- [ ] Gmail conectado
- [ ] Workflow activado
- [ ] URL copiada a .env
- [ ] Test ejecutado exitosamente

## 🔧 Troubleshooting

**Error: 404 Not Found**
→ Verifica que el workflow esté activo

**Error: Credenciales Gmail**
→ Reconecta tu cuenta de Google en n8n

**Error: No se sube a Drive**
→ Verifica que la carpeta exista y tengas permisos

**Email no llega**
→ Revisa spam, verifica que `userEmail` sea válido

## 📚 Documentación Completa

Para configuración avanzada, ver [N8N_WEBHOOK_SETUP.md](./N8N_WEBHOOK_SETUP.md)
