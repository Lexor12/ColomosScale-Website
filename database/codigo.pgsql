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
  "nombre" TEXT
);

-- Tabla "Usuario"
CREATE TABLE "Usuario" (
  "id_usuario" SERIAL PRIMARY KEY, -- Auto-incremental
  "username" TEXT NOT NULL UNIQUE,
  "nombre_completo" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "correo" TEXT NOT NULL UNIQUE,
  "img_url" TEXT,
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
  "excentricidad_promedio" NUMERIC,
  "repetibilidad_50" NUMERIC,
  "repetibilidad_100" NUMERIC,
  "linealidad_promedio" NUMERIC,
  "cumple_emt" BOOL,
  "observaciones" TEXT,
  "estado_final" estado_equipo 
);
INSERT INTO "Rol" VALUES (1, 'ADMIN'),(2, 'SUPERVISOR'),(3, 'TECNICO');

--------- FUNCIONES Y PROCEDURES
----------------------- "Usuario"S ---------------------------
-- INSERTA UN USUSARIO EN LA BASE DE DATOS
CREATE OR REPLACE FUNCTION registrar_usuario(p_username TEXT,p_nombre_completo TEXT, p_correo TEXT,p_password TEXT,p_rol INT,p_img_url TEXT) RETURNS TEXT SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Usuario" WHERE correo = p_correo OR username =p_username) THEN
    RETURN 'El correo y/o el username ya existe';
  END IF;
  --Caso contrario el else
  INSERT INTO "Usuario"(username,nombre_completo,correo,password,fecha_creacion,rol,img_url) VALUES(p_username,p_nombre_completo,p_correo,p_password,NOW(),p_rol,COALESCE(p_img_url,''));
  RETURN 'Usuario registrado correctamente.';
END;
$$ LANGUAGE plpgsql; 
-- REGRESA TODOS LOS CAMPOS INCLUYENDO LA CONTRASEÑA PARA REALIZAR EL ANALISIS EN NODE
-- Función corregida por CORREO
CREATE OR REPLACE FUNCTION obtener_usuarios_por_correo(p_correo TEXT)  
RETURNS TABLE(username TEXT, nombre_completo TEXT, correo TEXT, password TEXT, fecha_creacion TIMESTAMPTZ, rol INT) SECURITY DEFINER SET search_path = public AS $$ BEGIN
  RETURN QUERY 
  SELECT u.username, u.nombre_completo, u.correo, u.password, u.fecha_creacion, u.rol 
  FROM "Usuario" AS u 
  WHERE u.correo = p_correo;
END;$$ LANGUAGE plpgsql;

-- Función corregida por USERNAME
CREATE OR REPLACE FUNCTION obtener_usuario_por_username(p_username TEXT)  
RETURNS TABLE(id INT,username TEXT, nombre_completo TEXT, correo TEXT, img TEXT, fecha_creacion TIMESTAMPTZ, id_rol INT,nombre_rol TEXT) SECURITY DEFINER SET search_path = public AS $$ BEGIN
  RETURN QUERY 
  SELECT u.id_usuario,u.username, u.nombre_completo, u.correo, u.img_url, u.fecha_creacion, u.rol,r.nombre 
  FROM "Usuario" AS u JOIN "Rol" as r ON r.id_rol=u.rol
  WHERE u.username = p_username;
END;$$ LANGUAGE plpgsql;

-- Obtener ususario por su id
DROP FUNCTION   (INT);

CREATE OR REPLACE FUNCTION obtener_usuario_por_id(p_id INT)RETURNS TABLE(username TEXT, nombre_completo TEXT, correo TEXT, fecha_creacion TIMESTAMPTZ, rol TEXT,img TEXT) SECURITY DEFINER SET search_path = public AS $$ BEGIN
RETURN QUERY SELECT u.username, u.nombre_completo, u.correO, u.fecha_creacion, r.nombre, u.img_url
  FROM "Usuario" AS u JOIN "Rol" AS r ON r.id_rol = u.rol
  WHERE u.id_usuario = p_id;
END;$$ LANGUAGE plpgsql;

