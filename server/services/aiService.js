import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const OPERATIONAL_CHANNELS = [
  'Inbound',
  'Outbound',
  'Ferias/Eventos',
  'Hunting',
  'Cross Selling',
  'Cross Border Selling'
];

const COUNTRY_ALIASES = {
  colombia: 'Colombia',
  chile: 'Chile',
  mexico: 'México',
  mexicoo: 'México',
  peru: 'Perú',
  ecuador: 'Ecuador'
};

function detectFilters(question) {
  const q = (question || '').toLowerCase();
  const months = {
    enero: '01-2026',
    febrero: '02-2026',
    marzo: '03-2026',
    abril: '04-2026',
    mayo: '05-2026',
    junio: '06-2026',
    julio: '07-2026',
    agosto: '08-2026',
    septiembre: '09-2026',
    octubre: '10-2026',
    noviembre: '11-2026',
    diciembre: '12-2026'
  };

  let monthFilter = null;
  for (const [month, code] of Object.entries(months)) {
    if (q.includes(month)) {
      monthFilter = code;
      break;
    }
  }

  let quarterFilter = null;
  if (/(q1|t1|primer trimestre|1er trimestre)/.test(q)) quarterFilter = ['01-2026', '02-2026', '03-2026'];
  if (/(q2|t2|segundo trimestre|2do trimestre)/.test(q)) quarterFilter = ['04-2026', '05-2026', '06-2026'];
  if (/(q3|t3|tercer trimestre|3er trimestre)/.test(q)) quarterFilter = ['07-2026', '08-2026', '09-2026'];
  if (/(q4|t4|cuarto trimestre|4to trimestre)/.test(q)) quarterFilter = ['10-2026', '11-2026', '12-2026'];

  let countryFilter = null;
  for (const [alias, country] of Object.entries(COUNTRY_ALIASES)) {
    if (q.includes(alias)) {
      countryFilter = country;
      break;
    }
  }

  return { monthFilter, quarterFilter, countryFilter };
}

