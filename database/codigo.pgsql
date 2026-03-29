DROP TABLE IF EXISTS "Reporte" CASCADE;
DROP TABLE IF EXISTS "Balanza" CASCADE;
DROP TABLE IF EXISTS "Usuario" CASCADE;
DROP TABLE IF EXISTS "Laboratorio" CASCADE;
DROP TABLE IF EXISTS "Rol" CASCADE;
DROP TYPE IF EXISTS estado_equipo;

CREATE TYPE estado_equipo AS ENUM ('ADECUADA', 'INTERMEDIA', 'MALA');

-- Tabla Rol (Aquí no lleva serial pq los IDs son fijos: 1, 2, 3, 4)
CREATE TABLE "Rol" (
  "id_rol" INT PRIMARY KEY,
  "nombre" VARCHAR
);

-- Tabla "Usuario"
CREATE TABLE "Usuario" (
  "id_usuario" SERIAL PRIMARY KEY, -- Auto-incremental
  "username" TEXT NOT NULL UNIQUE,
  "nombre_completo" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "correo" TEXT NOT NULL UNIQUE,
  "fecha_creacion" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "rol" INT REFERENCES "Rol"("id_rol")
);

-- Tabla Laboratorio
CREATE TABLE "Laboratorio" (
  "id_laboratorio" SERIAL PRIMARY KEY, -- Auto-incremental
  "nombre" TEXT NOT NULL,
  "ubicacion" TEXT
);