-- OBTIENE TODOS LOS "Usuario"S CON SUS ROLES (nombre del rol)
CREATE OR REPLACE FUNCTION obtener_usuarios() 
RETURNS TABLE (username TEXT, nombre_completo TEXT, correo TEXT, fecha_creacion TIMESTAMPTZ, rol_nombre TEXT) SECURITY DEFINER SET search_path = public AS $$ BEGIN
  RETURN QUERY 
  SELECT u."username", u."nombre_completo", u."correo", u."fecha_creacion", r."nombre"::TEXT 
  FROM "Usuario" AS u 
  JOIN "Rol" AS r ON r."id_rol" = u."rol";
END;$$ LANGUAGE plpgsql;
--ACTUALIZAR LOS DATOS DE USUSARIO

DROP FUNCTION actualizar_usuario(INT,TEXT,TEXT,TEXT,TEXT,INT);

CREATE OR REPLACE FUNCTION actualizar_usuario(
  p_id INT,
  p_username TEXT DEFAULT NULL,
  p_nombre_completo TEXT DEFAULT NULL,
  p_correo TEXT DEFAULT NULL,
  p_password TEXT DEFAULT NULL,
  p_rol INT DEFAULT NULL,
  p_img TEXT DEFAULT NULL
) RETURNS TEXT SECURITY DEFINER SET search_path = public AS $$ BEGIN
  UPDATE "Usuario"
  SET
    username = COALESCE(p_username, username),
    nombre_completo = COALESCE(p_nombre_completo, nombre_completo),
    correo = COALESCE(p_correo, correo),
    password = COALESCE(p_password, password),
    rol = COALESCE(p_rol, rol),
    img_url=COALESCE(p_img,img_url)
  WHERE id_usuario = p_id; 

  IF NOT FOUND THEN RETURN 'Usuario no encontrado'; END IF;
  RETURN 'Usuario actualizado';
END;$$ LANGUAGE plpgsql;

-- Eliminar "Usuario"
CREATE OR REPLACE FUNCTION eliminar_usuario(p_id INT)
RETURNS TABLE(status INT, mensaje TEXT)
SECURITY DEFINER SET search_path = public AS $$ 
DECLARE v_cant_reportes INT;
DECLARE v_rol INT;
BEGIN
  IF EXISTS (SELECT 1 FROM "Usuario" WHERE id_usuario=p_id) THEN
      SELECT COUNT(*) INTO v_cant_reportes FROM "Reporte" WHERE id_usuario = p_id;

      SELECT rol INTO v_rol FROM "Usuario" WHERE id_usuario=p_id;
      IF v_rol =4 THEN
        status := -1;
        mensaje := 'Usuario no encontrado.';
        RETURN NEXT; 
      END IF;
      IF v_cant_reportes > 0 THEN
        status := -1;
        mensaje := 'No puede eliminar este usuario ya que tiene ' || v_cant_reportes || ' reporte(s) asociados.';
        RETURN NEXT;
        RETURN;
      END IF;
      
      DELETE FROM "Usuario" WHERE id_usuario=p_id;
      status := 1;
      mensaje := 'Usuario eliminado correctamente.';
  ELSE
    status := -1;
    mensaje := 'Usuario no encontrado.';
  END IF;
  
  RETURN NEXT; 
END;
$$ LANGUAGE plpgsql;


----------------------- "Balanza"S ---------------------------

-- CREAR O AGREGAR UNA "Balanza"

CREATE OR REPLACE FUNCTION registrar_balanza(
    p_nombre TEXT, 
    p_marca TEXT, 
    p_modelo TEXT, 
    p_serie TEXT, 
    p_img_url TEXT, 
    p_id_laboratorio INT
) RETURNS TEXT SECURITY DEFINER SET search_path = public AS $$ 
DECLARE 
    v_anio TEXT := TO_CHAR(NOW(), 'YYYY'); 
    v_ultimo_correlativo INT; -- QUITAMOS EL "DECLARE" EXTRA
    v_nuevo_codigo TEXT;      -- QUITAMOS EL "DECLARE" EXTRA
