import { useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, FileText, Mail } from 'lucide-react';
import apiService from '../services/api';
import '../styles/Dashboard.css';

function Dashboard({ aiResponse }) {
  const [sendingPDF, setSendingPDF] = useState(false);
  const [pdfStatus, setPdfStatus] = useState(null);

  // Colores del tema
  const COLORS = {
    primary: '#FA345E',
    success: '#10b981',
    warning: '#f59e0b',
    secondary: '#1B1B1B',
    light: '#94a3b8'
  };

  // Generar HTML del reporte para PDF (usando mismas clases que el dashboard)
  const generateReportHTML = () => {
    if (!aiResponse) return '';

    let html = '';
    
    // Resumen Ejecutivo
    if (aiResponse.resumen_ejecutivo) {
      html += `
        <div class="section">
          <h2>Resumen Ejecutivo</h2>
          <p class="summary-text">${aiResponse.resumen_ejecutivo}</p>
        </div>
      `;
    }

    // INDICADORES CLAVE YTD (usando metric-card como en el dashboard)
    if (aiResponse.indicadores_clave_ytd && aiResponse.indicadores_clave_ytd.length > 0) {
      html += '<div class="section"><h2>Indicadores Clave YTD</h2><div class="metrics-grid">';
      
      aiResponse.indicadores_clave_ytd.forEach(ind => {
        const isPositive = ind.estado_ytd === 'cumplido';
        const colorClass = isPositive ? 'success' : 'warning';
        html += `
          <div class="metric-card ${colorClass}">
            <div class="metric-header">
              <h3>${ind.indicador}</h3>
            </div>
            <div class="metric-value">${ind.real_ytd?.toLocaleString?.() || ind.real_ytd}</div>
            <div class="metric-meta">Meta: ${ind.meta_ytd?.toLocaleString?.() || ind.meta_ytd} (${ind.cumplimiento_ytd_pct}%)</div>
            <div class="metric-status ${colorClass}">${ind.estado_ytd}</div>
            ${ind.comentario ? `<p class="metric-comment">${ind.comentario}</p>` : ''}
          </div>
        `;
      });
      html += '</div></div>';
    }

    // ANÁLISIS POR CANAL
    if (aiResponse.analisis_por_canal) {
      html += '<div class="section"><h2>Análisis por Canal</h2>';
      
      // Canal más efectivo
      if (aiResponse.analisis_por_canal.canal_mas_efectivo && aiResponse.analisis_por_canal.canal_mas_efectivo.length > 0) {
        html += '<div class="subsection"><h3>Canal Más Efectivo</h3>';
        aiResponse.analisis_por_canal.canal_mas_efectivo.forEach(canal => {
          html += `
            <div class="insight-card success">
              <h4>${canal.canal}</h4>
              <p>${canal.comentario}</p>
            </div>
          `;
        });
        html += '</div>';
      }
      
      // Canal con oportunidad
      if (aiResponse.analisis_por_canal.canal_con_oportunidad && aiResponse.analisis_por_canal.canal_con_oportunidad.length > 0) {
        html += '<div class="subsection"><h3>Canal con Oportunidad de Mejora</h3>';
        aiResponse.analisis_por_canal.canal_con_oportunidad.forEach(canal => {
          html += `
            <div class="insight-card warning">
              <h4>${canal.canal}</h4>
              <p>${canal.comentario}</p>
            </div>
          `;
        });
        html += '</div>';
      }
      
      html += '</div>';
    }

    // ESTADO DEL FUNNEL MES ACTUAL
    if (aiResponse.estado_funnel_mes_actual && aiResponse.estado_funnel_mes_actual.length > 0) {
      html += '<div class="section"><h2>Estado del Funnel - Mes Actual</h2><div class="channel-grid">';
      aiResponse.estado_funnel_mes_actual.forEach(item => {
        html += `
          <div class="channel-card">
            <h4>${item.canal || item.etapa || 'Análisis'}</h4>
            <p>${item.comentario}</p>
          </div>
        `;
      });
      html += '</div></div>';
    }

    // MÉTRICAS DEL FUNNEL (tabla detallada)
    if (aiResponse.funnel) {
      html += '<div class="section"><h2>Métricas del Funnel</h2>';
      html += '<table><tr><th>Métrica</th><th>Mes Actual</th><th>YTD</th><th>Estado</th></tr>';
      
      ['leads', 'prospectos', 'clientes'].forEach(metric => {
        if (aiResponse.funnel[metric]) {
          const data = aiResponse.funnel[metric];
          html += `
            <tr>
              <td><strong>${metric.charAt(0).toUpperCase() + metric.slice(1)}</strong></td>
              <td>${data.real_mes_actual?.toLocaleString?.() || data.real_mes_actual} / ${data.meta_mes_actual?.toLocaleString?.() || data.meta_mes_actual} (${data.avance_mes_actual_porcentaje}%)</td>
              <td>${data.real_ytd?.toLocaleString?.() || data.real_ytd} / ${data.meta_ytd?.toLocaleString?.() || data.meta_ytd} (${data.avance_ytd_porcentaje}%)</td>
              <td class="status-${data.estado_ytd}">${data.estado_ytd}</td>
            </tr>
          `;
        }
      });
      html += '</table></div>';
    }

    // RECOMENDACIONES ESTRATÉGICAS
    if (aiResponse.recomendaciones_estrategicas && aiResponse.recomendaciones_estrategicas.length > 0) {
      html += '<div class="section"><h2>Recomendaciones Estratégicas</h2><ul class="insights-list primary">';
      aiResponse.recomendaciones_estrategicas.forEach(rec => {
        html += `<li>${rec}</li>`;
      });
      html += '</ul></div>';
    }

    // ALERTAS (backward compatibility)
    if (aiResponse.alertas && aiResponse.alertas.length > 0) {
      html += '<div class="section"><h2>Puntos de Mejora</h2><ul class="insights-list warning">';
      aiResponse.alertas.forEach(alerta => {
        html += `<li>${alerta}</li>`;
      });
      html += '</ul></div>';
    }

    // TENDENCIAS (backward compatibility)
    if (aiResponse.tendencias && aiResponse.tendencias.length > 0) {
      html += '<div class="section"><h2>Tendencias Clave</h2><ul class="insights-list success">';
      aiResponse.tendencias.forEach(tendencia => {
        html += `<li>${tendencia}</li>`;
      });
      html += '</ul></div>';
    }

    // OPORTUNIDADES (backward compatibility)
    if (aiResponse.oportunidades && aiResponse.oportunidades.length > 0) {
      html += '<div class="section"><h2>Oportunidades</h2><ul class="insights-list primary">';
      aiResponse.oportunidades.forEach(oportunidad => {
        html += `<li>${oportunidad}</li>`;
      });
      html += '</ul></div>';
    }

    return html;
  };

  const handleSendPDF = async () => {
    if (!aiResponse) {
      alert('No hay datos para generar el reporte');
      return;
    }

    setSendingPDF(true);
    setPdfStatus(null);

    try {
      const htmlContent = generateReportHTML();
      const result = await apiService.generatePDF(
        htmlContent,
        aiResponse.resumen_ejecutivo || 'Reporte ejecutivo'
      );

      setPdfStatus({
        type: 'success',
        message: `Reporte enviado a ${result.sentTo}`,
        link: result.driveLink
      });
    } catch (error) {
      setPdfStatus({
        type: 'error',
        message: error.response?.data?.error || 'Error al generar el reporte'
      });
    } finally {
      setSendingPDF(false);
    }
  };

  const renderMetricCard = (title, value, meta, percentage, status, comentario = null) => {
    const isPositive = status === 'cumplido';
    const Icon = isPositive ? CheckCircle : AlertCircle;
    const colorClass = isPositive ? 'success' : 'warning';

    return (
      <div className={`metric-card ${colorClass}`}>
        <div className="metric-header">
          <h3>{title}</h3>
          <Icon size={24} />
        </div>
        <div className="metric-value">{value?.toLocaleString?.() || value}</div>
        <div className="metric-meta">
          Meta: {meta?.toLocaleString?.() || meta} ({percentage}%)
        </div>
        <div className={`metric-status ${colorClass}`}>
          {status}
        </div>
        {comentario && (
          <p className="metric-comment">{comentario}</p>
        )}
      </div>
    );
  };

  // Función para extraer métricas automáticamente del JSON
  const extractMetrics = (data) => {
    const metrics = [];
    
    // 1. Array indicadores_clave_ytd (nueva estructura)
    if (data.indicadores_clave_ytd && Array.isArray(data.indicadores_clave_ytd)) {
      data.indicadores_clave_ytd.forEach(indicador => {
        metrics.push({
          title: indicador.indicador,
          value: indicador.real_ytd,
          meta: indicador.meta_ytd,
          percentage: indicador.cumplimiento_ytd_pct,
          status: indicador.estado_ytd || 'sin datos',
          period: 'YTD',
          comentario: indicador.comentario
        });
      });
    }
    
    // 2. Estructura plana (real_ytd, meta_ytd en raíz)
    if (data.real_ytd && typeof data.real_ytd === 'object') {
      const metricTypes = Object.keys(data.real_ytd);
      metricTypes.forEach(type => {
        if (data.real_ytd[type] && data.meta_ytd?.[type]) {
          metrics.push({
            title: type.charAt(0).toUpperCase() + type.slice(1),
            value: data.real_ytd[type],
            meta: data.meta_ytd[type],
            percentage: data.cumplimiento_ytd_pct?.[type] || '0',
            status: data.estado_ytd?.[type] || 'sin datos',
            period: 'YTD'
          });
        }
      });
    }
    
    // 3. Estructura anidada (funnel.leads.real_ytd)
    if (data.funnel && typeof data.funnel === 'object' && !Array.isArray(data.funnel)) {
      Object.keys(data.funnel).forEach(type => {
        const metric = data.funnel[type];
        if (metric && typeof metric === 'object' && metric.real_ytd) {
          metrics.push({
            title: type.charAt(0).toUpperCase() + type.slice(1),
            value: metric.real_ytd,
            meta: metric.meta_ytd,
            percentage: metric.cumplimiento_ytd_pct || metric.avance_ytd_porcentaje || '0',
            status: metric.estado_ytd || 'sin datos',
            period: 'YTD'
          });
        }
      });
    }

    // 4. Métricas del mes actual
    if (data.real_mes_actual && typeof data.real_mes_actual === 'object') {
      const metricTypes = Object.keys(data.real_mes_actual);
      metricTypes.forEach(type => {
        if (data.real_mes_actual[type] && data.meta_mes_actual?.[type]) {
          metrics.push({
            title: type.charAt(0).toUpperCase() + type.slice(1),
            value: data.real_mes_actual[type],
            meta: data.meta_mes_actual[type],
            percentage: data.avance_mes_actual?.[type] || '0',
            status: data.estado_mes_actual?.[type] || 'sin datos',
            period: 'Mes Actual'
          });
        }
      });
    }

    return metrics;
  };

  // Función para extraer información textual
  const extractTextFields = (data) => {
    const textFields = [];
    const excludeKeys = ['funnel', 'real_ytd', 'meta_ytd', 'cumplimiento_ytd_pct', 'estado_ytd', 
                        'real_mes_actual', 'meta_mes_actual', 'estado_mes_actual', 'avance_mes_actual',
                        'aspectos_clave', 'alertas', 'tendencias', 'oportunidades', 'hallazgos_clave', 
                        'oportunidades_estrategicas', 'indicadores_clave_ytd', 'analisis_por_canal',
                        'estado_funnel_mes_actual', 'recomendaciones_estrategicas', 'comentario'];
    
    Object.keys(data).forEach(key => {
      const value = data[key];
      // Solo campos de texto simple (string) que no sean arrays ni objetos
      if (typeof value === 'string' && !excludeKeys.includes(key)) {
        textFields.push({
          label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          value: value,
          key: key
        });
      }
    });

    return textFields;
  };

  if (!aiResponse) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-empty">
          <FileText size={64} color={COLORS.light} />
          <h2>Bienvenido al Dashboard AI</h2>
          <p>Realiza una consulta en el chat para ver los análisis y visualizaciones</p>
        </div>
      </div>
    );
  }

  // Extraer métricas y campos de texto automáticamente
  const metrics = extractMetrics(aiResponse);
  const textFields = extractTextFields(aiResponse);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard Ejecutivo</h1>
          <p>Análisis generado por IA</p>
        </div>
        
        {aiResponse && (
          <button 
            onClick={handleSendPDF} 
            disabled={sendingPDF}
            className="btn-pdf"
          >
            {sendingPDF ? (
              <>Generando PDF...</>
            ) : (
              <>
                <Mail size={20} />
                Enviar como PDF
              </>
            )}
          </button>
        )}
      </div>

      {pdfStatus && (
        <div className={`pdf-status ${pdfStatus.type}`}>
          {pdfStatus.type === 'success' ? (
            <>
              <CheckCircle size={20} />
              <span>{pdfStatus.message}</span>
              {pdfStatus.link && (
                <a href={pdfStatus.link} target="_blank" rel="noopener noreferrer">
                  Ver en Drive
                </a>
              )}
            </>
          ) : (
            <>
              <AlertCircle size={20} />
              <span>{pdfStatus.message}</span>
            </>
          )}
        </div>
      )}

      {/* Resumen Ejecutivo */}
      {aiResponse.resumen_ejecutivo && (
        <div className="section">
          <h2>Resumen Ejecutivo</h2>
          <p className="summary-text">{aiResponse.resumen_ejecutivo}</p>
        </div>
      )}

      {/* Métricas Anuales (YTD) */}
      {metrics.filter(m => m.period === 'YTD').length > 0 && (
        <div className="section">
          <h2>Indicadores Clave YTD</h2>
          <div className="metrics-grid">
            {metrics.filter(m => m.period === 'YTD').map((metric, index) => 
              renderMetricCard(
                metric.title,
                metric.value,
                metric.meta,
                metric.percentage,
                metric.status,
                metric.comentario
              )
            )}
          </div>
        </div>
      )}

      {/* Métricas Mensuales */}
      {metrics.filter(m => m.period === 'Mes Actual').length > 0 && (
        <div className="section">
          <h2>Métricas del Mes Actual</h2>
          <div className="metrics-grid smaller">
            {metrics.filter(m => m.period === 'Mes Actual').map((metric, index) => 
              renderMetricCard(
                metric.title,
                metric.value,
                metric.meta,
                metric.percentage,
                metric.status
              )
            )}
          </div>
        </div>
      )}

      {/* Aspectos Clave */}
      {aiResponse.aspectos_clave && aiResponse.aspectos_clave.length > 0 && (
        <div className="section">
          <h2>Aspectos Clave</h2>
          {aiResponse.aspectos_clave.map((aspecto, index) => {
            const isPositive = aspecto.tipo === 'Fortaleza' || aspecto.tipo === 'Consistencia';
            const Icon = isPositive ? CheckCircle : aspecto.tipo === 'Oportunidad' ? TrendingUp : AlertCircle;
            const colorClass = isPositive ? 'success' : aspecto.tipo === 'Oportunidad' ? 'primary' : 'warning';
            
            return (
              <div key={index} className={`insight-card ${colorClass}`}>
                <div className="insight-header">
                  <Icon size={20} />
                  <strong>{aspecto.tipo}</strong>
                </div>
                <p>{aspecto.descripcion}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Hallazgos Clave */}
      {aiResponse.hallazgos_clave && aiResponse.hallazgos_clave.length > 0 && (
        <div className="section">
          <h2>
            <CheckCircle size={24} color={COLORS.success} />
            Hallazgos Clave
          </h2>
          <ul className="insights-list success">
            {aiResponse.hallazgos_clave.map((hallazgo, index) => (
              <li key={index}>{hallazgo}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Análisis por Canal */}
      {aiResponse.analisis_por_canal && (
        <div className="section">
          <h2>Análisis por Canal</h2>
          {aiResponse.analisis_por_canal.canal_mas_efectivo && aiResponse.analisis_por_canal.canal_mas_efectivo.length > 0 && (
            <div className="subsection">
              <h3>
                <TrendingUp size={20} color={COLORS.success} />
                Canal Más Efectivo
              </h3>
              {aiResponse.analisis_por_canal.canal_mas_efectivo.map((item, index) => (
                <div key={index} className="insight-card success">
                  <h4>{item.canal}</h4>
                  <p>{item.comentario}</p>
                </div>
              ))}
            </div>
          )}
          {aiResponse.analisis_por_canal.canal_con_oportunidad && aiResponse.analisis_por_canal.canal_con_oportunidad.length > 0 && (
            <div className="subsection">
              <h3>
                <AlertCircle size={20} color={COLORS.warning} />
                Canal con Oportunidad de Mejora
              </h3>
              {aiResponse.analisis_por_canal.canal_con_oportunidad.map((item, index) => (
                <div key={index} className="insight-card warning">
                  <h4>{item.canal}</h4>
                  <p>{item.comentario}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Estado Funnel Mes Actual */}
      {aiResponse.estado_funnel_mes_actual && aiResponse.estado_funnel_mes_actual.length > 0 && (
        <div className="section">
          <h2>Estado del Funnel - Mes Actual</h2>
          <div className="channel-grid">
            {aiResponse.estado_funnel_mes_actual.map((canal, index) => (
              <div key={index} className="channel-card">
                <h4>{canal.canal}</h4>
                <p>{canal.comentario}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recomendaciones Estratégicas */}
      {aiResponse.recomendaciones_estrategicas && aiResponse.recomendaciones_estrategicas.length > 0 && (
        <div className="section">
          <h2>
            <TrendingUp size={24} color={COLORS.primary} />
            Recomendaciones Estratégicas
          </h2>
          <ul className="insights-list primary">
            {aiResponse.recomendaciones_estrategicas.map((recomendacion, index) => (
              <li key={index}>{recomendacion}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Oportunidades Estratégicas */}
      {aiResponse.oportunidades_estrategicas && aiResponse.oportunidades_estrategicas.length > 0 && (
        <div className="section">
          <h2>
            <TrendingUp size={24} color={COLORS.primary} />
            Oportunidades Estratégicas
          </h2>
          <ul className="insights-list primary">
            {aiResponse.oportunidades_estrategicas.map((oportunidad, index) => (
              <li key={index}>{oportunidad}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Alertas */}
      {aiResponse.alertas && aiResponse.alertas.length > 0 && (
        <div className="section">
          <h2>
            <AlertCircle size={24} color={COLORS.warning} />
            Puntos de Mejora
          </h2>
          <ul className="insights-list warning">
            {aiResponse.alertas.map((alerta, index) => (
              <li key={index}>{alerta}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tendencias */}
      {aiResponse.tendencias && aiResponse.tendencias.length > 0 && (
        <div className="section">
          <h2>
            <TrendingUp size={24} color={COLORS.success} />
            Tendencias Clave
          </h2>
          <ul className="insights-list success">
            {aiResponse.tendencias.map((tendencia, index) => (
              <li key={index}>{tendencia}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Oportunidades */}
      {aiResponse.oportunidades && aiResponse.oportunidades.length > 0 && (
        <div className="section">
          <h2>
            <TrendingUp size={24} color={COLORS.primary} />
            Oportunidades
          </h2>
          <ul className="insights-list primary">
            {aiResponse.oportunidades.map((oportunidad, index) => (
              <li key={index}>{oportunidad}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Riesgos */}
      {aiResponse.riesgos && aiResponse.riesgos.length > 0 && (
        <div className="section">
          <h2>
            <AlertCircle size={24} color={COLORS.warning} />
            Riesgos Identificados
          </h2>
          <ul className="insights-list warning">
            {aiResponse.riesgos.map((riesgo, index) => (
              <li key={index}>{riesgo}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Comentario Final */}
      {aiResponse.comentario && (
        <div className="section">
          <h2>Conclusión</h2>
          <p className="summary-text">{aiResponse.comentario}</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
