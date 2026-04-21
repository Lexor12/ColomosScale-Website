import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import sql from './db.js'
import {iniciarSesion} from './routes/login.js'
import { verificarToken } from './routes/login.js';
import jwt from 'jsonwebtoken'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import z from 'zod'


const app = express()
const PORT = process.env.PORT;

const limitadorGeneral = rateLimit(
    {
        windowMs:15*60*1000,//15 minutos de tiempo, decimos que tendremos el maximo es 50 peticiones cada 15 minutos
        max:100,
        message:{status:-1,error:"Demasiadas peticiones, intentelo más tarde."}
    })
    const limitadorInicioDeSesion = rateLimit(
    {
        windowMs:15*60*1000,//15 minutos de tiempo, decimos que tendremos el maximo es 10 peticiones cada 15 minutos para el modulo de iniciar sesion
        max:10,
        message:{status:-1,error:"Demasiadas peticiones, intentelo más tarde."}
    })
const opcionesCors = {
    origin: ['http://localhost','https://colomoscale.app','http://127.0.0.1:5501'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    optionsSuccessStatus: 200
}
const zodIniciarSesion = z.object({
    username: z.string().max(48), //Username de 3-48 caracteres
    password: z.string().max(256, "La contraseña no puede exceder los 256 caracteres").trim()//Contraseña de 8 a 256
})
const zodCodigoParam = z.object({
    codigo: z.string().min(3).max(48)//Los username son entre 3 a 48 y codigo de balanza deben ser de 48 caracteres
});

const zodReporteParams = z.object({
    numeroReporte: z.coerce.number().int().positive("El ID del reporte debe ser un número positivo")
});
// --- Middlewares ---
app.use(helmet())
app.use(cors(opcionesCors));
app.use('/api/',limitadorGeneral);//Este limitador aplica para todas las apis que usemos
app.use(express.json());//Devuelve automaticamente cualquier formato string en JSON
// --- END POINTS (RUTAS) ---
app.get('/api/buscador/:codigo',async(req,res)=>{
    const validacion =zodCodigoParam.safeParse(req.params);
    if(!validacion.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    try{
        const codigoBalanza = req.params.codigo;
        const data = await sql`SELECT * FROM buscador_balanza_por_codigo(${validacion.data.codigo})`;
        res.json(data)
    }catch(e){
        res.status(500).json({error: "Error interno del servidor"});
    }
});

app.post('/api/iniciarSesion',limitadorInicioDeSesion,async(req,res)=>{
    const validacion = zodIniciarSesion.safeParse(req.body)
    if(!validacion.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const {username,password} = validacion.data
    const resultado = await iniciarSesion(username,password);
    
    if(Object.keys(resultado).length==0){
        return res.status(401).json({status:0,error:"Usuario o contraseña incorrectos"})
    }
    try{
        const token = jwt.sign(
            {id:resultado.id_res,rol:resultado.rol_res},
            process.env.TOKEN_FIRMA_PASS,
            {expiresIn:'2h'}
        );
        res.json({status:1,token:token,resultado:resultado});
    }catch(e){
        return res.status(500).json({ status: 0, error: "Error interno del servidor" });
    }
})

app.get('/api/verificarToken',(req,res)=>{
    const token = req.header('token');
    if(!token)return res.status(403).json({status:0,error:"No hay token"});
    jwt.verify(token,process.env.TOKEN_FIRMA_PASS,(error,usuario)=>{
        if(error){
            return res.status(401).json({status:0,error:"Token expriado o inválido."});
        }
        res.json({status:1,usuario:usuario})
    })
})

app.get('/api/obtenerBalanzas',async (req,res)=>{
    const token = req.header('token');//Siempre mandaremos en el header el token
    const statusToken = verificarToken(token).status;
    if(statusToken===0)return res.status(401).json({status:0,error:"Error, su token no es adecuado."});
    try{
        const data = await sql`SELECT * FROM obtener_balanzas()`;
        res.json({status:1,data:data})
    }catch(e){
        res.json({status:0,error:"Error al conectar a la Base de datos."})
    }
})

app.get('/api/obtenerLaboratorios',async(req,res)=>
{
    const token = req.header('token');
    const tokenStatus = verificarToken(token);
    if(tokenStatus.status===0) return res.status(401).json({status:0,error:"Error, su token no es adecuado."})
    try{
        const data = await sql`SELECT * FROM obtener_laboratorios()`;
        res.json({status:1,data:data});
    }
    catch(e){
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})

app.get('/api/obtenerTecnicos',async(req,res)=>{
    const token = req.header('token');
    const statusToken = verificarToken(token);
    if(statusToken.status===0)return res.status(401).json({status:0,error:"Error, su token no es adecuado."})
    const rol = statusToken.usuario.rol==4?4:3
    try{
        const data = await sql`SELECT * FROM obtener_tecnicos(${rol})`;
        res.json({status:1,data:data})
    }
    catch(e){
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})

app.get('/api/obtenerTecnico/:codigo',async(req,res)=>{
    const token = req.header('token');
    const statusToken = verificarToken(token);
    if(statusToken.status===0)return res.status(401).json({status:0,error:"Error, su token no es adecuado."})

    const validacion =zodCodigoParam.safeParse(req.params);
    if(!validacion.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const codigo = validacion.data.codigo
    const rol = statusToken.usuario.rol==4?4:3
    try{
        const usuario = await sql`SELECT * FROM obtener_usuario_por_username(${codigo})`;
        if(usuario[0].id_rol>rol)return res.status(401).json({status:0,error:"Error, su token no es adecuado."})
        const reportes = await sql`SELECT * FROM obtener_reportes_usuario(${usuario[0].id})`;
        let data = {usuario:usuario[0],reportes:reportes};
        res.json({status:1,data:data})
    }
    catch(e){
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})

app.get('/api/obtenerBalanza/:codigo',async(req,res)=>{
    const token = req.header('token');
    const statusToken = verificarToken(token);
    if(statusToken.status===0)return res.status(401).json({status:0,error:"Error, su token no es adecuado."})

    const validacion =zodCodigoParam.safeParse(req.params);
    if(!validacion.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const codigo = validacion.data.codigo
    
    try{
        const balanza = await sql`SELECT * FROM obtener_balanza_por_codigo(${codigo})`;
        const reportes = await sql`SELECT id_reporte,fecha_analisis,nombre_tecnico FROM obtener_reportes_balanza(${balanza[0].id})`;
        let result = {balanza:balanza[0],reportes:reportes}
        res.json({status:1,data:result});
    }
    catch(e){
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})
app.get('/api/reporte/:numeroReporte',async(req,res)=>{
    const token =  req.header('token')
    const statusToken = verificarToken(token);
    if(statusToken.status===0)return res.status(401).json({status:0,error:"Error, su token no es adecuado."})
    
    const validacion =zodReporteParams.safeParse(req.params);
    if(!validacion.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const idReporte = validacion.data.numeroReporte
    try{
        const reporte = await sql`SELECT * FROM obtener_reporte(${idReporte})`
        const usuario = await sql`SELECT * FROM obtener_usuario_por_id(${reporte[0].id_usuario})`
        const balanza = await sql`SELECT * FROM obtener_balanza_por_id(${reporte[0].id_balanza})`
        res.json({status:1,data:{reporte:reporte[0],usuario:usuario[0],balanza:balanza[0]}})
    }
    catch(e){
        ('f')
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})

app.get('/api/usuario',async(req,res)=>{
    const token = req.header('token');
    const tokenresult = verificarToken(token)
    const statusToken = tokenresult.status;
    if(statusToken===0)return res.status(401).json({status:0,error:"Error, su token no es adecuado."})
    try{
        const data = await sql`SELECT * FROM obtener_usuario_por_id(${tokenresult.usuario.id})`;
        return res.json({status:1,data:data[0]})
    }
    catch(e){
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})

app.get('/',(req,res)=>{
    res.send("Activo");
})
app.use((req, res) => {
    res.status(404).json({ status: 0, error: "Ruta no encontrada" })
})
app.listen(PORT,()=>{
    console.log(`Servidor corriento en http://localhost:${PORT}`)
})