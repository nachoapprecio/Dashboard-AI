import express from 'express';
import pool from '../config/db.js';
import { generateAIResponse } from '../services/aiService.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Chat endpoint - requiere autenticación
router.post('/chat', authenticateToken, async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Pregunta es requerida' });
  }

  try {
    // Priorizar el formato nuevo (reportes_json) y mantener fallback al formato antiguo
    const latestJsonReport = await pool.query(`
      SELECT fecha_reporte, datos_completos
      FROM reportes_json
      ORDER BY fecha_reporte DESC
      LIMIT 1
    `);

    let reportData;

    if (latestJsonReport.rows.length > 0) {
      reportData = latestJsonReport.rows[0].datos_completos;
    } else {
      const result = await pool.query(`
        SELECT * FROM reportes 
        ORDER BY fecha_del_reporte DESC, canal
      `);
      reportData = result.rows;
    }

    if (!reportData || (Array.isArray(reportData) && reportData.length === 0)) {
      return res.status(404).json({ error: 'No hay datos de reporte cargados en la base de datos' });
    }

    // Generar respuesta con IA
    const aiResponse = await generateAIResponse(question, reportData);

    res.json({
      question,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({ 
      error: 'Error procesando la pregunta',
      details: error.message 
    });
  }
});

// Endpoint para obtener datos de reporte específicos (opcional)
router.get('/reportes', authenticateToken, async (req, res) => {
  try {
    const { periodo, canal } = req.query;
    
    let query = 'SELECT * FROM reportes WHERE 1=1';
    const params = [];
    
    if (periodo) {
      params.push(periodo);
      query += ` AND periodo = $${params.length}`;
    }
    
    if (canal) {
      params.push(canal);
      query += ` AND canal = $${params.length}`;
    }
    
    query += ' ORDER BY fecha_del_reporte DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo reportes:', error);
    res.status(500).json({ error: 'Error obteniendo reportes' });
  }
});

export default router;
