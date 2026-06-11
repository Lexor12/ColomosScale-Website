import z from 'zod';

// Replicamos tus esquemas de server.js para la prueba
const zodIniciarSesion = z.object({
    username: z.string().max(48),
    password: z.string().max(256)
});

const zodCodigoParam = z.object({
    codigo: z.string().min(3).max(48)
});

describe('Pruebas de Validación de Datos con Zod', () => {
    test('Debería aceptar un inicio de sesión válido', () => {
        const datosValidos = { username: 'nadya', password: 'password123' };
        const resultado = zodIniciarSesion.safeParse(datosValidos);
        expect(resultado.success).toBe(true);
    });

    test('Debería rechazar un password que exceda los 256 caracteres', () => {
        const passwordLargo = 'a'.repeat(257);
        const datosInvalidos = { username: 'kenneth', password: passwordLargo };
        const resultado = zodIniciarSesion.safeParse(datosInvalidos);
        expect(resultado.success).toBe(false);
    });

    test('Debería rechazar un código de balanza menor a 3 caracteres', () => {
        const parametroInvalido = { codigo: 'BA' };
        const resultado = zodCodigoParam.safeParse(parametroInvalido);
        expect(resultado.success).toBe(false);
    });
});