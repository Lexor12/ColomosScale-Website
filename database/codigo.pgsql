DROP TABLE "Reporte" CASCADE;
DROP TABLE "Balanza" CASCADE;
DROP TABLE "Usuario" CASCADE;
DROP TABLE "Laboratorio" CASCADE;
DROP TABLE "Rol" CASCADE;
-- Tipo ENUM
--CREATE TYPE estado_equipo AS ENUM ('ADECUADA', 'INTERMEDIA', 'MALA');

-- Tabla Rol (Aquí no lleva serial pq los IDs son fijos: 1, 2, 3, 4)
CREATE TABLE "Rol" (
  "id_rol" INT PRIMARY KEY,
  "nombre" VARCHAR
);

-- Tabla Usuario
CREATE TABLE "Usuario" (
  "id_usuario" SERIAL PRIMARY KEY, -- Auto-incremental
  "username" VARCHAR(60) NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "correo" VARCHAR(255) NOT NULL UNIQUE,
  "fecha_creacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "img_url" TEXT,
  "rol" INT REFERENCES "Rol"("id_rol")
);

-- Tabla Laboratorio
CREATE TABLE "Laboratorio" (
  "id_laboratorio" SERIAL PRIMARY KEY, -- Auto-incremental
  "nombre" VARCHAR NOT NULL,
  "ubicacion" TEXT
);

-- Tabla Balanza
CREATE TABLE "Balanza" (
  "id_balanza" SERIAL PRIMARY KEY, -- Auto-incremental
  "id_laboratorio" INT REFERENCES "Laboratorio"("id_laboratorio"),
  "nombre" VARCHAR NOT NULL,
  "marca" VARCHAR NOT NULL,
  "modelo" TEXT NOT NULL,
  "serie" VARCHAR NOT NULL,
  "img_url" TEXT NOT NULL,
  "estado_calibracion" estado_equipo NOT NULL,
  "ultima_medicion" TIMESTAMPTZ NOT NULL
);

-- Tabla Reporte
CREATE TABLE "Reporte" (
  "id_reporte" SERIAL PRIMARY KEY, -- Auto-incremental
  "id_usuario" INT REFERENCES "Usuario"("id_usuario"),
  "id_balanza" INT REFERENCES "Balanza"("id_balanza"),
  "fecha_analisis" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "excentricidad_promedio" NUMERIC(12, 8),
  "repetibilidad_50" NUMERIC(12, 8),
  "repetibilidad_100" NUMERIC(12, 8),
  "linealidad_promedio" NUMERIC(12, 8),
  "cumple_emt" BOOL,
  "observaciones" TEXT,
  "estado_final" estado_equipo 
);
INSERT INTO "Rol" VALUES (1, 'ADMIN'),(2, 'SUPERVISOR'),(3, 'TECNICO');