-- Tabla "Balanza"
CREATE TABLE "Balanza" (
  "id_balanza" SERIAL PRIMARY KEY, -- Auto-incremental
  "id_laboratorio" INT REFERENCES "Laboratorio"("id_laboratorio"),
  "nombre" TEXT NOT NULL,
  "marca" TEXT NOT NULL,
  "modelo" TEXT NOT NULL,
  "serie" TEXT NOT NULL,
  "img_url" TEXT NOT NULL,
  "codigo" TEXT NOT NULL UNIQUE,
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

--------- FUNCIONES Y PROCEDURES
----------------------- "Usuario"S ---------------------------
-- INSERTA UN USUSARIO EN LA BASE DE DATOS
CREATE OR REPLACE FUNCTION registrar_usuario(p_username TEXT,p_nombre_completo TEXT, p_correo TEXT,p_password TEXT,p_rol INT) RETURNS TEXT AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Usuario" WHERE correo = p_correo OR username =p_username) THEN
    RETURN 'El correo y/o el username ya existe';
  END IF;
  --Caso contrario el else
  INSERT INTO "Usuario"(username,nombre_completo,correo,password,fecha_creacion,rol) VALUES(p_username,p_nombre_completo,p_correo,p_password,NOW(),p_rol);
  RETURN 'Usuario registrado correctamente.';
END;
$$ LANGUAGE plpgsql;
-- REGRESA TODOS LOS CAMPOS INCLUYENDO LA CONTRASEÑA PARA REALIZAR EL ANALISIS EN NODE
-- Función corregida por CORREO
CREATE OR REPLACE FUNCTION obtener_usuarios_por_correo(p_correo TEXT)  
RETURNS TABLE(username TEXT, nombre_completo TEXT, correo TEXT, password TEXT, fecha_creacion TIMESTAMPTZ, rol INT) AS $$BEGIN
  RETURN QUERY 
  SELECT u.username, u.nombre_completo, u.correo, u.password, u.fecha_creacion, u.rol 
  FROM "Usuario" AS u 
  WHERE u.correo = p_correo;
END;$$ LANGUAGE plpgsql;

-- Función corregida por USERNAME
CREATE OR REPLACE FUNCTION obtener_usuarios_por_username(p_username TEXT)  
RETURNS TABLE(username TEXT, nombre_completo TEXT, correo TEXT, password TEXT, fecha_creacion TIMESTAMPTZ, rol INT) AS $$BEGIN
  RETURN QUERY 
  SELECT u.username, u.nombre_completo, u.correo, u.password, u.fecha_creacion, u.rol 
  FROM "Usuario" AS u 
  WHERE u.username = p_username;
END;$$ LANGUAGE plpgsql;
-- OBTIENE TODOS LOS "Usuario"S CON SUS ROLES (nombre del rol)
CREATE OR REPLACE FUNCTION obtener_usuarios() 
RETURNS TABLE (username TEXT, nombre_completo TEXT, correo TEXT, fecha_creacion TIMESTAMPTZ, rol_nombre TEXT) AS $$BEGIN
  RETURN QUERY 
  SELECT u."username", u."nombre_completo", u."correo", u."fecha_creacion", r."nombre"::TEXT 
  FROM "Usuario" AS u 
  JOIN "Rol" AS r ON r."id_rol" = u."rol";
END;$$ LANGUAGE plpgsql;
--ACTUALIZAR LOS DATOS DE USUSARIO

CREATE OR REPLACE FUNCTION actualizar_usuario(
  p_id INT,
  p_username TEXT DEFAULT NULL,
  p_nombre_completo TEXT DEFAULT NULL,
  p_correo TEXT DEFAULT NULL,
  p_password TEXT DEFAULT NULL,
  p_rol INT DEFAULT NULL
) RETURNS TEXT AS $$BEGIN
  UPDATE "Usuario"
  SET
    username = COALESCE(p_username, username),
    nombre_completo = COALESCE(p_nombre_completo, nombre_completo),
    correo = COALESCE(p_correo, correo),
    password = COALESCE(p_password, password),
    rol = COALESCE(p_rol, rol)
  WHERE id_usuario = p_id; 

  IF NOT FOUND THEN RETURN 'Usuario no encontrado'; END IF;
  RETURN 'Usuario actualizado';
END;$$ LANGUAGE plpgsql;

-- Eliminar "Usuario"
CREATE OR REPLACE  FUNCTION eliminar_usuario(p_id INT) RETURNS TEXT AS $$
BEGIN
  IF(SELECT 1 FROM "Usuario" WHERE id_usuario=p_id)THEN
    DELETE FROM "Usuario" WHERE id_usuario=p_id;
    RETURN 'Usuario elimnado correctamente.';
  END IF;
  RETURN 'Usuario no encontrado.';
END;
$$ LANGUAGE plpgsql;

----------------------- "Balanza"S ---------------------------

-- CREAR O AGREGAR UNA "Balanza"

CREATE OR REPLACE FUNCTION registrar_balanza(p_nombre TEXT, p_marca TEXT, p_modelo TEXT, p_serie TEXT, p_img_url TEXT, p_id_laboratorio INT,p_codigo TEXT) RETURNS TEXT AS $$
BEGIN 
  INSERT INTO "Balanza"(nombre,marca,modelo,serie,img_url,estado_calibracion,ultima_medicion,id_laboratorio,codigo) VALUES (p_nombre, p_marca, p_modelo, p_serie, p_img_url,'MALA',NOW(), p_id_laboratorio,p_codigo);
  RETURN 'Balanza registrada correctamente.';
END;
$$ LANGUAGE plpgsql;
-- ACTUALIZAR "Balanza"
CREATE OR REPLACE FUNCTION actualizar_balanza(
  p_id INT,
  p_nombre TEXT DEFAULT NULL, 
  p_marca TEXT DEFAULT NULL, 
  p_modelo TEXT DEFAULT NULL, 
  p_serie TEXT DEFAULT NULL, 
  p_img_url TEXT DEFAULT NULL, 
  p_id_laboratorio INT DEFAULT NULL
) RETURNS TEXT AS $$BEGIN 
  UPDATE "Balanza"
  SET
    nombre = COALESCE(p_nombre, nombre),
    marca = COALESCE(p_marca, marca),
    modelo = COALESCE(p_modelo, modelo),
    serie = COALESCE(p_serie, serie),
    img_url = COALESCE(p_img_url, img_url),
    id_laboratorio = COALESCE(p_id_laboratorio, id_laboratorio)
  WHERE id_balanza = p_id;

  IF NOT FOUND THEN
    RETURN 'No se encontró la balanza.';
  END IF;
  
  RETURN 'Balanza actualizada correctamente.';
END;$$ LANGUAGE plpgsql;

-- Eliminar balanza
CREATE OR REPLACE FUNCTION eliminar_balanza(p_id INT) RETURNS TEXT AS $$
BEGIN
  IF(SELECT 1 FROM "Balanza" WHERE id_balanza=p_id)THEN
    DELETE FROM "Balanza" WHERE id_balanza=p_id;
    RETURN 'Balanza elimnada correctamente.';
  END IF;
  RETURN 'Balanza no encontrado.';
END;
$$ LANGUAGE plpgsql;

-- Obtener una balanza especifica
CREATE OR REPLACE FUNCTION obtener_balanza_por_id(p_id INT) 
RETURNS TABLE(nombre TEXT, marca TEXT, modelo TEXT, serie TEXT, img_url TEXT, estado estado_equipo, ultima TIMESTAMPTZ, id_lab INT, codigo_balanza TEXT) AS $$BEGIN
  RETURN QUERY 
  SELECT b."nombre", b."marca", b."modelo", b."serie", b."img_url", b."estado_calibracion", b."ultima_medicion", b."id_laboratorio", b."codigo" 
  FROM "Balanza" AS b 
  WHERE b."id_balanza" = p_id;
END;$$ LANGUAGE plpgsql;

-- Obtener todas las balanzas

CREATE OR REPLACE FUNCTION obtener_balanzas() 
RETURNS TABLE (nombre TEXT, marca TEXT, modelo TEXT, serie TEXT, img_url TEXT, estado_calibracion estado_equipo, ultima_medicion TIMESTAMPTZ, codigo TEXT, id_laboratorio INT, nombre_laboratorio TEXT) AS $$BEGIN
  RETURN QUERY 
  SELECT b."nombre", b."marca", b."modelo", b."serie", b."img_url", b."estado_calibracion", b."ultima_medicion", b."codigo", l."id_laboratorio", l."nombre" 
  FROM "Balanza" AS b 
  JOIN "Laboratorio" AS l ON l."id_laboratorio" = b."id_laboratorio";
END;$$ LANGUAGE plpgsql;

-- Obtener balanzas por laboratorio

CREATE OR REPLACE FUNCTION obtener_balanzas_por_laboratorio(p_id_laboratorio INT) 
RETURNS TABLE(
    nombre TEXT, marca TEXT, modelo TEXT, serie TEXT, img_url TEXT, 
    estado_calibracion estado_equipo, ultima_medicion TIMESTAMPTZ,
    codigo TEXT, id_laboratorio INT, nombre_laboratorio TEXT
) AS $$BEGIN
  RETURN QUERY 
  SELECT b.nombre, b.marca, b.modelo, b.serie, b.img_url, b.estado_calibracion, 
  b.ultima_medicion, b.codigo, l.id_laboratorio, l.nombre 
  FROM "Balanza" as b 
  JOIN "Laboratorio" as l ON l.id_laboratorio = b.id_laboratorio 
  WHERE l.id_laboratorio = p_id_laboratorio;
END;$$ language plpgsql;

-- Funcion para el buscador de balanza de la pagina de inicio, solo devuelve el estado y la ultima_medicion
CREATE OR REPLACE FUNCTION buscador_balanza_por_codigo(p_codigo TEXT)  
RETURNS TABLE(estado_calibracion estado_equipo, ultima_medicion TIMESTAMPTZ) AS $$BEGIN
  RETURN QUERY 
  SELECT b."estado_calibracion", b."ultima_medicion" 
  FROM "Balanza" AS b 
  WHERE b."codigo" = p_codigo;
END;$$ LANGUAGE plpgsql;

------ LABORATORIOS -------

-- Para insertar nuevos laboratorios


CREATE OR REPLACE FUNCTION registrar_laboratorio(p_nombre TEXT, p_ubicacion TEXT) RETURNS TEXT AS $$
BEGIN 
  INSERT INTO "Laboratorio"(nombre,ubicacion) VALUES (p_nombre, p_ubicacion);
  RETURN 'Laboratorio registrado correctamente.';
END;
$$ LANGUAGE plpgsql;

--Para actualizar la informacion de un "Laboratorio"

CREATE OR REPLACE FUNCTION actualizar_laboratorio(p_id INT,p_nombre TEXT DEFAULT NULL, p_ubicacion TEXT DEFAULT NULL) RETURNS TEXT AS $$
BEGIN 
  UPDATE "Laboratorio"
  SET
    nombre = COALESCE(p_nombre, nombre),
    ubicacion = COALESCE(p_ubicacion,ubicacion)
  WHERE id_laboratorio = p_id;

  IF NOT FOUND THEN
    RETURN 'No se encontró el Laboratorio.';
  END IF;
  
  RETURN 'Laboratorio actualizado correctamente.';
END;$$ LANGUAGE plpgsql;

-- Eliminar Laboratorio
CREATE OR REPLACE FUNCTION eliminar_laboratorio(p_id INT) RETURNS TEXT AS $$
DECLARE v_cant_balanzas INT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Laboratorio" WHERE id_laboratorio = p_id) THEN
      RETURN 'Laboratorio no encontrado.';
    END IF;

    SELECT COUNT(*) INTO v_cant_balanzas FROM "Balanza" WHERE id_laboratorio = p_id;

    IF v_cant_balanzas > 0 THEN
      RETURN 'No puede eliminar este laboratorio ya que tiene ' || v_cant_balanzas || ' balanzas asociadas.';
    END IF;
    DELETE FROM "Laboratorio" WHERE id_laboratorio = p_id;
    RETURN 'Laboratorio eliminado correctamente.';
END;
$$ LANGUAGE plpgsql;

-- Obtener todos los laboratorios

CREATE OR REPLACE FUNCTION obtener_laboratorios() 
RETURNS TABLE (id_laboratorio INT, nombre TEXT, ubicacion TEXT, total_balanzas BIGINT) AS $$BEGIN
  RETURN QUERY 
  SELECT l."id_laboratorio", l."nombre", l."ubicacion", COUNT(b."id_balanza") 
  FROM "Laboratorio" AS l 
  LEFT JOIN "Balanza" AS b ON l."id_laboratorio" = b."id_laboratorio" 
  GROUP BY l."id_laboratorio", l."nombre", l."ubicacion";
END;$$ LANGUAGE plpgsql;

--Obtener un "Laboratorio" en especifico
CREATE OR REPLACE FUNCTION obtener_laboratorio(p_id INT) 
RETURNS TABLE (id_laboratorio INT, nombre TEXT, ubicacion TEXT, total_balanzas BIGINT) AS $$BEGIN
  RETURN QUERY 
  SELECT l.id_laboratorio, l.nombre, l.ubicacion, COUNT(b.id_balanza) 
  FROM "Laboratorio" l 
  LEFT JOIN "Balanza" b ON l.id_laboratorio = b.id_laboratorio 
  WHERE l.id_laboratorio = p_id 
  GROUP BY l.id_laboratorio, l.nombre, l.ubicacion;
END;$$ LANGUAGE plpgsql;


------ REPORTES -------

-- AGREGAR UN NUEVO REPORTE A LA BASE DE DATOS
CREATE OR REPLACE FUNCTION agregar_reporte(p_id_usuario INT, p_id_balanza INT, p_excentricidad_promedio NUMERIC, p_repetibilidad_50 NUMERIC, p_repetibilidad_100 NUMERIC, p_linealidad_promedio NUMERIC, p_cumple_emt BOOLEAN, p_observaciones TEXT, p_estado_final estado_equipo) RETURNS TEXT AS $$
DECLARE nuevo_id INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Usuario" WHERE id_usuario = p_id_usuario) THEN
    RETURN 'El "Usuario" no existe';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "Balanza" WHERE id_balanza = p_id_balanza) THEN
    RETURN 'La balanza no existe';
  END IF;
  INSERT INTO "Reporte"(id_usuario,id_balanza,fecha_analisis,excentricidad_promedio, repetibilidad_50, repetibilidad_100, linealidad_promedio, cumple_emt, observaciones, estado_final) VALUES (p_id_usuario,p_id_balanza,NOW(),p_excentricidad_promedio,p_repetibilidad_50,p_repetibilidad_100,p_linealidad_promedio,p_cumple_emt,p_observaciones,p_estado_final) RETURNING id_reporte INTO nuevo_id;

  UPDATE "Balanza"
  SET
    ultima_medicion = NOW(),
    estado_calibracion = p_estado_final
  WHERE id_balanza = p_id_balanza;
  RETURN 'Reporte #' || nuevo_id || ' guardado y balanza actualizada correctamente.';
