import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function generateAIResponse(userQuestion, reportData) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7
      }
    });

    // Construir el prompt basado en prompt-example.md
    const systemPrompt = `Eres un **Analista de Datos Senior** y **Especialista en unidades de negocio B2B SaaS**. Tu objetivo es generar un **Informe Ejecutivo** basado en los datos proporcionados.

**IMPORTANTE: Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones.**

**DIRECTRICES DE ANÁLISIS Y TONO:**
1.  **Concreción (Texto):** Los textos (resumen_ejecutivo, comentario, y elementos de las listas) deben ser **breves y directos**. Limita cada elemento de lista a **1-2 frases** y el resumen ejecutivo a **4-5 frases** en total.
2.  **Tono:** **Neutral, profesional y orientado a la acción.** Evita el pesimismo o el alarmismo. Los puntos de mejora se presentan como **Oportunidades** o **Desafíos Estratégicos**.
3.  **Estructura del Funnel:** La sección "funnel" **DEBE replicar exactamente la estructura del JSON de entrada** y mantener todos los campos numéricos y de estado (real_mes_actual, estado_ytd, etc.) sin modificarlos.

PREGUNTA DEL USUARIO: "${userQuestion}"

DATOS DISPONIBLES:
${JSON.stringify(reportData, null, 2)}

RESPONDE SOLO CON UN OBJETO JSON VÁLIDO siguiendo esta estructura:
{
  "fecha_reporte": "YYYY-MM-DD",
  "titulo": "Título del informe",
  "resumen_ejecutivo": "Resumen breve del análisis",
  "indicadores_clave_ytd": [
    {
      "indicador": "Leads",
      "real_ytd": 0,
      "meta_ytd": 0,
      "cumplimiento_ytd_pct": 0,
      "estado_ytd": "cumplido o alerta",
      "comentario": "Análisis breve"
    }
  ],
  "analisis_por_canal": {
    "canal_mas_efectivo": [{"canal": "nombre", "comentario": "texto"}],
    "canal_con_oportunidad": [{"canal": "nombre", "comentario": "texto"}]
  },
  "estado_funnel_mes_actual": [
    {"canal": "nombre", "comentario": "descripción de métricas"}
  ],
  "recomendaciones_estrategicas": ["recomendación 1", "recomendación 2"]
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
      
      console.log('✅ JSON parseado correctamente');
    } catch (parseError) {
      console.error('❌ Error parseando JSON:', parseError.message);
      console.log('Texto recibido:', text.substring(0, 200));
      
      // Si no es JSON válido, devolver como texto plano
      jsonResponse = {
        type: 'text',
        content: text,
        error: 'La IA no devolvió JSON válido'
      };
    }

    return jsonResponse;
  } catch (error) {
    console.error('Error al generar respuesta de IA:', error);
    throw error;
  }
}
