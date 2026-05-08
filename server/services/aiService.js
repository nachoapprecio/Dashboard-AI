import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Genera una respuesta de IA basada en los datos del reporte nuevo (formato 2026)
 * Modelo: gemini-2.5-flash (última generación de Gemini)
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
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    });

    // Prompt alineado con la estructura real del JSON 2026 de HubSpot
    const systemPrompt = `Eres un Analista Senior de Growth B2B SaaS para Apprecio.

Tu tarea es analizar desempeno comercial de NUEVOS CLIENTES del anio 2026 usando el JSON entregado.

IMPORTANTE:
- Responde SOLO con JSON valido (sin markdown, sin texto extra).
- No inventes datos.
- Si un dato no existe, usa null y explica brevemente en comentario.
- Tono: ejecutivo, claro, accionable, no alarmista.

PREGUNTA DEL USUARIO:
"${userQuestion}"

ESTRUCTURA REAL DE DATOS (usa estos campos exactos):
- fecha de corte: fecha_reporte
- periodos y etiquetas: periodos.monthLabel, periodos.yearLabel
- resumen mensual: resumen_macro.mes
  - leads, oportunidades, clientes, costo_total, cpl, costo_reunion, cac, conv_lead_opp, conv_opp_cliente
- resumen acumulado anio: resumen_macro.ytd_cerrado
  - mismas metricas que resumen_macro.mes
- desempeno por canal: cumplimiento_por_canal[]
  - canal
  - mes: leads_real, leads_meta, leads_cumplimiento_pct, oportunidades_real, oportunidades_meta, oportunidades_cumplimiento_pct, cierres_real, cierres_meta, cierres_cumplimiento_pct
  - ytd: mismas metricas
  - eficiencia: cpl_mes, cpl_ytd, costo_reunion_mes, costo_reunion_ytd, cac_mes, cac_ytd
- detalle por canal agregado: detalle_canales[canal]
- historico mensual para consultas por mes especifico: historico_mensual[]
  - periodo (formato MM-YYYY), canal, leads_real, oportunidades_real, cierres_real, monto_usd
- geografia: desglose_paises[]
  - pais, leads_mes, leads_ytd, opp_mes, opp_ytd, cierres_mes, cierres_ytd, monto_mes, monto_ytd
- marketing y trafico: ads_y_social (ads, rrss, sesiones)

REGLAS DE ANALISIS:
1) Si la pregunta menciona un mes (ej. "enero"), filtra historico_mensual por ese mes en formato MM-2026 (enero=01-2026, febrero=02-2026, etc.) y agrega resultados por canal y total.
2) Para anio o acumulado, usa resumen_macro.ytd_cerrado y cumplimiento_por_canal[].ytd.
3) Para mes actual, usa resumen_macro.mes y cumplimiento_por_canal[].mes.
4) Interpreta "nuevos clientes" como cierres/clientes (cierres_real o clientes segun seccion).
5) Destaca canal mas efectivo y canal con oportunidad usando cumplimiento y eficiencia (cierres, conversion y CAC/CPL).
6) Si no hay datos del mes solicitado, dilo explicitamente y entrega contexto util con YTD y ultimo mes disponible.

DATOS DISPONIBLES:
${JSON.stringify(compactReportContext, null, 2)}

FORMATO DE SALIDA (obligatorio):
{
  "fecha_reporte": "YYYY-MM-DD",
  "titulo": "Informe Ejecutivo - enfoque en nuevos clientes 2026",
  "resumen_ejecutivo": "4-5 frases maximo con hallazgos clave segun la pregunta",
  "indicadores_clave_ytd": [
    {
      "indicador": "Leads|Oportunidades|Clientes",
      "real_ytd": 0,
      "meta_ytd": 0,
      "cumplimiento_ytd_pct": 0,
      "estado_ytd": "cumplido|alerta|critico",
      "comentario": "1-2 frases con interpretacion de negocio"
    }
  ],
  "analisis_por_canal": {
    "canal_mas_efectivo": [
      {"canal": "nombre", "comentario": "motivo con datos"}
    ],
    "canal_con_oportunidad": [
      {"canal": "nombre", "comentario": "brecha y accion sugerida"}
    ]
  },
  "analisis_por_pais": {
    "pais_lider": "pais o null",
    "comentario": "analisis breve de geografia comercial"
  },
  "estado_funnel_mes_actual": [
    {"canal": "nombre", "comentario": "estado de leads->oportunidades->cierres"}
  ],
  "recomendaciones_estrategicas": [
    "accion prioritaria 1",
    "accion prioritaria 2"
  ]
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
      
      console.log('✅ JSON parseado correctamente con Gemini 2.5 Flash');
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