END;
$$ LANGUAGE plpgsql;

-- OBTENER TODOS LOS REPORTES de una balanza

CREATE OR REPLACE FUNCTION obtener_reportes_balanza(p_id_balanza INT) RETURNS TABLE (
  id_reporte INT, id_usuario INT, id_balanza INT, fecha_analisis TIMESTAMPTZ,
  excentricidad_promedio NUMERIC, repetibilidad_50 NUMERIC, repetibilidad_100 NUMERIC, 
  linealidad_promedio NUMERIC, cumple_emt BOOLEAN, observaciones TEXT, 
  estado_final estado_equipo, nombre_tecnico TEXT
) AS $$BEGIN
  RETURN QUERY 
  SELECT r.id_reporte, r.id_usuario, r.id_balanza, r.fecha_analisis,
  r.excentricidad_promedio, r.repetibilidad_50, r.repetibilidad_100, 
  r.linealidad_promedio, r.cumple_emt, r.observaciones, r.estado_final,
  u.nombre_completo 
  FROM "Reporte" AS r
  JOIN "Usuario" AS u ON r.id_usuario = u.id_usuario 
  WHERE r.id_balanza = p_id_balanza;
END;$$ LANGUAGE plpgsql;

-- OBTENER TODOS LOS REPORTES de un "Usuario"