BEGIN 
    -- Tu lógica aquí...
    SELECT COALESCE(MAX(SUBSTRING(codigo FROM 10)::INT), 0)
    INTO v_ultimo_correlativo
    FROM "Balanza"
    WHERE codigo LIKE 'BAL-' || v_anio || '-%';

    v_nuevo_codigo := 'BAL-' || v_anio || '-' || LPAD((v_ultimo_correlativo + 1)::TEXT, 4, '0');

    INSERT INTO "Balanza" (nombre, marca, modelo, serie, img_url, estado_calibracion, ultima_medicion, id_laboratorio, codigo) 
    VALUES (p_nombre, p_marca, p_modelo, p_serie, COALESCE(p_img_url, ''), 'MALA', NOW(), p_id_laboratorio, v_nuevo_codigo);
    
    RETURN 'Balanza registrada exitosamente con el código: ' || v_nuevo_codigo;
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
) RETURNS TEXT SECURITY DEFINER SET search_path = public AS $$ BEGIN 
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
CREATE OR REPLACE FUNCTION eliminar_balanza(p_id INT) 
RETURNS TABLE(status INT, mensaje TEXT)
SECURITY DEFINER SET search_path = public AS $$ 
DECLARE v_cant_reportes INT;
BEGIN
    IF EXISTS (SELECT 1 FROM "Balanza" WHERE id_balanza=p_id) THEN
      SELECT COUNT(*) INTO v_cant_reportes FROM "Reporte" WHERE id_balanza = p_id;

      IF v_cant_reportes > 0 THEN
        status := 0;
        mensaje := 'No puede eliminar esta balanza ya que tiene ' || v_cant_reportes || ' reportes asociados.';
        RETURN NEXT; 
        RETURN;
      END IF;
      
      DELETE FROM "Balanza" WHERE id_balanza=p_id;
      status := 1;
      mensaje := 'Balanza eliminada correctamente.';
    ELSE
      status := 0;
      mensaje := 'Balanza no encontrada.';
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Eliminar balanza por codigo
CREATE OR REPLACE FUNCTION eliminar_balanza_codigo(p_codigo TEXT) RETURNS TEXT SECURITY DEFINER SET search_path = public AS $$ 
BEGIN
  IF(SELECT 1 FROM "Balanza" WHERE codigo=p_codigo)THEN
    DELETE FROM "Balanza" WHERE codigo=p_codigo;
    RETURN 'Balanza elimnada correctamente.';
  END IF;
  RETURN 'Balanza no encontrado.';
END;
$$ LANGUAGE plpgsql;

-- Obtener una balanza especifica
CREATE OR REPLACE FUNCTION obtener_balanza_por_id(p_id INT) 
RETURNS TABLE(nombre TEXT, marca TEXT, modelo TEXT, serie TEXT, img_url TEXT, estado estado_equipo, ultima TIMESTAMPTZ, id_lab INT, codigo_balanza TEXT,laboratorio TEXT) SECURITY DEFINER SET search_path = public AS $$ BEGIN
  RETURN QUERY 
  SELECT b."nombre", b."marca", b."modelo", b."serie", b."img_url", b."estado_calibracion", b."ultima_medicion", b."id_laboratorio", b."codigo",l.nombre 
  FROM "Balanza" AS b JOIN "Laboratorio" AS l ON l.id_laboratorio=b.id_laboratorio;
  WHERE b."id_balanza" = p_id;
END;$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION obtener_balanza_por_codigo(p_codigo TEXT) 
RETURNS TABLE(id INT, nombre TEXT, marca TEXT, modelo TEXT, serie TEXT, img_url TEXT, estado estado_equipo, ultima TIMESTAMPTZ, id_lab INT, codigo_balanza TEXT) SECURITY DEFINER SET search_path = public AS $$ BEGIN
  RETURN QUERY 
  SELECT b."id_balanza", b."nombre", b."marca", b."modelo", b."serie", b."img_url", b."estado_calibracion", b."ultima_medicion", b."id_laboratorio", b."codigo" 
  FROM "Balanza" AS b 
  WHERE b."codigo" = p_codigo;
