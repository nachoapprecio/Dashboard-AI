import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';
import nodemailer from 'nodemailer';

dotenv.config();

// Configurar autenticación con Service Account
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/gmail.send'
  ],
});

// Configurar transporter de nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Subir PDF a Google Drive
export async function uploadToDrive(pdfBuffer, fileName) {
  try {
    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
    };

    const media = {
      mimeType: 'application/pdf',
      body: fs.createReadStream(pdfBuffer)
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });

    // Hacer el archivo público (opcional)
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    return {
      fileId: file.data.id,
      webViewLink: file.data.webViewLink
    };
  } catch (error) {
    console.error('Error subiendo a Google Drive:', error);
    throw error;
  }
}

// Enviar correo con Gmail usando nodemailer
export async function sendEmailWithGmail(to, subject, htmlBody, driveLink = null, attachmentPath = null) {
  try {
    console.log('📧 Enviando correo con nodemailer...');

    // Si hay driveLink, incluirlo en el cuerpo
    const driveLinkSection = driveLink ? `
      <p style="margin-top: 20px;">
        <a href="${driveLink}" style="background-color: #FA345E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Ver Reporte en Drive
        </a>
      </p>
    ` : '';

    const emailContent = `
      <html>
        <body style="font-family: Montserrat, Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <img src="https://estudios.apprecio.com/hubfs/Logo%20Apprecio-03-1.png" alt="Apprecio" style="width: 150px; margin-bottom: 20px;">
            <h2 style="color: #FA345E;">Reporte Ejecutivo - Dashboard AI</h2>
            ${htmlBody}
            ${driveLinkSection}
            <p style="color: #666; margin-top: 30px; font-size: 12px;">
              Este es un mensaje automático generado por el Dashboard AI de Apprecio.
            </p>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: to,
      subject: subject,
      html: emailContent
    };

    // Si hay archivo adjunto, agregarlo
    if (attachmentPath) {
      console.log('📎 Adjuntando PDF:', attachmentPath);
      mailOptions.attachments = [{
        filename: `reporte_${Date.now()}.pdf`,
        path: attachmentPath
      }];
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado correctamente:', info.messageId);
    console.log('📮 Destinatario:', to);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando correo con nodemailer:', error);
    throw error;
  }
}

// Generar cuerpo de correo con IA
export async function generateEmailBody(reportSummary) {
  const emailBody = `
    <p>Estimado/a,</p>
    <p>Se ha generado un nuevo reporte ejecutivo con la siguiente información:</p>
    ${reportSummary}
    <p>Puede acceder al reporte completo en formato PDF haciendo clic en el botón a continuación.</p>
  `;
  
  return emailBody;
}
