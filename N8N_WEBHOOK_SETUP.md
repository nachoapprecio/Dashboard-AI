# Configuración del Webhook de n8n para Procesamiento de PDFs

## Flujo del Sistema

```
Dashboard → Generar PDF → Webhook n8n → [Email + Drive Upload]
```

## Datos Enviados al Webhook

El webhook recibe un **multipart/form-data** con los siguientes campos:

### Archivo Binario
- **Campo**: `pdf`
- **Tipo**: `application/pdf`
- **Descripción**: Buffer binario del PDF generado

### Metadata (campos de texto)
- **userEmail**: Email del destinatario (ej: `imolina@apprecio.com`)
- **userName**: Nombre del usuario (ej: `Ignacio Molina`)
- **reportSummary**: Resumen ejecutivo del reporte
- **reportDate**: Fecha del reporte (formato: `27/11/2025`)
- **fileName**: Nombre del archivo (ej: `reporte_1764281234567.pdf`)

## Configuración en n8n

### 1. Crear Workflow

**Nombre**: `PDF Report Processor`

### 2. Nodo 1: Webhook

```json
{
  "httpMethod": "POST",
  "path": "pdf-report",
  "responseMode": "responseNode",
  "options": {}
}
```

**Configuración importante**:
- **HTTP Method**: `POST`
- **Path**: `pdf-report`
- **Response Mode**: `Response Node`
- **Input Data Field Name**: `data` (dejar por defecto)

**URL del Webhook**: `https://tu-instancia-n8n.com/webhook/pdf-report`

**Datos recibidos (multipart/form-data)**:
- `pdf` - Campo binario con el archivo PDF
- `fileName` - Nombre del archivo (texto)
- `userEmail` - Email del destinatario (texto)
- `userName` - Nombre del usuario (texto)
- `reportSummary` - Resumen del reporte (texto)
- `reportDate` - Fecha del reporte (texto)

Los datos de texto estarán disponibles en `$json.fileName`, `$json.userEmail`, etc.
El PDF binario estará en la propiedad binaria `pdf`.

### 3. Nodo 2: Google Drive - Upload File

**No necesitas el nodo "Extract Binary Data"** - el webhook ya procesa el form-data automáticamente.

**Configuración**:
- **File Name**: `{{ $json.fileName }}` o usar expresión personalizada
- **Binary Data**: `true`
- **Binary Property**: `pdf`
- **Parents**: ID de la carpeta de Drive donde guardar
- **Options**: 
  - Resolución de nombres: `Create New File`

**Credenciales**: OAuth2 de Google Drive (autenticación de usuario, no Service Account)

### 4. Nodo 3: Gmail - Send Email

**Configuración**:
- **To**: `{{ $json.userEmail }}`
- **Subject**: `Reporte Ejecutivo - {{ $json.reportDate }}`
- **Email Type**: `HTML`
- **Attachments**: 
  - **Binary Property**: `pdf`
  - **File Name**: `{{ $json.fileName }}`

**Cuerpo del Email (HTML)**:
```html
<html>
  <body style="font-family: Montserrat, Arial, sans-serif; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto;">
      <img src="https://estudios.apprecio.com/hubfs/Logo%20Apprecio-03-1.png" alt="Apprecio" style="width: 150px; margin-bottom: 20px;">
      <h2 style="color: #FA345E;">Reporte Ejecutivo - Dashboard AI</h2>
      
      <p>Estimado/a {{ $json.userName }},</p>
      <p>Se ha generado un nuevo reporte ejecutivo con la siguiente información:</p>
      
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
        {{ $json.reportSummary }}
      </div>
      
      <p>El reporte completo está adjunto a este correo en formato PDF.</p>
      
      <p style="margin-top: 20px;">
        <a href="{{ $node['Google Drive'].json.webViewLink }}" 
           style="background-color: #FA345E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Ver en Google Drive
        </a>
      </p>
      
      <p style="color: #666; margin-top: 30px; font-size: 12px;">
        Este es un mensaje automático generado por el Dashboard AI de Apprecio.
      </p>
    </div>
  </body>
</html>
```

**Credenciales**: OAuth2 de Gmail

### 5. Nodo 4: Respond to Webhook

**Configuración**:
```json
{
  "respondWith": "json",
  "responseBody": {
    "success": true,
    "message": "PDF procesado y enviado correctamente",
    "driveLink": "={{ $node['Google Drive'].json.webViewLink }}",
    "emailSent": true
  }
}
```

## Diagrama del Workflow

```
┌─────────────┐
│   Webhook   │ (Recibe POST con PDF + metadata)
└──────┬──────┘
       │
       v
┌─────────────┐
│Extract Data │ (Extrae binary del campo 'pdf')
└──────┬──────┘
       │
       ├───────────────────┐
       │                   │
       v                   v
┌─────────────┐    ┌─────────────┐
│Google Drive │    │    Gmail    │
│Upload File  │    │ Send Email  │
│             │    │with PDF     │
└──────┬──────┘    │attachment   │
       │           └──────┬──────┘
       │                  │
       v                  │
┌─────────────┐          │
│  Response   │◄─────────┘
│  to Webhook │
└─────────────┘
```

## Testing

### Probar el Webhook con curl

```bash
curl -X POST https://tu-instancia-n8n.com/webhook/pdf-report \
  -F "pdf=@/path/to/test.pdf" \
  -F "userEmail=imolina@apprecio.com" \
  -F "userName=Ignacio Molina" \
  -F "reportSummary=Este es un reporte de prueba" \
  -F "reportDate=27/11/2025" \
  -F "fileName=reporte_test.pdf"
```

### Probar desde el Dashboard

1. Generar análisis con Gemini
2. Presionar "Enviar como PDF"
3. Verificar logs del servidor:
   - ✅ PDF generado
   - ✅ PDF leído como buffer
   - ✅ Enviando a webhook de n8n
   - ✅ Webhook respondió: 200

## Variables de Entorno Necesarias

**En el servidor Node.js**:
```env
N8N_WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/pdf-report
```

## Errores Comunes

### Error: "N8N_WEBHOOK_URL no está configurado"
- Verifica que `.env` tenga la variable `N8N_WEBHOOK_URL`
- Reinicia el servidor después de modificar `.env`

### Error: 404 Not Found
- Verifica que el workflow de n8n esté activo
- Confirma que la ruta del webhook sea correcta

### Error: 413 Payload Too Large
- Aumenta el límite en n8n (Settings → Workflow Settings)
- O reduce el tamaño del PDF (menos páginas, menor calidad de imágenes)

### Email no se envía
- Verifica credenciales de Gmail OAuth2 en n8n
- Confirma que el campo `userEmail` sea válido
- Revisa logs de n8n para errores específicos

## Ventajas de esta Arquitectura

✅ **Desacoplamiento**: El backend solo genera PDFs, n8n maneja email/drive
✅ **Flexibilidad**: Fácil agregar más acciones en n8n (Slack, Teams, etc.)
✅ **Sin Service Account**: n8n usa OAuth2 normal, sin limitaciones
✅ **Trazabilidad**: Logs centralizados en n8n
✅ **Escalabilidad**: n8n puede procesar múltiples webhooks en paralelo
✅ **Mantenibilidad**: Cambios en email/drive sin tocar código backend

## Próximos Pasos

1. Configurar n8n en tu servidor o usar n8n Cloud
2. Crear el workflow según este documento
3. Actualizar `N8N_WEBHOOK_URL` en `.env`
4. Reiniciar servidor Node.js
5. Probar generación de PDF desde el dashboard
