import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Iniciando seed de la base de datos...');
    
    // Leer y ejecutar schema
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSQL);
    console.log('✅ Schema creado correctamente');
    
    // Crear usuario administrador
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (email, password, nombre)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO NOTHING
    `, ['imolina@apprecio.com', hashedPassword, 'Ignacio Molina']);
    console.log('✅ Usuario administrador creado (imolina@apprecio.com / admin123)');
    
    // Cargar datos del JSON remoto (nuevo formato 2026)
    console.log('📥 Descargando reporte desde: https://estudios.apprecio.com/hubfs/reporte-performance/reporte-ejecutivo-2026.json');
    let reportData;
    
    try {
      const response = await axios.get('https://estudios.apprecio.com/hubfs/reporte-performance/reporte-ejecutivo-2026.json');
      reportData = response.data;
      console.log('✅ Reporte descargado correctamente');
    } catch (downloadError) {
      console.warn('⚠️  No se pudo descargar desde URL remota, intentando usar archivo local...');
      try {
        const localPath = path.join(__dirname, '../../reporte-ejecutivo-dash.json');
        if (fs.existsSync(localPath)) {
          reportData = JSON.parse(fs.readFileSync(localPath, 'utf8'));
          console.log('✅ Usando archivo local: reporte-ejecutivo-dash.json');
        } else {
          throw new Error('No se encontró archivo local ni URL remota');
        }
      } catch (localError) {
        console.error('❌ Error cargando datos:', localError.message);
        throw localError;
      }
    }
    
    // Limpiar tabla de reportes tabulares (formato antiguo)
    await client.query('DELETE FROM reportes');

    // Normalizar estructura del JSON remoto (objeto, array, o array con { report })
    let reportPayload = null;
    if (Array.isArray(reportData) && reportData.length > 0) {
      if (reportData[0]?.report) {
        reportPayload = reportData[0].report;
      } else if (reportData[0]?.resumen_macro) {
        reportPayload = reportData[0];
      }
    } else if (reportData?.report) {
      reportPayload = reportData.report;
    } else if (reportData?.resumen_macro) {
      reportPayload = reportData;
    }

    // Extraer información del nuevo formato JSON
    if (reportPayload?.resumen_macro) {
      const report = reportPayload;
      const fecha = report.fecha_reporte || new Date().toISOString().split('T')[0];
      
      console.log(`📊 Procesando estructura nueva del reporte (fecha: ${fecha})`);
      
      // Guardar el reporte completo como JSON en BD para análisis posterior
      await client.query(`
        INSERT INTO reportes_json (fecha_reporte, datos_completos)
        VALUES ($1, $2)
        ON CONFLICT (fecha_reporte) DO UPDATE SET datos_completos = $2
      `, [fecha, JSON.stringify(report)]);
      
      console.log('✅ Reporte JSON guardado en base de datos');
    } else {
      // Formato antiguo: datos tabulares
      const dataArray = Array.isArray(reportData)
        ? reportData
        : reportData?.report
          ? [reportData.report]
          : [reportData];

      console.log(`📊 Procesando estructura antigua del reporte (${dataArray.length} registros)`);
      
      for (const row of dataArray) {
        if (!row?.fecha_del_reporte || typeof row.fecha_del_reporte !== 'string') {
          console.warn('⚠️ Registro omitido por estructura inválida:', row);
          continue;
        }

        const [day, month, year] = row.fecha_del_reporte.split('-');
        const fechaFormateada = `${year}-${month}-${day}`;
        
        await client.query(`
          INSERT INTO reportes (
            fecha_del_reporte, periodo, canal,
            leads_real, leads_meta, leads_avance_pct, leads_estado,
            prospectos_real, prospectos_meta, prospectos_avance_pct, prospectos_estado,
            cierres_real, cierres_meta, cierres_avance_pct, cierres_estado,
            es_mes_actual, dias_restantes,
            leads_real_ytd, leads_meta_ytd, leads_cumplimiento_ytd_pct,
            prospectos_real_ytd, prospectos_meta_ytd, prospectos_cumplimiento_ytd_pct,
            cierres_real_ytd, cierres_meta_ytd, cierres_cumplimiento_ytd_pct
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
            $18, $19, $20, $21, $22, $23, $24, $25, $26
          )
        `, [
          fechaFormateada,
          row.periodo,
          row.canal,
          row.leads_real,
          row.leads_meta,
          row.leads_avance_pct,
          row.leads_estado,
          row.prospectos_real,
          row.prospectos_meta,
          row.prospectos_avance_pct,
          row.prospectos_estado,
          row.cierres_real,
          row.cierres_meta,
          row.cierres_avance_pct,
          row.cierres_estado,
          row.es_mes_actual || false,
          row.dias_restantes,
          row.leads_real_ytd || null,
          row.leads_meta_ytd || null,
          row.leads_cumplimiento_ytd_pct || null,
          row.prospectos_real_ytd || null,
          row.prospectos_meta_ytd || null,
          row.prospectos_cumplimiento_ytd_pct || null,
          row.cierres_real_ytd || null,
          row.cierres_meta_ytd || null,
          row.cierres_cumplimiento_ytd_pct || null
        ]);
      }
      console.log(`✅ ${dataArray.length} registros insertados en la tabla reportes`);
    }
    
    console.log('🎉 Seed completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
