-- Schema para la Base de Datos PostgreSQL

-- Tabla de usuarios para autenticación
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de reportes ejecutivos (carga desde JSON)
CREATE TABLE IF NOT EXISTS reportes (
    id SERIAL PRIMARY KEY,
    fecha_del_reporte DATE NOT NULL,
    periodo VARCHAR(20) NOT NULL,
    canal VARCHAR(100) NOT NULL,
    leads_real INTEGER,
    leads_meta INTEGER,
    leads_avance_pct DECIMAL(10, 2),
    leads_estado VARCHAR(50),
    prospectos_real INTEGER,
    prospectos_meta INTEGER,
    prospectos_avance_pct DECIMAL(10, 2),
    prospectos_estado VARCHAR(50),
    cierres_real INTEGER,
    cierres_meta INTEGER,
    cierres_avance_pct DECIMAL(10, 2),
    cierres_estado VARCHAR(50),
    es_mes_actual BOOLEAN DEFAULT FALSE,
    dias_restantes INTEGER,
    leads_real_ytd INTEGER,
    leads_meta_ytd INTEGER,
    leads_cumplimiento_ytd_pct DECIMAL(10, 2),
    prospectos_real_ytd INTEGER,
    prospectos_meta_ytd INTEGER,
    prospectos_cumplimiento_ytd_pct DECIMAL(10, 2),
    cierres_real_ytd INTEGER,
    cierres_meta_ytd INTEGER,
    cierres_cumplimiento_ytd_pct DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_reportes_periodo ON reportes(periodo);
CREATE INDEX IF NOT EXISTS idx_reportes_canal ON reportes(canal);
CREATE INDEX IF NOT EXISTS idx_reportes_mes_actual ON reportes(es_mes_actual);