END;$$ LANGUAGE plpgsql;


-- Obtener todas las balanzas

CREATE OR REPLACE FUNCTION obtener_balanzas() 
RETURNS TABLE (id_balanza INT,nombre TEXT, marca TEXT, modelo TEXT, serie TEXT, img_url TEXT, estado_calibracion estado_equipo, ultima_medicion TIMESTAMPTZ, codigo TEXT, id_laboratorio INT, nombre_laboratorio TEXT) SECURITY DEFINER SET search_path = public AS $$ BEGIN
  RETURN QUERY 
  SELECT b.id_balanza,b."nombre", b."marca", b."modelo", b."serie", b."img_url", b."estado_calibracion", b."ultima_medicion", b."codigo", l."id_laboratorio", l."nombre" 
  FROM "Balanza" AS b 
  JOIN "Laboratorio" AS l ON l."id_laboratorio" = b."id_laboratorio";
END;$$ LANGUAGE plpgsql;

-- Obtener balanzas por laboratorio

CREATE OR REPLACE FUNCTION obtener_balanzas_por_laboratorio(p_id_laboratorio INT) 
RETURNS TABLE(
    nombre TEXT, marca TEXT, modelo TEXT, serie TEXT, img_url TEXT, 
    estado_calibracion estado_equipo, ultima_medicion TIMESTAMPTZ,
    codigo TEXT, id_laboratorio INT, nombre_laboratorio TEXT
) SECURITY DEFINER SET search_path = public AS $$ BEGIN
  RETURN QUERY 
  SELECT b.nombre, b.marca, b.modelo, b.serie, b.img_url, b.estado_calibracion, 
  b.ultima_medicion, b.codigo, l.id_laboratorio, l.nombre 
  FROM "Balanza" as b 
  JOIN "Laboratorio" as l ON l.id_laboratorio = b.id_laboratorio 
  WHERE l.id_laboratorio = p_id_laboratorio;
END;$$ language plpgsql;

-- Funcion para el buscador de balanza de la pagina de inicio, solo devuelve el estado y la ultima_medicion
CREATE OR REPLACE FUNCTION buscador_balanza_por_codigo(p_codigo TEXT)  
RETURNS TABLE(estado_calibracion estado_equipo, ultima_medicion TIMESTAMPTZ) SECURITY DEFINER SET search_path = public AS $$ BEGIN
  RETURN QUERY 
  SELECT b."estado_calibracion", b."ultima_medicion" 
  FROM "Balanza" AS b 
  WHERE b."codigo" = p_codigo;
END;$$ LANGUAGE plpgsql;

------ LABORATORIOS -------

-- Para insertar nuevos laboratorios


CREATE OR REPLACE FUNCTION registrar_laboratorio(p_nombre TEXT, p_ubicacion TEXT) RETURNS TEXT SECURITY DEFINER SET search_path = public AS $$ 
BEGIN 
  INSERT INTO "Laboratorio"(nombre,ubicacion) VALUES (p_nombre, p_ubicacion);
  RETURN 'Laboratorio registrado correctamente.';
END;
$$ LANGUAGE plpgsql;

--Para actualizar la informacion de un "Laboratorio"

CREATE OR REPLACE FUNCTION actualizar_laboratorio(p_id INT,p_nombre TEXT DEFAULT NULL, p_ubicacion TEXT DEFAULT NULL) RETURNS TEXT SECURITY DEFINER SET search_path = public AS $$ 
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
CREATE OR REPLACE FUNCTION eliminar_laboratorio(p_id INT) 
RETURNS TABLE(status INT, mensaje TEXT) 
SECURITY DEFINER SET search_path = public AS $$ 
DECLARE v_cant_balanzas INT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Laboratorio" WHERE id_laboratorio = p_id) THEN
        status := 0;
        mensaje := 'Laboratorio no encontrado.';
        RETURN NEXT;
        RETURN;
    END IF;
    
    SELECT COUNT(*) INTO v_cant_balanzas FROM "Balanza" WHERE id_laboratorio = p_id;
    
    IF v_cant_balanzas > 0 THEN
        status := 0;
        mensaje := 'No puede eliminar este laboratorio ya que tiene ' || v_cant_balanzas || ' balanzas asociadas.';
    ELSE
        DELETE FROM "Laboratorio" WHERE id_laboratorio = p_id;
        status := 1;
        mensaje := 'Laboratorio eliminado correctamente.';
    END IF;
    
    RETURN NEXT; 
