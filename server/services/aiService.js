import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Genera una respuesta de IA basada en los datos del reporte nuevo (formato 2026)
 * Modelo: gemini-3.1-pro-preview (última generación, más potente y preciso)
 * 
 * @param {string} userQuestion - Pregunta del usuario
 * @param {object} reportData - Datos del reporte (estructura completa con métricas, canales, etc.)
 * @returns {object} Respuesta JSON con análisis del reporte
 */
export async function generateAIResponse(userQuestion, reportData) {
  try {
    const normalizedData = reportData?.report ? reportData.report : reportData;
    const compactReportContext = normalizedData?.resumen_macro
      ? {
          fecha_reporte: normalizedData.fecha_reporte,
          periodos: normalizedData.periodos,
          resumen_macro: normalizedData.resumen_macro,
          cumplimiento_por_canal: normalizedData.cumplimiento_por_canal,
          detalle_canales: normalizedData.detalle_canales,
          historico_mensual: normalizedData.historico_mensual,
          desglose_paises: normalizedData.desglose_paises,
          ads_y_social: normalizedData.ads_y_social
        }
      : normalizedData;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.1-pro-preview',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192
      }
    });

    // Prompt SIMPLIFICADO para evitar truncamiento de Gemini
    // Enviamos SOLO los datos necesarios, prompt muy conciso
    const months = {
      'enero': '01-2026', 'febrero': '02-2026', 'marzo': '03-2026', 'abril': '04-2026',
      'mayo': '05-2026', 'junio': '06-2026', 'julio': '07-2026', 'agosto': '08-2026',
      'septiembre': '09-2026', 'octubre': '10-2026', 'noviembre': '11-2026', 'diciembre': '12-2026'
    };
    
    let monthFilter = null;
    for (const [month, code] of Object.entries(months)) {
      if (userQuestion.toLowerCase().includes(month)) {
        monthFilter = code;
        break;
      }
    }
    
    // Filtrar datos solo del mes si aplica
    let contextToSend = normalizedData;
    if (monthFilter && normalizedData.historico_mensual) {
      const monthData = normalizedData.historico_mensual.filter(h => h.periodo === monthFilter);
      contextToSend = {
        fecha_reporte: normalizedData.fecha_reporte,
        periodo_solicitado: monthFilter,
        datos_mes: monthData,
        resumen_macro: normalizedData.resumen_macro,
        cumplimiento_por_canal: normalizedData.cumplimiento_por_canal
      };
    }

    const systemPrompt = `Eres analista de datos comerciales. Tu tarea: analizar desempeño 2026 de Apprecio.
Devuelve SOLO JSON valido, sin markdown ni texto extra.

DATOS:
${JSON.stringify(contextToSend, null, 2).substring(0, 3000)}

PREGUNTA: ${userQuestion}

RESPONDE ESTE JSON (todos los campos obligatorios):
{
  "fecha_reporte": "2026-05-08",
  "titulo": "Informe Ejecutivo - Desempeño Nuevos Clientes",
  "resumen_ejecutivo": "Resumen de 3-4 frases con hallazgos clave",
  "indicadores_clave_ytd": [
    {"indicador": "Leads", "real": 0, "meta": 0, "cumplimiento_pct": 0, "estado": "cumplido"}
  ],
  "analisis_por_canal": {
    "canal_mas_efectivo": [{"canal": "nombre", "comentario": "por qué"}],
    "canal_con_oportunidad": [{"canal": "nombre", "comentario": "brecha"}]
  },
  "analisis_por_pais": {"pais_lider": "pais", "comentario": "análisis"},
  "estado_funnel_mes_actual": [{"canal": "nombre", "estado": "descripción"}],
  "recomendaciones_estrategicas": ["acción 1", "acción 2"]
}`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    // Intentar extraer y parsear JSON
    let jsonResponse;
    try {
      // Remover posibles marcadores de markdown
      let cleanText = text.trim();
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Buscar objeto JSON en el texto
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } else {
        // Intentar parsear directamente
        jsonResponse = JSON.parse(cleanText);
      }
      
      console.log('✅ JSON parseado correctamente con Gemini 3.1 Pro');
    } catch (parseError) {
      console.error('❌ Error parseando JSON:', parseError.message);
      console.log('Texto recibido (primeros 200 caracteres):', text.substring(0, 200));

      // Reintento: pedir al modelo que normalice la salida a JSON estricto
      try {
        const repairPrompt = `Tu respuesta anterior salio truncada. Regenera DESDE CERO un JSON valido y completo, sin markdown, usando esta pregunta y estos datos.

      Pregunta: ${userQuestion}

      Datos:
      ${JSON.stringify(compactReportContext, null, 2)}

      Devuelve SOLO JSON valido con campos: fecha_reporte, titulo, resumen_ejecutivo, indicadores_clave_ytd, analisis_por_canal, analisis_por_pais, estado_funnel_mes_actual, recomendaciones_estrategicas.`;
        const repairResult = await model.generateContent(repairPrompt);
        const repairedText = (await repairResult.response).text().trim();
        const repairedClean = repairedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const repairedMatch = repairedClean.match(/\{[\s\S]*\}/);

        if (repairedMatch) {
          jsonResponse = JSON.parse(repairedMatch[0]);
          console.log('✅ JSON recuperado en segundo intento');
          return jsonResponse;
        }
      } catch (repairError) {
        console.error('❌ Error en segundo intento de parseo:', repairError.message);
      }

      // Si no se pudo recuperar, devolver un objeto compatible con el dashboard
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      jsonResponse = {
        fecha_reporte: new Date().toISOString().split('T')[0],
        titulo: 'Informe Ejecutivo - Respuesta parcialmente estructurada',
        resumen_ejecutivo: cleanedText || 'No fue posible estructurar la respuesta de IA en JSON válido.',
        indicadores_clave_ytd: [],
        analisis_por_canal: {
          canal_mas_efectivo: [],
          canal_con_oportunidad: []
        },
        analisis_por_pais: {
          pais_lider: null,
          comentario: 'No disponible por formato de respuesta no estructurado.'
        },
        estado_funnel_mes_actual: [],
        recomendaciones_estrategicas: [
          'Reintentar la consulta con una pregunta mas especifica por periodo o canal.',
          'Validar que el modelo responda en JSON completo para habilitar todos los widgets.'
        ],
        error: 'La IA no devolvió JSON válido'
      };
    }

    return jsonResponse;
  } catch (error) {
    console.error('❌ Error al generar respuesta de IA:', error);
    throw error;
  }
}
