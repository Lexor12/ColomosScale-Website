import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import sql from './db.js'
import {iniciarSesion} from './routes/login.js'
import { verificarToken } from './routes/login.js';
import jwt from 'jsonwebtoken'

const app = express()
const PORT = process.env.PORT;
// --- Middlewares ---
app.use(cors());
app.use(express.json());//Devuelve automaticamente cualquier formato string en JSON
// --- END POINTS (RUTAS) ---
app.get('/api/buscador/:codigo',async(req,res)=>{
    try{
        const codigoBalanza = req.params.codigo;
        const data = await sql`SELECT * FROM buscador_balanza_por_codigo(${codigoBalanza})`;
        res.json(data)
    }catch(e){
        res.status(500).json({error: "Error interno del servidor"});
    }
});

app.post('/api/iniciarSesion',async(req,res)=>{
    const {username,password} = req.body
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
        console.log(e)
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
        return res.status(401).json({status:0,error:"Error al conectar a la base de datos."})
    }
})
app.get('/api/obtenerBalanza/:codigo',async(req,res)=>{
    const token = req.header('token');
    const statusToken = verificarToken(token);
    const codigo = req.params.codigo
    if(statusToken.status===0)return res.status(401).json({status:0,error:"Error, su token no es adecuado."})
    try{
        const balanza = await sql`SELECT * FROM obtener_balanza_por_codigo(${codigo})`;
        const reportes = await sql`SELECT id_reporte,fecha_analisis,nombre_tecnico FROM obtener_reportes_balanza(${balanza[0].id})`;
        let result = {balanza:balanza[0],reportes:reportes}
        res.json({status:1,data:result});
    }
    catch(e){
        return res.status(401).json({status:0,error:"Error al conectar a la base de datos."})
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
        return res.status(401).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})

app.get('/',(req,res)=>{
    res.send("Activo");
})
app.listen(PORT,()=>{
    console.log(`Servidor corriento en http://localhost:${PORT}`)
})