END;
$$ LANGUAGE plpgsql;

-- Obtener todos los laboratorios

CREATE OR REPLACE FUNCTION obtener_laboratorios() 
RETURNS TABLE (id_laboratorio INT, nombre TEXT, ubicacion TEXT, total_balanzas BIGINT) SECURITY DEFINER SET search_path = public AS $$ BEGIN
  RETURN QUERY 
  SELECT l."id_laboratorio", l."nombre", l."ubicacion", COUNT(b."id_balanza") 
  FROM "Laboratorio" AS l 
  LEFT JOIN "Balanza" AS b ON l."id_laboratorio" = b."id_laboratorio" 
  GROUP BY l."id_laboratorio", l."nombre", l."ubicacion";
END;$$ LANGUAGE plpgsql;

--Obtener un "Laboratorio" en especifico
CREATE OR REPLACE FUNCTION obtener_laboratorio(p_id INT) 
RETURNS TABLE (id_laboratorio INT, nombre TEXT, ubicacion TEXT, total_balanzas BIGINT) SECURITY DEFINER SET search_path = public AS $$ BEGIN
  RETURN QUERY 
  SELECT l.id_laboratorio, l.nombre, l.ubicacion, COUNT(b.id_balanza) 
  FROM "Laboratorio" l 
  LEFT JOIN "Balanza" b ON l.id_laboratorio = b.id_laboratorio 
  WHERE l.id_laboratorio = p_id 
  GROUP BY l.id_laboratorio, l.nombre, l.ubicacion;
END;$$ LANGUAGE plpgsql;


------ REPORTES -------

-- AGREGAR UN NUEVO REPORTE A LA BASE DE DATOS
CREATE OR REPLACE FUNCTION agregar_reporte(p_id_usuario INT, p_codigo_balanza TEXT, p_excentricidad_promedio NUMERIC, p_repetibilidad_50 NUMERIC, p_repetibilidad_100 NUMERIC, p_linealidad_promedio NUMERIC, p_cumple_emt BOOLEAN, p_observaciones TEXT, p_estado_final estado_equipo) RETURNS TEXT
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE nuevo_id INT;
DECLARE v_id_balanza INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Usuario" WHERE id_usuario = p_id_usuario) THEN
    RETURN 'Error: Su usuario no existe.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Balanza" WHERE codigo = p_codigo_balanza) THEN
    RETURN 'El codigo de la balanza no existe.';
  END IF;

  SELECT id_balanza INTO v_id_balanza FROM "Balanza" WHERE codigo=p_codigo_balanza;

  INSERT INTO "Reporte"(id_usuario,id_balanza,fecha_analisis,excentricidad_promedio, repetibilidad_50, repetibilidad_100, linealidad_promedio, cumple_emt, observaciones, estado_final) VALUES (p_id_usuario,v_id_balanza,NOW(),p_excentricidad_promedio,p_repetibilidad_50,p_repetibilidad_100,p_linealidad_promedio,p_cumple_emt,p_observaciones,p_estado_final) RETURNING id_reporte INTO nuevo_id;
  UPDATE "Balanza"
  SET
    ultima_medicion = NOW(),
    estado_calibracion = p_estado_final
  WHERE codigo = p_codigo_balanza;
  RETURN 'Reporte #' || nuevo_id || ' guardado y balanza actualizada correctamente.';
END;
$$ LANGUAGE plpgsql; 

-- Obteer todos los REPORTES

