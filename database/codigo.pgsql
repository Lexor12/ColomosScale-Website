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

-- Tabla Usuario
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

-- Tabla Balanza
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

----------------------- USUARIOS ---------------------------


-- INSERTA UN USUSARIO EN LA BASE DE DATOS
CREATE FUNCTION registrar_usuario(p_username TEXT,p_nombre_completo TEXT, p_correo TEXT,p_password TEXT,p_rol INT) RETURNS TEXT AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM Usuario WHERE correo = p_correo OR username =p_username) THEN
    RETURN 'El correo y/o el username ya existe';
  END IF;
  --Caso contrario el else
  INSERT INTO Usuario(username,nombre_completo,correo,password,fecha_creacion,rol) VALUES(p_username,p_nombre_completo,p_correo,p_password,NOW(),p_rol);
  RETURN 'Usuario registrado correctamente.';
END;
$$ LANGUAGE plpgsql;
-- REGRESA TODOS LOS CAMPOS INCLUYENDO LA CONTRASEÑA PARA REALIZAR EL ANALISIS EN NODE
CREATE FUNCTION obtener_usuarios_por_correo(p_correo TEXT) 
RETURNS TABLE(username TEXT,nombre_completo TEXT, correo TEXT,password TEXT,fecha_creacion TIMESTAMPTZ,rol INT) AS $$
BEGIN
  RETURN QUERY SELECT username,nombre_completo,correo,password,fecha_creacion,rol FROM "Usuario" WHERE correo=p_correo;
END;
$$ language plpgsql;

CREATE FUNCTION obtener_usuarios_por_username(p_username TEXT) 
RETURNS TABLE(username TEXT,nombre_completo TEXT, correo TEXT,password TEXT,fecha_creacion TIMESTAMPTZ,rol INT) AS $$
BEGIN
  RETURN QUERY SELECT username,nombre_completo,correo,password,fecha_creacion,rol FROM "Usuario" WHERE username=p_username;
END;
$$ language plpgsql;
-- OBTIENE TODOS LOS USUARIOS CON SUS ROLES (nombre del rol)
CREATE FUNCTION obtener_usuarios() RETURNS TABLE (username TEXT,nombre_completo TEXT, correo TEXT,fecha_creacion TIMESTAMPTZ,rol TEXT) AS $$
BEGIN
  RETURN QUERY SELECT u.username,u.nombre_completo,u.correo,u.fecha_creacion,r.nombre FROM "Usuario" as u JOIN Rol r ON r.id_rol = u.rol;
END;
$$ LANGUAGE plpgsql;
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

-- Eliminar Usuario
CREATE FUNCTION eliminar_usuario(p_id INT) RETURNS TEXT AS $$
BEGIN
  IF(SELECT 1 FROM "Usuario" WHERE id_usuario=p_id)THEN
    DELETE FROM "Usuario" WHERE id_usuario=p_id;
    RETURN 'Usuario elimnado correctamente.';
  END IF;
  RETURN 'Usuario no encontrado.';
END;
$$ LANGUAGE plpgsql;

----------------------- BALANZAS ---------------------------

-- CREAR O AGREGAR UNA BALANZA

CREATE OR REPLACE FUNCTION registrar_balanza(p_nombre TEXT, p_marca TEXT, p_modelo TEXT, p_serie TEXT, p_img_url TEXT, p_id_laboratorio INT,p_codigo TEXT) RETURNS TEXT AS $$
BEGIN 
  INSERT INTO Balanza(nombre,marca,modelo,serie,img_url,estado_calibracion,ultima_medicion,id_laboratorio,codigo) VALUES (p_nombre, p_marca, p_modelo, p_serie, p_img_url,'MALA',NOW(), p_id_laboratorio,p_codigo);
  RETURN 'Balanza registrada correctamente.';
END;
$$ LANGUAGE plpgsql;
-- ACTUALIZAR BALANZA
CREATE OR REPLACE FUNCTION actualizar_balanza(
  p_id INT,
  p_nombre TEXT DEFAULT NULL, 
  p_marca TEXT DEFAULT NULL, 
  p_modelo TEXT DEFAULT NULL, 
  p_serie TEXT DEFAULT NULL, 
  p_img_url TEXT DEFAULT NULL, 
  p_id_laboratorio INT DEFAULT NULL
) RETURNS TEXT AS $$BEGIN 
  UPDATE Balanza
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
  RETURN 'Balanza" no encontrado.';
END;
$$ LANGUAGE plpgsql;

-- Obtener una balanza especifica
CREATE OR REPLACE FUNCTION obtener_balanza_por_id(p_id INT) 
RETURNS TABLE(
    nombre TEXT, 
    marca TEXT, 
    modelo TEXT, 
    serie TEXT, 
    img_url TEXT, 
    estado estado_equipo,
    ultima TIMESTAMPTZ, 
    id_lab INT, 
    codigo_balanza TEXT
) AS $$BEGIN
  RETURN QUERY 
  SELECT b.nombre, b.marca, b.modelo, b.serie, b.img_url, b.estado_calibracion, b.ultima_medicion, b.id_laboratorio, b.codigo 
  FROM "Balanza" as b 
  WHERE b.id_balanza = p_id;
END;$$ language plpgsql;

-- Obtener todas las balanzas

CREATE OR REPLACE FUNCTION obtener_balanzas() RETURNS TABLE (nombre TEXT, marca TEXT, modelo TEXT, serie TEXT, img_url TEXT,codigo TEXT, id_laboratorio INT,nombre_laboratorio TEXT) AS $$
BEGIN
  RETURN QUERY SELECT nombre,marca,modelo,serie,img_url,estado_calibracion,ultima_medicion,codigo,l.id_laboratorio,l.nombre FROM "Balanza" as b JOIN "Laboratorio" as l ON l.id_laboratorio=b.id_laboratorio;
END;
$$ LANGUAGE plpgsql;

-- Obtener balanzas por laboratorio

CREATE OR REPLACE FUNCTION obtener_balanzas_por_laboratorio(p_id_laboratorio INT) 
RETURNS TABLE(nombre TEXT, marca TEXT, modelo TEXT, serie TEXT, img_url TEXT,codigo TEXT, id_laboratorio INT,nombre_laboratorio TEXT) AS $$
BEGIN
  RETURN QUERY SELECT nombre,marca,modelo,serie,img_url,estado_calibracion,ultima_medicion,codigo,l.id_laboratorio,l.nombre FROM "Balanza" as b JOIN "Laboratorio" as l ON l.id_laboratorio=b.id_laboratorio WHERE l.id_laboratorio =p_id_laboratorio;
END;
$$ language plpgsql;

-- Funcion para el buscador de balanza de la pagina de inicio, solo devuelve el estado y la ultima_medicion
CREATE OR REPLACE FUNCTION buscador_balanza_por_codigo(p_codigo TEXT) 
RETURNS TABLE(estado_calibracion estado_equipo, ultima_medicion TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY SELECT estado_calibracion,ultima_medicion FROM "Balanza" WHERE codigo =p_codigo;
END;
$$ language plpgsql;

------ LABORATORIOS -------