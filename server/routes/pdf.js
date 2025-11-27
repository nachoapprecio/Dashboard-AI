import express from 'express';
import { generatePDF } from '../services/pdfService.js';
import { sendToWebhook } from '../services/webhookService.js';
import { authenticateToken } from './auth.js';
import fs from 'fs';

const router = express.Router();

// Endpoint para generar y enviar PDF
router.post('/generate', authenticateToken, async (req, res) => {
  const { htmlContent, reportSummary } = req.body;

  if (!htmlContent) {
    return res.status(400).json({ error: 'Contenido HTML es requerido' });
  }

  try {
    const fileName = `reporte_${Date.now()}.pdf`;
    
    // 1. Generar PDF con Puppeteer
    console.log('📄 Generando PDF...');
    const pdfPath = await generatePDF(htmlContent, fileName);
    
    // 2. Leer PDF como buffer binario
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log('📦 PDF leído como buffer:', pdfBuffer.length, 'bytes');
    
    // 3. Enviar a webhook de n8n
    console.log('🌐 Enviando a webhook de n8n...');
    await sendToWebhook({
      pdfBuffer: pdfBuffer,
      fileName: fileName,
      userEmail: req.user.email,
      userName: req.user.nombre || 'Usuario',
      reportSummary: reportSummary || 'Nuevo reporte ejecutivo disponible',
      reportDate: new Date().toLocaleDateString('es-ES')
    });
    
    // 4. Limpiar archivo temporal
    fs.unlinkSync(pdfPath);
    console.log('✅ Proceso completado');
    
    res.json({
      success: true,
      message: 'Reporte generado y enviado a procesamiento',
      sentTo: req.user.email
    });
  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({ 
      error: 'Error generando reporte',
      details: error.message 
    });
  }
});

export default router;
