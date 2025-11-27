import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Envía el PDF y datos del reporte al webhook de n8n
 * @param {Object} data - Datos a enviar
 * @param {Buffer} data.pdfBuffer - Buffer binario del PDF
 * @param {string} data.fileName - Nombre del archivo PDF
 * @param {string} data.userEmail - Email del usuario
 * @param {string} data.userName - Nombre del usuario
 * @param {string} data.reportSummary - Resumen del reporte
 * @param {string} data.reportDate - Fecha del reporte
 */
export async function sendToWebhook(data) {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!webhookUrl) {
      throw new Error('N8N_WEBHOOK_URL no está configurado en .env');
    }

    // Crear FormData para enviar archivo binario
    const formData = new FormData();
    
    // Agregar el PDF como archivo binario
    formData.append('pdf', data.pdfBuffer, {
      filename: data.fileName,
      contentType: 'application/pdf'
    });
    
    // Agregar metadata como campos del formulario
    formData.append('userEmail', data.userEmail);
    formData.append('userName', data.userName);
    formData.append('reportSummary', data.reportSummary);
    formData.append('reportDate', data.reportDate);
    formData.append('fileName', data.fileName);

    // Enviar a n8n
    const response = await axios.post(webhookUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('✅ Webhook de n8n respondió:', response.status);
    console.log('📊 Respuesta:', response.data);

    return {
      success: true,
      response: response.data
    };

  } catch (error) {
    console.error('❌ Error enviando a webhook de n8n:', error.message);
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.status, error.response.data);
    }
    throw error;
  }
}