CREATE OR REPLACE FUNCTION obtener_reportes_usuario(p_id_usuario INT) RETURNS TABLE 
(
  id_reporte INT,
  id_usuario INT,
  id_balanza INT,
  fecha_analisis TIMESTAMPTZ,
  excentricidad_promedio NUMERIC, 
  repetibilidad_50 NUMERIC, 
  repetibilidad_100 NUMERIC, 
  linealidad_promedio NUMERIC, 
  cumple_emt BOOLEAN, 
  observaciones TEXT, 
  estado_final estado_equipo,
  nombre_balanza TEXT
) AS $$
BEGIN
  RETURN QUERY SELECT r.id_reporte,r.id_usuario,r.id_balanza,r.fecha_analisis,r.excentricidad_promedio, r.repetibilidad_50, r.repetibilidad_100, r.linealidad_promedio, r.cumple_emt, r.observaciones, r.estado_final,b.nombre FROM "Reporte" as r JOIN "Balanza" as b ON r.id_balanza=b.id_balanza WHERE r.id_usuario = p_id_usuario ;
END;
$$ LANGUAGE plpgsql;

-- obtener datos reporte completo

CREATE OR REPLACE FUNCTION obtener_reporte(p_id_reporte INT) RETURNS TABLE (
  id_reporte INT, id_usuario INT, id_balanza INT, fecha_analisis TIMESTAMPTZ,
  excentricidad_promedio NUMERIC, repetibilidad_50 NUMERIC, repetibilidad_100 NUMERIC, 
  linealidad_promedio NUMERIC, cumple_emt BOOLEAN, observaciones TEXT, 
  estado_final estado_equipo, nombre_balanza TEXT, nombre_usuario TEXT, nombre_laboratorio TEXT
) AS $$BEGIN
  RETURN QUERY 
  SELECT r."id_reporte", r."id_usuario", r."id_balanza", r."fecha_analisis", r."excentricidad_promedio", r."repetibilidad_50", r."repetibilidad_100", r."linealidad_promedio", r."cumple_emt", r."observaciones", r."estado_final", b."nombre", u."nombre_completo", l."nombre" 
  FROM "Reporte" AS r 
  JOIN "Balanza" AS b ON r."id_balanza" = b."id_balanza"  
  JOIN "Usuario" AS u ON r."id_usuario" = u."id_usuario" 
  JOIN "Laboratorio" AS l ON b."id_laboratorio" = l."id_laboratorio" 
  WHERE r."id_reporte" = p_id_reporte;
END;$$ LANGUAGE plpgsql;
