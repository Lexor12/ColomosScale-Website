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
CREATE OR REPLACE FUNCTION registrar_usuario(p_username TEXT,p_nombre_completo TEXT, p_correo TEXT,p_password TEXT,p_rol INT) RETURNS TEXT AS $$
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
CREATE OR REPLACE FUNCTION obtener_usuarios_por_correo(p_correo TEXT) 
RETURNS TABLE(username TEXT,nombre_completo TEXT, correo TEXT,password TEXT,fecha_creacion TIMESTAMPTZ,rol INT) AS $$
BEGIN
  RETURN QUERY SELECT username,nombre_completo,correo,password,fecha_creacion,rol FROM "Usuario" WHERE correo=p_correo;
END;
$$ language plpgsql;

CREATE OR REPLACE FUNCTION obtener_usuarios_por_username(p_username TEXT) 
RETURNS TABLE(username TEXT,nombre_completo TEXT, correo TEXT,password TEXT,fecha_creacion TIMESTAMPTZ,rol INT) AS $$
BEGIN
  RETURN QUERY SELECT username,nombre_completo,correo,password,fecha_creacion,rol FROM "Usuario" WHERE username=p_username;
END;
$$ language plpgsql;
-- OBTIENE TODOS LOS USUARIOS CON SUS ROLES (nombre del rol)
CREATE OR REPLACE FUNCTION obtener_usuarios() RETURNS TABLE (username TEXT,nombre_completo TEXT, correo TEXT,fecha_creacion TIMESTAMPTZ,rol TEXT) AS $$
BEGIN
  RETURN QUERY SELECT u.username,u.nombre_completo,u.correo,u.fecha_creacion,r.nombre FROM "Usuario" as u JOIN Rol r ON r.id_rol = u.rol;
END;
$$ LANGUAGE plpgsql;
--ACTUALIZAR LOS DATOS DE USUSARIO
CREATE OR REPLACE FUNCTION actualizar_usuario(p_id INT,p_username TEXT DEFAULT NULL,p_nombre_completo TEXT DEFAULT NULL,p_correo TEXT DEFAULT NULL,
p_password TEXT DEFAULT NULL,p_rol INT DEFAULT NULL
)
RETURNS TEXT AS $$
BEGIN
  UPDATE "Usuario"
  SET
    username = COALESCE(p_username, username),
    nombre_completo = COALESCE(p_nombre_completo, nombre_completo),
    correo = COALESCE(p_correo, correo),
    password = COALESCE(p_password, password),
    rol = COALESCE(p_rol, rol)
  WHERE id = p_id;
  RETURN 'Usuario actualizado';
END;
$$ LANGUAGE plpgsql;
-- Eliminar Usuario
CREATE OR REPLACE FUNCTION eliminar_usuario(p_id INT) RETURNS TEXT AS $$
BEGIN
  IF(SELECT 1 FROM "Usuario" WHERE id_usuario=id)THEN
    DELETE FROM "Usuario" WHERE id_usuario=p_id;
    RETURN "Usuario elimnado correctamente.";
  END IF;
  RETURN "Usuario no encontrado.";
END;
$$ LANGUAGE plpgsql;

----------------------- BALANZAS ---------------------------

-- CREAR O AGREGAR UNA BALANZA

CREATE OR REPLACE FUNCTION registrar_balanza(p_nombre TEXT, p_marca TEXT, p_modelo TEXT, p_serie TEXT, p_img_url TEXT, p_id_laboratorio INT) RETURNS TEXT AS $$
BEGIN 
  INSERT INTO Balanza(nombre,marca,modelo,serie,img_url,estado_calibracion,ultima_medicion,id_laboratorio) VALUES (p_nombre, p_marca, p_modelo, p_serie, p_img_url,'MALA',NOW(), p_id_laboratorio);
  RETURN 'Balanza registrada correctamente.';
END;
$$ LANGUAGE plpgsql;

-- ACTUALIZAR BALANZA

CREATE OR REPLACE FUNCTION actualizar_balanza(p_id INT,p_nombre TEXT DEFAULT NULL, p_marca TEXT DEFAULT NULL, p_modelo TEXT DEFAULT NULL, p_serie TEXT DEFAULT NULL, p_img_url TEXT DEFAULT NULL, p_id_laboratorio INT DEFAULT NULL) RETURNS TEXT AS $$
BEGIN 
  UPDATE Balanza
  SET
  nombre = COALESCE(p_nombre, nombre),
    marca = COALESCE(p_marca, marca),
    modelo = COALESCE(p_modelo, modelo),
    serie = COALESCE(p_serie, serie),
    img_url = COALESCE(p_img_url, img_url),
    id_laboratorio = COALESCE(p_id_laboratorio, id_laboratorio)
  WHERE id_balanza=p_id;
  RETURN 'Balanza actualizada correctamente.';
  IF NOT FOUND THEN
    RETURN 'No se encontró la balanza.';
  END IF;
END;
$$ LANGUAGE plpgsql;