CREATE OR REPLACE FUNCTION obtener_reportes() RETURNS TABLE (
  id_reporte INT, id_usuario INT, id_balanza INT, fecha_analisis TIMESTAMPTZ,
  excentricidad_promedio NUMERIC, repetibilidad_50 NUMERIC, repetibilidad_100 NUMERIC, 
  linealidad_promedio NUMERIC, cumple_emt BOOLEAN, observaciones TEXT, 
  estado_final estado_equipo, nombre_tecnico TEXT
) SECURITY DEFINER SET search_path = public AS $$ BEGIN
  RETURN QUERY 
  SELECT r.id_reporte, r.id_usuario, r.id_balanza, r.fecha_analisis,
  r.excentricidad_promedio, r.repetibilidad_50, r.repetibilidad_100, 
  r.linealidad_promedio, r.cumple_emt, r.observaciones, r.estado_final,
  u.nombre_completo 
  FROM "Reporte" AS r
  JOIN "Usuario" AS u ON r.id_usuario = u.id_usuario;
END;$$ LANGUAGE plpgsql;

-- OBTENER TODOS LOS REPORTES de una balanza

CREATE OR REPLACE FUNCTION obtener_reportes_balanza(p_id_balanza INT) RETURNS TABLE (
  id_reporte INT, id_usuario INT, id_balanza INT, fecha_analisis TIMESTAMPTZ,
  excentricidad_promedio NUMERIC, repetibilidad_50 NUMERIC, repetibilidad_100 NUMERIC, 
  linealidad_promedio NUMERIC, cumple_emt BOOLEAN, observaciones TEXT, 
  estado_final estado_equipo, nombre_tecnico TEXT
) SECURITY DEFINER SET search_path = public AS $$ BEGIN
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
) SECURITY DEFINER SET search_path = public AS $$ 
BEGIN
  RETURN QUERY SELECT r.id_reporte,r.id_usuario,r.id_balanza,r.fecha_analisis,r.excentricidad_promedio, r.repetibilidad_50, r.repetibilidad_100, r.linealidad_promedio, r.cumple_emt, r.observaciones, r.estado_final,b.nombre FROM "Reporte" as r JOIN "Balanza" as b ON r.id_balanza=b.id_balanza WHERE r.id_usuario = p_id_usuario ;
END;
$$ LANGUAGE plpgsql;

-- Borrar reporte 
CREATE OR REPLACE FUNCTION eliminar_reporte(p_id INT)
RETURNS TABLE(status INT, mensaje TEXT)
SECURITY DEFINER SET search_path = public AS $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM "Reporte" WHERE id_reporte=p_id) THEN
      DELETE FROM "Reporte" WHERE id_reporte=p_id;
      status := 1;
      mensaje := 'Reporte eliminado correctamente.';
  ELSE
    status := -1;
    mensaje := 'Reporte no encontrado.';
  END IF;
  RETURN NEXT; 
END;
$$ LANGUAGE plpgsql;


--Actualizar reporte

CREATE OR REPLACE FUNCTION actualizar_reporte(
  p_id INT,
  p_id_usuario INT DEFAULT NULL,
  p_id_balanza INT DEFAULT NULL,
  p_excentricidad_promedio NUMERIC DEFAULT NULL,
  p_repetibilidad_50 NUMERIC DEFAULT NULL,
  p_repetibilidad_100 NUMERIC DEFAULT NULL,
  p_linealidad_promedio NUMERIC DEFAULT NULL,
  p_observaciones TEXT DEFAULT NULL
) RETURNS TEXT SECURITY DEFINER SET search_path = public AS $$ 
BEGIN
  UPDATE "Reporte"
  SET
    id_usuario = COALESCE(p_id_usuario, id_usuario),
    id_balanza = COALESCE(p_id_balanza, id_balanza),
    fecha_analisis = NOW(),
    excentricidad_promedio = COALESCE(p_excentricidad_promedio, excentricidad_promedio),
    repetibilidad_50 = COALESCE(p_repetibilidad_50, repetibilidad_50),
    repetibilidad_100 = COALESCE(p_repetibilidad_100, repetibilidad_100),
    linealidad_promedio = COALESCE(p_linealidad_promedio, linealidad_promedio),
    observaciones = COALESCE(p_observaciones, observaciones)
  WHERE id_reporte = p_id; 

  IF NOT FOUND THEN RETURN 'Reporte no encontrado'; END IF;
  RETURN 'Reporte actualizado';
