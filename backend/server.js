import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import sql from './db.js'
import {iniciarSesion} from './routes/login.js'
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
            process.env.TOKER_FIRMA_PASS,
            {expiresIn:'2h'}
        );
        res.json({status:1,token:token,resultado:resultado});
    }catch(e){
        console.log(e)
        return res.status(500).json({ status: 0, error: "Error interno del servidor" });
    }
})

app.get('/',(req,res)=>{
    res.send("Activo");
})
app.listen(PORT,()=>{
    console.log(`Servidor corriento en http://localhost:${PORT}`)
})