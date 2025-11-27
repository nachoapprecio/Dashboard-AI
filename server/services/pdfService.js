import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generatePDF(htmlContent, fileName = 'reporte.pdf') {
  let browser;
  
  try {
    // Configuración de Puppeteer para Railway/producción
    const puppeteerConfig = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ],
      timeout: 60000
    };

    // En desarrollo local, usar el Chromium instalado
    if (process.env.NODE_ENV !== 'production') {
      // Ir a la raíz del proyecto desde server/services/
      const projectRoot = path.resolve(__dirname, '../..');
      const chromePath = path.join(projectRoot, 'chrome/mac_arm-142.0.7444.175/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
      console.log('🔍 Buscando Chrome en:', chromePath);
      puppeteerConfig.executablePath = chromePath;
    }

    browser = await puppeteer.launch(puppeteerConfig);
    const page = await browser.newPage();

    // Inyectar estilos personalizados (basados en Dashboard.css)
    const styledHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte Ejecutivo</title>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          :root {
            --primary-color: #FA345E;
            --success-color: #10b981;
            --warning-color: #f59e0b;
            --text-primary: #1B1B1B;
            --text-secondary: #64748b;
            --text-light: #94a3b8;
            --bg-secondary: #f8f9fa;
            --border-color: #e2e8f0;
            --border-radius: 8px;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Montserrat', sans-serif;
            color: var(--text-primary);
            padding: 30px;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid var(--primary-color);
            padding-bottom: 20px;
          }
          
          .logo {
            width: 200px;
            margin-bottom: 20px;
          }
          
          h1 {
            color: var(--primary-color);
            font-size: 32px;
            margin-bottom: 10px;
          }
          
          h2 {
            color: var(--text-primary);
            font-size: 22px;
            margin-top: 30px;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 2px solid var(--border-color);
          }
          
          h3 {
            color: var(--primary-color);
            font-size: 18px;
            margin-top: 20px;
            margin-bottom: 12px;
          }
          
          p {
            color: var(--text-primary);
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 10px;
          }
          
          ul, ol {
            margin-left: 20px;
            margin-bottom: 15px;
          }
          
          li {
            color: var(--text-primary);
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 8px;
          }
          
          .section {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            page-break-inside: avoid;
          }
          
          .metric-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
            border-left: 4px solid var(--primary-color);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            page-break-inside: avoid;
          }
          
          .metric-title {
            font-weight: 600;
            color: var(--primary-color);
            font-size: 16px;
            margin-bottom: 8px;
          }
          
          .metric-value {
            font-size: 28px;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 8px;
          }
          
          .metric-meta {
            font-size: 14px;
            color: var(--text-light);
            margin-bottom: 8px;
          }
          
          .metric-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .metric-status.success,
          .status-cumplido {
            background: #d1fae5;
            color: #065f46;
          }
          
          .metric-status.warning,
          .status-alerta {
            background: #fef3c7;
            color: #92400e;
          }
          
          .metric-comment {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            font-size: 13px;
            line-height: 1.5;
            color: var(--text-secondary);
          }
          
          .insight-card {
            padding: 16px;
            border-radius: var(--border-radius);
            margin-bottom: 12px;
            border-left: 4px solid;
            page-break-inside: avoid;
          }
          
          .insight-card.success {
            background: #f0fdf4;
            border-color: var(--success-color);
          }
          
          .insight-card.warning {
            background: #fffbeb;
            border-color: var(--warning-color);
          }
          
          .insight-card.primary {
            background: #fef2f2;
            border-color: var(--primary-color);
          }
          
          .channel-card {
            padding: 16px;
            background: var(--bg-secondary);
            border-radius: var(--border-radius);
            border-left: 3px solid var(--primary-color);
            margin-bottom: 12px;
            page-break-inside: avoid;
          }
          
          .channel-card h4 {
            font-size: 16px;
            margin-bottom: 8px;
            color: var(--primary-color);
            font-weight: 600;
          }
          
          .channel-card p {
            font-size: 14px;
            line-height: 1.6;
            color: var(--text-secondary);
            margin: 0;
          }
          
          .insights-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .insights-list li {
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: var(--border-radius);
            border-left: 4px solid;
            font-size: 14px;
            line-height: 1.6;
            page-break-inside: avoid;
          }
          
          .insights-list.success li {
            background: #d1fae5;
            border-left-color: var(--success-color);
            color: #065f46;
          }
          
          .insights-list.warning li {
            background: #fef3c7;
            border-left-color: var(--warning-color);
            color: #92400e;
          }
          
          .insights-list.primary li {
            background: #fce7f3;
            border-left-color: var(--primary-color);
            color: #831843;
          }
          
          .subsection {
            margin-top: 20px;
          }
          
          .subsection h3 {
            font-size: 18px;
            margin-bottom: 12px;
            color: var(--text-primary);
          }
          
          .subsection .insight-card h4 {
            font-size: 16px;
            margin-bottom: 8px;
            color: var(--text-primary);
          }
          
          .summary-text {
            font-size: 16px;
            line-height: 1.8;
            color: var(--text-primary);
          }
          
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 20px;
          }
          
          .channel-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-top: 16px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          th, td {
            border: 1px solid var(--border-color);
            padding: 12px;
            text-align: left;
            font-size: 13px;
          }
          
          th {
            background-color: var(--primary-color);
            color: white;
            font-weight: 600;
          }
          
          tr:nth-child(even) {
            background-color: var(--bg-secondary);
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid var(--border-color);
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          
          @page {
            margin: 1.5cm;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://estudios.apprecio.com/hubfs/Logo%20Apprecio-03-1.png" alt="Apprecio" class="logo">
          <h1>Reporte Ejecutivo</h1>
          <p style="color: #666;">Generado el ${new Date().toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
        
        ${htmlContent}
        
        <div class="footer">
          <p>Dashboard AI - Apprecio © ${new Date().getFullYear()}</p>
          <p>Reporte generado automáticamente por el sistema de análisis inteligente</p>
        </div>
      </body>
      </html>
    `;

    await page.setContent(styledHTML, { waitUntil: 'networkidle0' });

    // Generar PDF
    const pdfPath = path.join('/tmp', fileName);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();
    
    return pdfPath;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('Error generando PDF:', error.message);
    
    // Mensaje más claro para desarrollo
    if (error.message?.includes('socket hang up') || error.message?.includes('ECONNRESET')) {
      throw new Error('Puppeteer no pudo conectarse a Chrome. En desarrollo local, esto es normal. La funcionalidad de PDF funcionará correctamente en producción (Railway).');
    }
    
    throw error;
  }
}