function normalizeAIResponseShape(rawResponse) {
  const safe = rawResponse || {};
  const indicators = Array.isArray(safe.indicadores_clave_ytd)
    ? safe.indicadores_clave_ytd.map((item) => ({
        indicador: item.indicador || 'Indicador',
        real_ytd: item.real_ytd ?? item.real ?? null,
        meta_ytd: item.meta_ytd ?? item.meta ?? null,
        cumplimiento_ytd_pct: item.cumplimiento_ytd_pct ?? item.cumplimiento_pct ?? null,
        estado_ytd: item.estado_ytd ?? item.estado ?? 'sin datos',
        comentario: item.comentario || null
      }))
    : [];

  const normalized = {
    fecha_reporte: safe.fecha_reporte || new Date().toISOString().split('T')[0],
    titulo: safe.titulo || 'Informe Ejecutivo - Desempeño Comercial',
    resumen_ejecutivo: safe.resumen_ejecutivo || '',
    indicadores_clave_ytd: indicators,
    analisis_por_canal: {
      canal_mas_efectivo: Array.isArray(safe.analisis_por_canal?.canal_mas_efectivo)
        ? safe.analisis_por_canal.canal_mas_efectivo
        : [],
      canal_con_oportunidad: Array.isArray(safe.analisis_por_canal?.canal_con_oportunidad)
        ? safe.analisis_por_canal.canal_con_oportunidad
        : []
    },
    analisis_por_pais: {
      pais_lider: safe.analisis_por_pais?.pais_lider || null,
      comentario: safe.analisis_por_pais?.comentario || ''
    },
    estado_funnel_mes_actual: Array.isArray(safe.estado_funnel_mes_actual)
      ? safe.estado_funnel_mes_actual.map((f) => ({
          canal: f.canal || 'Canal',
          comentario: f.comentario || f.estado || ''
        }))
      : [],
    recomendaciones_estrategicas: Array.isArray(safe.recomendaciones_estrategicas)
      ? safe.recomendaciones_estrategicas
      : [],
    comentario: safe.comentario || safe.resumen_ejecutivo || null
  };

  return normalized;
}

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

    const { monthFilter, quarterFilter, countryFilter } = detectFilters(userQuestion);
    
    // Construir contexto compacto y estable (sin recortar JSON a mitad)
    const periodsToUse = monthFilter
      ? [monthFilter]
      : (quarterFilter || []);

    const monthData = Array.isArray(normalizedData.historico_mensual)
      ? (periodsToUse.length > 0
          ? normalizedData.historico_mensual.filter((h) => periodsToUse.includes(h.periodo))
          : normalizedData.historico_mensual)
      : [];

    const channelsFromMonthly = Array.from(
      new Set(monthData.map((r) => r.canal).filter(Boolean))
    );

    const monthlyTotals = monthData.reduce((acc, row) => {
      const canal = row.canal || '';
      const isOtros = canal.toLowerCase() === 'otros';
      if (!isOtros) {
        acc.leads_operativos += Number(row.leads_real || 0);
        acc.oportunidades_operativas += Number(row.oportunidades_real || 0);
      }
      acc.leads_totales += Number(row.leads_real || 0);
      acc.oportunidades_totales += Number(row.oportunidades_real || 0);
      acc.cierres += Number(row.cierres_real || 0);
      acc.monto_usd += Number(row.monto_usd || 0);
      return acc;
    }, {
      leads_operativos: 0,
      oportunidades_operativas: 0,
      leads_totales: 0,
      oportunidades_totales: 0,
      cierres: 0,
      monto_usd: 0
    });

    const byChannel = monthData.reduce((acc, row) => {
      const canal = row.canal || 'Sin canal';
      if (!acc[canal]) {
        acc[canal] = { canal, leads: 0, oportunidades: 0, cierres: 0, monto_usd: 0 };
      }
      acc[canal].leads += Number(row.leads_real || 0);
      acc[canal].oportunidades += Number(row.oportunidades_real || 0);
      acc[canal].cierres += Number(row.cierres_real || 0);
      acc[canal].monto_usd += Number(row.monto_usd || 0);
      return acc;
    }, {});

    const operationalRank = Object.values(byChannel)
      .filter((c) => OPERATIONAL_CHANNELS.includes(c.canal))
      .sort((a, b) => (b.leads + b.oportunidades + b.cierres) - (a.leads + a.oportunidades + a.cierres));

    const countrySummaryRaw = Array.isArray(normalizedData.desglose_paises)
      ? normalizedData.desglose_paises.map((p) => ({
          pais: p.pais,
          leads_mes: p.leads_mes,
          opp_mes: p.opp_mes,
          cierres_mes: p.cierres_mes,
          cierres_ytd: p.cierres_ytd,
          monto_mes: p.monto_mes,
          monto_ytd: p.monto_ytd
        }))
      : [];

    const countrySummary = countryFilter
      ? countrySummaryRaw.filter((p) => p.pais === countryFilter)
      : countrySummaryRaw;

    const contextToSend = {
      fecha_reporte: normalizedData.fecha_reporte,
      pregunta: userQuestion,
      periodo_solicitado: monthFilter,
      quarter_solicitado: quarterFilter,
      pais_solicitado: countryFilter,
      resumen_macro: normalizedData.resumen_macro,
      cumplimiento_por_canal: normalizedData.cumplimiento_por_canal,
      historico_mes_solicitado: monthData,
      totales_filtrados: periodsToUse.length > 0 ? monthlyTotals : null,
      canales_mes_solicitado: monthFilter ? channelsFromMonthly : [],
      ranking_canales_operativos: operationalRank,
      canales_operativos_prioritarios: ['Inbound', 'Outbound', 'Ferias/Eventos'],
      desglose_paises: countrySummary,
      nota_categoria_otros: 'El canal "Otros" es una categoria agrupada de multiples fuentes y no debe confundirse con un canal operativo unico.',
      regla_negocio_clave: 'No considerar Otros para definir relevancia en leads y oportunidades. Considerar Otros solo para cierres/monto final.'
    };

    const systemPrompt = `Eres analista de datos comerciales B2B.
Devuelve SOLO JSON valido, sin markdown ni texto extra.

REGLAS CLAVE:
- Usa EXCLUSIVAMENTE los datos entregados.
- Si la pregunta menciona un mes o trimestre, prioriza historico_mes_solicitado.
- Trata "Otros" como categoria agrupada. No asumas que es un canal operativo unico.
- Para LEADS y OPORTUNIDADES, excluye "Otros" del ranking de canales relevantes.
- Para CIERRES e INGRESOS, puedes incluir "Otros" en el conteo final, aclarando que es agrupado.
- Canales operativos prioritarios para análisis comparativo: Inbound, Outbound y Ferias/Eventos.
- Si "Otros" concentra resultados, indicalo y adicionalmente destaca 1 canal operativo (por ejemplo Inbound/Outbound/Hunting/Cross Selling/Cross Border Selling/Ferias/Eventos) como referencia comparativa.
- Si hay desglose_paises, NO digas que no existe informacion por pais.

DATOS:
${JSON.stringify(contextToSend, null, 2)}

PREGUNTA: ${userQuestion}

RESPONDE ESTE JSON (todos los campos obligatorios):
{
  "fecha_reporte": "2026-05-08",
  "titulo": "Informe Ejecutivo - Desempeño Nuevos Clientes",
  "resumen_ejecutivo": "Resumen de 3-4 frases con hallazgos clave",
  "indicadores_clave_ytd": [
    {"indicador": "Leads", "real_ytd": 0, "meta_ytd": 0, "cumplimiento_ytd_pct": 0, "estado_ytd": "cumplido", "comentario": "..."}
  ],
  "analisis_por_canal": {
    "canal_mas_efectivo": [{"canal": "nombre", "comentario": "por qué"}],
    "canal_con_oportunidad": [{"canal": "nombre", "comentario": "brecha"}]
  },
  "analisis_por_pais": {"pais_lider": "pais", "comentario": "análisis"},
  "estado_funnel_mes_actual": [{"canal": "nombre", "comentario": "descripción"}],
  "recomendaciones_estrategicas": ["acción 1", "acción 2"],
  "comentario": "conclusion breve"
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
      
      jsonResponse = normalizeAIResponseShape(jsonResponse);
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
          jsonResponse = normalizeAIResponseShape(JSON.parse(repairedMatch[0]));
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
        comentario: cleanedText || 'No fue posible estructurar la respuesta de IA en JSON válido.',
        error: 'La IA no devolvió JSON válido'
      };
    }

    return jsonResponse;
  } catch (error) {
    console.error('❌ Error al generar respuesta de IA:', error);
    throw error;
  }
}
