import {sql} from '../db.js'
import jwt from 'jsonwebtoken'


export async function iniciarSesion(username,password){
    let passhashed = await generarHash(password)
    try{
        const data = await sql`SELECT * FROM iniciar_sesion(${username},${passhashed})`;
        if(data.length===0)return{};
        if(data[0].id_res ==-1 || data[0].rol_res==-1)return {}
        return data[0]
    }
    catch(e){
        return {}
    }
}

export async function generarHash(mensaje) {
    const enconder = new TextEncoder();
    const data = enconder.encode(mensaje);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}


export function verificarToken(token){
    if(!token)return {status:0}
    try {
        const usuario = jwt.verify(token, process.env.TOKEN_FIRMA_PASS);
        return { status: 1, usuario }; 
    } catch (error) {
        return { status: 0 };
    }
}