END;$$ LANGUAGE plpgsql;


-- obtener datos reporte completo

CREATE OR REPLACE FUNCTION obtener_reporte(p_id_reporte INT) RETURNS TABLE (
  id_reporte INT, id_usuario INT, id_balanza INT, fecha_analisis TIMESTAMPTZ,
  excentricidad_promedio NUMERIC, repetibilidad_50 NUMERIC, repetibilidad_100 NUMERIC, 
  linealidad_promedio NUMERIC, cumple_emt BOOLEAN, observaciones TEXT, 
  estado_final estado_equipo, nombre_balanza TEXT, nombre_usuario TEXT, nombre_laboratorio TEXT
) SECURITY DEFINER SET search_path = public AS $$ BEGIN
  RETURN QUERY 
  SELECT r."id_reporte", r."id_usuario", r."id_balanza", r."fecha_analisis", r."excentricidad_promedio", r."repetibilidad_50", r."repetibilidad_100", r."linealidad_promedio", r."cumple_emt", r."observaciones", r."estado_final", b."nombre", u."nombre_completo", l."nombre" 
  FROM "Reporte" AS r 
  JOIN "Balanza" AS b ON r."id_balanza" = b."id_balanza"  
  JOIN "Usuario" AS u ON r."id_usuario" = u."id_usuario" 
  JOIN "Laboratorio" AS l ON b."id_laboratorio" = l."id_laboratorio" 
  WHERE r."id_reporte" = p_id_reporte;
END;$$ LANGUAGE plpgsql;

------- ESPECIFICAS
DROP FUNCTION iniciar_sesion(text,text);
CREATE OR REPLACE FUNCTION iniciar_sesion(p_username TEXT, p_password TEXT) 
RETURNS TABLE(id_res INT, rol_res INT)
SECURITY DEFINER
SET search_path = public
AS $$BEGIN    
    SELECT u.id_usuario, r.id_rol 
    INTO id_res, rol_res
    FROM "Usuario" u 
    JOIN "Rol" r ON r.id_rol = u.rol
    WHERE u.username = p_username AND u.password = p_password;

    IF id_res IS NULL THEN
        id_res := -1;
        rol_res := -1;
    END IF;

    RETURN NEXT;
END;$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION obtener_tecnicos(p_rol INT) 
RETURNS TABLE (nombre_completo TEXT, correo TEXT, fecha_creacion TIMESTAMPTZ,img TEXT,username TEXT,rol TEXT) SECURITY DEFINER SET search_path = public AS $$ BEGIN
  RETURN QUERY 
  SELECT u.nombre_completo,u.correo,u.fecha_creacion,u.img_url,u.username,r.nombre
  FROM "Usuario" AS u JOIN "Rol" as r ON r.id_rol=u.rol WHERE u.rol<=p_rol;
END;$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION obtener_tecnicos_id(p_rol INT) 
RETURNS TABLE (id INT,nombre_completo TEXT, correo TEXT, fecha_creacion TIMESTAMPTZ,img TEXT,username TEXT,rol TEXT) SECURITY DEFINER SET search_path = public AS $$ BEGIN
  RETURN QUERY 
  SELECT u.id_usuario,u.nombre_completo,u.correo,u.fecha_creacion,u.img_url,u.username,r.nombre
  FROM "Usuario" AS u JOIN "Rol" as r ON r.id_rol=u.rol WHERE u.rol<=p_rol;
END;$$ LANGUAGE plpgsql;


