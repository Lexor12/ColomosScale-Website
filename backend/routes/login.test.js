import { generarHash, verificarToken } from './login.js';
import jwt from 'jsonwebtoken';


describe('Pruebas unitarias para el módulo de Login', () => {
    
    // --- Grupo de pruebas para generarHash ---
    describe('Función generarHash', () => {
        test('Debería generar el hash SHA-256 correcto para una contraseña común', async () => {
            const texto = 'password123';
            // El hash esperado de antemano para 'password123' en SHA-256 es conocido:
            const hashEsperado = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';
            
            const resultado = await generarHash(texto);
            
            // Evaluae si el resultado es igual al esperado
            expect(resultado).toBe(hashEsperado);
        });

        test('Debería generar hashes diferentes para textos diferentes', async () => {
            const hash1 = await generarHash('textoA');
            const hash2 = await generarHash('textoB');
            
            expect(hash1).not.toBe(hash2);
        });
    });

    // --- Grupo de pruebas para verificarToken ---
    describe('Función verificarToken', () => {
        // Configurar temporalmente una variable de entorno para la firma
        beforeAll(() => {
            process.env.TOKEN_FIRMA_PASS = 'clave_secreta_prueba';
        });

        test('Debería retornar status: 0 si no se proporciona un token', () => {
            const resultado = verificarToken(null);
            expect(resultado).toEqual({ status: 0 });
        });

        test('Debería retornar status: 1 y los datos del usuario si el token es válido', () => {
            const payloadFalso = { id: 5, rol: 2 };
            // Crear un token real firmado con nuestra clave de prueba
            const tokenValido = jwt.sign(payloadFalso, process.env.TOKEN_FIRMA_PASS);

            const resultado = verificarToken(tokenValido);

            expect(resultado.status).toBe(1);
            // Comprobar que contenga los mismos datos que guardamos (puede traer propiedades de tiempo de expiración de JWT)
            expect(resultado.usuario).toMatchObject(payloadFalso);
        });

        test('Debería retornar status: 0 si el token está mal firmado o alterado', () => {
            const tokenInvalido = 'token.completamente.falso';
            const resultado = verificarToken(tokenInvalido);
            
            expect(resultado).toEqual({ status: 0 });
        });
    });
});