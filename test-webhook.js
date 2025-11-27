#!/usr/bin/env node

/**
 * Script para probar el envío al webhook de n8n
 * Genera un PDF de prueba y lo envía al webhook
 * 
 * Uso: node test-webhook.js
 */

import { sendToWebhook } from './server/services/webhookService.js';
import { generatePDF } from './server/services/pdfService.js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function testWebhook() {
  console.log('🧪 Iniciando prueba de webhook...\n');

  try {
    // 1. Verificar que N8N_WEBHOOK_URL esté configurado
    if (!process.env.N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL.includes('tu-instancia')) {
      console.error('❌ Error: N8N_WEBHOOK_URL no está configurado en .env');
      console.log('Por favor configura N8N_WEBHOOK_URL con la URL de tu webhook de n8n\n');
      process.exit(1);
    }

    console.log('✅ Webhook URL configurada:', process.env.N8N_WEBHOOK_URL);
    console.log('');

    // 2. Generar HTML de prueba
    const testHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { color: #FA345E; }
            .metric {
              background: #f5f5f5;
              padding: 20px;
              margin: 10px 0;
              border-radius: 8px;
            }
          </style>
        </head>
        <body>
          <img src="https://estudios.apprecio.com/hubfs/Logo%20Apprecio-03-1.png" alt="Apprecio" style="width: 150px;">
          <h1>Reporte de Prueba - Webhook n8n</h1>
          <p>Este es un PDF de prueba generado automáticamente para verificar el webhook.</p>
          
          <div class="metric">
            <h3>Métrica de Prueba</h3>
            <p><strong>Real:</strong> 1,000</p>
            <p><strong>Meta:</strong> 1,500</p>
            <p><strong>Cumplimiento:</strong> 66.7%</p>
          </div>

          <p><em>Fecha de generación: ${new Date().toLocaleString('es-ES')}</em></p>
        </body>
      </html>
    `;

    // 3. Generar PDF
    console.log('📄 Generando PDF de prueba...');
    const pdfPath = await generatePDF(testHTML, `test_${Date.now()}.pdf`);
    console.log('✅ PDF generado:', pdfPath);
    console.log('');

    // 4. Leer PDF como buffer
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log('📦 PDF leído como buffer:', pdfBuffer.length, 'bytes');
    console.log('');

    // 5. Enviar a webhook
    console.log('🌐 Enviando a webhook de n8n...');
    const result = await sendToWebhook({
      pdfBuffer: pdfBuffer,
      fileName: `test_webhook_${Date.now()}.pdf`,
      userEmail: 'test@apprecio.com',
      userName: 'Usuario de Prueba',
      reportSummary: 'Este es un reporte de prueba generado automáticamente para verificar el funcionamiento del webhook de n8n.',
      reportDate: new Date().toLocaleDateString('es-ES')
    });

    console.log('✅ Webhook respondió exitosamente!');
    console.log('📊 Respuesta:', JSON.stringify(result, null, 2));
    console.log('');

    // 6. Limpiar archivo temporal
    fs.unlinkSync(pdfPath);
    console.log('🧹 Archivo temporal eliminado');
    console.log('');

    console.log('════════════════════════════════════════');
    console.log('✅ PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('════════════════════════════════════════');
    console.log('');
    console.log('Verifica que:');
    console.log('1. Recibiste un email en test@apprecio.com');
    console.log('2. El PDF esté adjunto al email');
    console.log('3. El archivo se haya subido a Google Drive');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('════════════════════════════════════════');
    console.error('❌ ERROR EN LA PRUEBA');
    console.error('════════════════════════════════════════');
    console.error('');
    console.error('Mensaje:', error.message);
    console.error('');
    
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.status);
      console.error('Datos:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('');
    console.error('Posibles causas:');
    console.error('- El workflow de n8n no está activo');
    console.error('- La URL del webhook es incorrecta');
    console.error('- n8n no es accesible desde este servidor');
    console.error('- Hay un error en la configuración del workflow');
    console.error('');
    console.error('Ver N8N_WEBHOOK_SETUP.md para más información');
    console.error('');
    
    process.exit(1);
  }
}

// Ejecutar prueba
testWebhook();