GRANT EXECUTE ON FUNCTION iniciar_sesion(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION iniciar_sesion(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION agregar_reporte(INT, TEXT,NUMERIC,NUMERIC,NUMERIC,NUMERIC,BOOLEAN,TEXT,estado_equipo) TO anon;
GRANT EXECUTE ON FUNCTION agregar_reporte(INT, TEXT,NUMERIC,NUMERIC,NUMERIC,NUMERIC,BOOLEAN,TEXT,estado_equipo) TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_usuario_por_id(int) TO anon;
GRANT EXECUTE ON FUNCTION obtener_usuario_por_id(int) TO authenticated;


ALTER TABLE "Reporte" ALTER COLUMN excentricidad_promedio TYPE NUMERIC;
ALTER TABLE "Reporte" ALTER COLUMN repetibilidad_50 TYPE NUMERIC;
ALTER TABLE "Reporte" ALTER COLUMN repetibilidad_100 TYPE NUMERIC;
ALTER TABLE "Reporte" ALTER COLUMN linealidad_promedio TYPE NUMERIC;



-- (Obligatorio para que funcione todo lo demás)
GRANT CONNECT ON DATABASE postgres TO colomosback;
GRANT USAGE ON SCHEMA public TO colomosback;

-- CATEGORÍA: USUARIOS
GRANT EXECUTE ON FUNCTION registrar_usuario(TEXT, TEXT, TEXT, TEXT, INT) TO colomosback;
GRANT EXECUTE ON FUNCTION obtener_usuarios_por_correo(TEXT) TO colomosback;
GRANT EXECUTE ON FUNCTION obtener_usuario_por_username(TEXT) TO colomosback;
GRANT EXECUTE ON FUNCTION obtener_usuarios() TO colomosback;
GRANT EXECUTE ON FUNCTION actualizar_usuario(INT, TEXT, TEXT, TEXT, TEXT, INT) TO colomosback;
GRANT EXECUTE ON FUNCTION eliminar_usuario(INT) TO colomosback;
GRANT EXECUTE ON FUNCTION iniciar_sesion(TEXT, TEXT) TO colomosback;

-- CATEGORÍA: BALANZAS
GRANT EXECUTE ON FUNCTION registrar_balanza(TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT) TO colomosback;
GRANT EXECUTE ON FUNCTION actualizar_balanza(INT, TEXT, TEXT, TEXT, TEXT, TEXT, INT) TO colomosback;
GRANT EXECUTE ON FUNCTION eliminar_balanza(INT) TO colomosback;
GRANT EXECUTE ON FUNCTION obtener_balanza_por_id(INT) TO colomosback;
GRANT EXECUTE ON FUNCTION obtener_balanza_por_codigo(TEXT) TO colomosback;
GRANT EXECUTE ON FUNCTION obtener_balanzas() TO colomosback;
GRANT EXECUTE ON FUNCTION obtener_balanzas_por_laboratorio(INT) TO colomosback;
GRANT EXECUTE ON FUNCTION buscador_balanza_por_codigo(TEXT) TO colomosback;

-- CATEGORÍA: LABORATORIOS
GRANT EXECUTE ON FUNCTION registrar_laboratorio(TEXT, TEXT) TO colomosback;
GRANT EXECUTE ON FUNCTION actualizar_laboratorio(INT, TEXT, TEXT) TO colomosback;
GRANT EXECUTE ON FUNCTION eliminar_laboratorio(INT) TO colomosback;
GRANT EXECUTE ON FUNCTION obtener_laboratorios() TO colomosback;
GRANT EXECUTE ON FUNCTION obtener_laboratorio(INT) TO colomosback;

-- CATEGORÍA: REPORTES (Solo lectura, como pediste)
GRANT EXECUTE ON FUNCTION obtener_reportes_balanza(INT) TO colomosback;
GRANT EXECUTE ON FUNCTION obtener_reportes_usuario(INT) TO colomosback;
GRANT EXECUTE ON FUNCTION actualizar_reporte(INT,INT,INT,NUMERIC,NUMERIC,NUMERIC,NUMERIC,TEXT) TO colomosback;
GRANT EXECUTE ON FUNCTION eliminar_reporte(INT) TO colomosback;
GRANT EXECUTE ON FUNCTION obtener_reporte(INT) TO colomosback;


GRANT EXECUTE ON FUNCTION obtener_tecnicos() TO colomosback;