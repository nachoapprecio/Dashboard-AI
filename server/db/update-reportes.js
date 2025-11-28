import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script para actualizar SOLO la tabla reportes
 * Mantiene intacta la tabla de usuarios
 * 
 * Uso:
 * 1. Actualiza el archivo reporte-ejecutivo-dash.json con tus nuevos datos
 * 2. Ejecuta: DATABASE_URL="postgresql://..." node server/db/update-reportes.js
 */
async function updateReportes() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Actualizando reportes...');
    console.log('⚠️  Los usuarios NO serán afectados');
    
    // Eliminar solo los reportes existentes
    await client.query('DELETE FROM reportes');
    console.log('✅ Reportes antiguos eliminados');
    
    // Cargar datos de reporte-ejecutivo-dash.json
    const reportePath = path.join(__dirname, '../../reporte-ejecutivo-dash.json');
    
    if (!fs.existsSync(reportePath)) {
      throw new Error('❌ Archivo reporte-ejecutivo-dash.json no encontrado');
    }
    
    const reportesData = JSON.parse(fs.readFileSync(reportePath, 'utf8'));
    
    if (!Array.isArray(reportesData) || reportesData.length === 0) {
      throw new Error('❌ El archivo JSON debe contener un array con al menos un reporte');
    }
    
    console.log(`📝 Insertando ${reportesData.length} reportes...`);
    
    // Insertar cada reporte
    let count = 0;
    for (const reporte of reportesData) {
      await client.query(`
        INSERT INTO reportes (
          year, month, cliente, rubro, tipo_proyecto, 
          inversion_clp, leads, cpl_clp, conversiones, 
          cpa_clp, roas, roi_percent, canal_principal, 
          objetivo_campana, recomendacion
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        reporte.year,
        reporte.month,
        reporte.cliente,
        reporte.rubro,
        reporte.tipo_proyecto,
        reporte.inversion_clp,
        reporte.leads,
        reporte.cpl_clp,
        reporte.conversiones,
        reporte.cpa_clp,
        reporte.roas,
        reporte.roi_percent,
        reporte.canal_principal,
        reporte.objetivo_campana,
        reporte.recomendacion
      ]);
      count++;
    }
    
    console.log(`✅ ${count} reportes insertados exitosamente`);
    console.log('🎉 Actualización de reportes completada!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al actualizar reportes:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

updateReportes();
