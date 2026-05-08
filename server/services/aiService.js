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
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    });

    // Construir el prompt basado en prompt-example.md y el nuevo formato JSON 2026
    const systemPrompt = `Eres un **Analista de Datos Senior** y **Especialista en unidades de negocio B2B SaaS**. Tu objetivo es generar un **Informe Ejecutivo** basado en los datos de reporte de performance proporcionados.

**IMPORTANTE: Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones.**

**MODELO DE IA: Gemini 2.5 Flash** - Última generación optimizada para análisis rápido y preciso.

**DIRECTRICES DE ANÁLISIS Y TONO:**
1.  **Concreción (Texto):** Los textos (resumen_ejecutivo, comentario, y elementos de las listas) deben ser **breves y directos**. Limita cada elemento de lista a **1-2 frases** y el resumen ejecutivo a **4-5 frases** en total.
2.  **Tono:** **Neutral, profesional y orientado a la acción.** Evita el pesimismo o el alarmismo. Los puntos de mejora se presentan como **Oportunidades** o **Desafíos Estratégicos**.
3.  **Datos Disponibles:** Estructura completa del reporte con canales, fuentes, geografía, performance de ads y redes sociales.

PREGUNTA DEL USUARIO: "${userQuestion}"

DATOS DISPONIBLES (Formato 2026):
${JSON.stringify(reportData, null, 2)}

RESPONDE SOLO CON UN OBJETO JSON VÁLIDO siguiendo esta estructura:
{
  "fecha_reporte": "YYYY-MM-DD",
  "titulo": "Título del informe",
  "resumen_ejecutivo": "Resumen breve del análisis (4-5 frases máx)",
  "indicadores_clave_ytd": [
    {
      "indicador": "Leads",
      "real_ytd": 0,
      "meta_ytd": 0,
      "cumplimiento_ytd_pct": 0,
      "estado_ytd": "cumplido | alerta | crítico",
      "comentario": "Análisis breve (1-2 frases)"
    }
  ],
  "analisis_por_canal": {
    "canal_mas_efectivo": [{"canal": "nombre", "comentario": "texto breve"}],
    "canal_con_oportunidad": [{"canal": "nombre", "comentario": "texto breve"}]
  },
  "analisis_por_pais": {
    "pais_lider": "país con mejor desempeño",
    "comentario": "análisis breve de la geografía"
  },
  "recomendaciones_estrategicas": [
    "recomendación 1 (1-2 frases)",
    "recomendación 2 (1-2 frases)"
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
      
      // Si no es JSON válido, devolver como texto plano
      jsonResponse = {
        type: 'text',
        content: text,
        error: 'La IA no devolvió JSON válido'
      };
    }

    return jsonResponse;
  } catch (error) {
    console.error('❌ Error al generar respuesta de IA:', error);
    throw error;
  }
}
