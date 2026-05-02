import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import {sql,supabase} from './db.js'
import {iniciarSesion,generarHash} from './routes/login.js'
import { verificarToken } from './routes/login.js';
import jwt from 'jsonwebtoken'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import z from 'zod'
import cookieParser from 'cookie-parser';
import multer from 'multer'

const app = express()
const PORT = process.env.PORT;
const upload = multer({ storage: multer.memoryStorage() })//Hacemos que las imagenes siempre se guarden en formato de Bytes como un Buffer, esto es vital para mandarlo a supa
const limitadorGeneral = rateLimit(
    {
        windowMs:15*60*1000,//15 minutos de tiempo, decimos que tendremos el maximo es 50 peticiones cada 15 minutos
        max:120,
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
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    optionsSuccessStatus: 200,
    credentials: true//Para poder usar el sistema de cookies
}
const zodIniciarSesion = z.object({
    username: z.string().max(48), //Username de 3-48 caracteres
    password: z.string().max(256, "La contraseña no puede exceder los 256 caracteres").trim()//Contraseña de 8 a 256
})
const zodCodigoParam = z.object({
    codigo: z.string().min(3).max(48)//Los username de usuario son entre 3 a 48 y codigo de balanza deben ser de 12 caracteres [BAL-YYYY-NNNN], donde NNNN es un numero de 0 a 9999, es decir que un usuario puede poner hasta 10,000 balanzas en 1 año (mas que suficiente)
});

const zodReporteParams = z.object({
    numeroReporte: z.coerce.number().int().positive("El ID del reporte debe ser un número positivo")
});

const zodIdParam = z.object({
    id: z.coerce.number().int().nonnegative("El ID del reporte debe ser un número mayor a 0")
})
// --- Middlewares ---
app.use(helmet())
app.use(cors(opcionesCors));
app.use('/api/',limitadorGeneral);//Este limitador aplica para todas las apis que usemos
app.use(cookieParser())
app.use(express.json({ limit: '10kb' }));//Devuelve automaticamente cualquier formato string en JSON, ponemos un limitador de 10kb, para que nadie envie una solicitud demasiado grande

function autenticar(rolMinimo=1){
    function middleware(req,res,next){
        const statusToken = verificarToken(req.cookies.token);

        if(statusToken.status===0 || statusToken.usuario.rol<rolMinimo){
            return res.status(401).json({ status: 0, error: "No autorizado" });
        }
        req.usuario = statusToken.usuario
        next()
    }
    return middleware;
}

// --- END POINTS (RUTAS) ---
app.get('/api/buscador/:codigo',async(req,res)=>{
    const validacion =zodCodigoParam.safeParse(req.params);
    if(!validacion.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    try{
        const codigoBalanza = req.params.codigo;
        const data = await sql`SELECT * FROM buscador_balanza_por_codigo(${validacion.data.codigo})`;
        res.json(data)
    }catch{
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
        //res.json({status:1,token:token,resultado:resultado});
        res.cookie('token',token,{
            httpOnly:true,
            secure: true,//Solo para http, ****ATENCION!!!! HAY QUE PONER ESTO EN TRUE CUANDO SE SUBA A RAILWAY
            sameSite: 'strict',
            maxAge: 2 * 60 * 60 * 1000 // 2 horas para que caduque
        })
        res.json({status:1,resultado:resultado});
    }catch{
        return res.status(500).json({ status: 0, error: "Error interno del servidor" });
    }
})

app.get('/api/verificarToken',(req,res)=>{
    const token = req.cookies.token;
    if(!token)return res.status(403).json({status:0,error:"No hay token"});
    jwt.verify(token,process.env.TOKEN_FIRMA_PASS,(error,usuario)=>{
        if(error){
            return res.status(401).json({status:0,error:"Token expriado o inválido."});
        }
        res.json({status:1,usuario:usuario})
    })
})

app.get('/api/balanza',autenticar(1),async (req,res)=>{
    try{
        const data = await sql`SELECT * FROM obtener_balanzas()`;
        res.json({status:1,data:data})
    }catch{
        res.json({status:0,error:"Error al conectar a la Base de datos."})
    }
})

app.get('/api/laboratorio',autenticar(1),async(req,res)=>
{
    try{
        const data = await sql`SELECT * FROM obtener_laboratorios()`;
        res.json({status:1,data:data});
    }
    catch{
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})

app.get('/api/tecnico',autenticar(1),async(req,res)=>{
    const rol = req.usuario.rol==4?4:3
    try{
        const data = await sql`SELECT * FROM obtener_tecnicos(${rol})`;
        res.json({status:1,data:data})
    }
    catch{
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})

app.get('/api/tecnico/:codigo',autenticar(1),async(req,res)=>{
    const validacion =zodCodigoParam.safeParse(req.params);
    if(!validacion.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const codigo = validacion.data.codigo
    const rol = req.usuario.rol==4?4:3
    try{
        const usuario = await sql`SELECT * FROM obtener_usuario_por_username(${codigo})`;
        if(usuario[0].id_rol>rol)return res.status(401).json({status:0,error:"Error, su token no es adecuado."})
        const reportes = await sql`SELECT * FROM obtener_reportes_usuario(${usuario[0].id})`;
        let imgURL = usuario[0].img;
        if(imgURL){
            const {data}= await supabase.storage.from('user').createSignedUrl(imgURL,300);//30 minutos, ya que la api se crea y el usuario no creo que este mas de 10 minutos en la página
            usuario[0].img=data?.signedUrl
        }
        let data = {usuario:usuario[0],reportes:reportes};
        res.json({status:1,data:data})
    }
    catch{
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})

app.get('/api/balanza/:codigo',autenticar(1),async(req,res)=>{
    const validacion =zodCodigoParam.safeParse(req.params);
    if(!validacion.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const codigo = validacion.data.codigo
    try{
        const balanza = await sql`SELECT * FROM obtener_balanza_por_codigo(${codigo})`;
        const reportes = await sql`SELECT id_reporte,fecha_analisis,nombre_tecnico FROM obtener_reportes_balanza(${balanza[0].id})`;
        let result = {balanza:balanza[0],reportes:reportes}
        res.json({status:1,data:result});
    }
    catch{
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})
app.get('/api/reporte/:numeroReporte',autenticar(1),async(req,res)=>{
    const validacion =zodReporteParams.safeParse(req.params);
    if(!validacion.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const idReporte = validacion.data.numeroReporte
    try{
        const reporte = await sql`SELECT * FROM obtener_reporte(${idReporte})`
        const usuario = await sql`SELECT * FROM obtener_usuario_por_id(${reporte[0].id_usuario})`
        const balanza = await sql`SELECT * FROM obtener_balanza_por_id(${reporte[0].id_balanza})`
        res.json({status:1,data:{reporte:reporte[0],usuario:usuario[0],balanza:balanza[0]}})
    }
    catch{
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})

app.get('/api/usuario',autenticar(1),async(req,res)=>{
    try{
        const data = await sql`SELECT * FROM obtener_usuario_por_id(${req.usuario.id})`;
        return res.json({status:1,data:data[0]})
    }
    catch{
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})
app.delete('/api/usuario/:id',autenticar(3),async(req,res)=>{
    const validacion =zodIdParam.safeParse(req.params);
    if(!validacion.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const id = validacion.data.id
    if(req.usuario.id===id)return res.status(400).json({satus:-1,error:"No puede eliminarse a si mismo."})
    try{
        const consulta = await sql`SELECT * FROM eliminar_usuario(${id})`;
        res.json({status:consulta[0].status,data:[{mensaje:consulta[0].mensaje}]})
    }catch{
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})
app.patch('/api/usuario/:id',autenticar(3),upload.single('img'),async(req,res)=>{
    const validacion =zodIdParam.safeParse(req.params);
    if(!validacion.success)return res.status(400).json({satus:-1,error:"Error al identificar el usuario."})
    const zodUsuario = z.object({
        nombre:   z.string().min(1).max(100).optional(),
        username: z.string().min(3).max(48).optional(),
        correo:   z.string().email().optional(),
        password: z.string().min(8).max(256).optional(),//Al ser admin, lo mi
        rol:      z.enum(['TECNICO', 'SUPERVISOR', 'ADMIN']).optional().or(z.literal('')).transform(v => v === '' ? undefined : v)
    })
    const validacionBody = zodUsuario.safeParse(req.body)
    if(!validacionBody.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const imagen = req.file//Si no lo mando pues lo marca como indefinido
    const d = validacionBody.data
    const id = validacion.data.id
    let nombreArchivo = null;
    if(imagen){
        try{
            const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp','image/jpg']
        if(!tiposPermitidos.includes(imagen.mimetype))return res.status(400).json({ status: -1, error: "Tipo de imagen no permitido" })
        if(imagen.size > 6 * 1024 * 1024)return res.status(400).json({ status: -1, error: "Imagen muy pesada" })
        const extension = imagen.originalname.split('.').pop(); //Aqui separamos la extension y usarla, usamos pop para eliminar todo lo q es el nombre
        nombreArchivo=`avatar_${d.username}_${Date.now()}.${extension}`;

        const {data, error}= await supabase.storage.from('user').upload(nombreArchivo,imagen.buffer,{contentType:imagen.mimetype,upsert:true})
        if(error)return res.status(500).json({ status: 0, error: "Error al subir la imagen." });
        }catch{
            return res.status(500).json({status:0,error:"Error intentelo más tarde."})
        }
        
        //const {data, error}= await supabase.storage.from('user').createSignedUrl(nombreArchivo,3600);//Dura 1 hora activo, lo que es más que suficiente
    }
    const rol = {'TECNICO':1,'SUPERVISOR':2,'ADMIN':3}
    try{
        const consulta = await sql`SELECT * FROM actualizar_usuario(${id},${d.username?? null},${d.nombre??null},${d.correo??null},${d.password?await generarHash(d.password):null},${rol[d.rol]?? null},${nombreArchivo?nombreArchivo:null})`;
        res.json({status:1,data:consulta})
    }catch{
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})
app.post('/api/usuario',autenticar(3),upload.single('img'),async(req,res)=>{
    const zodUsuario = z.object({
        nombre:   z.string().min(1).max(100),
        username: z.string().min(3).max(48),
        correo:   z.string().email(),
        password: z.string().min(8).max(256),//Al ser admin, lo mi
        rol:      z.enum(['TECNICO', 'SUPERVISOR', 'ADMIN'])
    })
    const validacionBody = zodUsuario.safeParse(req.body)
    if(!validacionBody.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const imagen = req.file//Si no lo mando pues lo marca como indefinido
    const d = validacionBody.data
    let nombreArchivo = null;
    if(imagen){
        try{
            const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp','image/jpg']
        if(!tiposPermitidos.includes(imagen.mimetype))return res.status(400).json({ status: -1, error: "Tipo de imagen no permitido" })
        if(imagen.size > 6 * 1024 * 1024)return res.status(400).json({ status: -1, error: "Imagen muy pesada" })
        const extension = imagen.originalname.split('.').pop(); //Aqui separamos la extension y usarla, usamos pop para eliminar todo lo q es el nombre
        nombreArchivo=`avatar_${d.username}_${Date.now()}.${extension}`;

        const {data, error}= await supabase.storage.from('user').upload(nombreArchivo,imagen.buffer,{contentType:imagen.mimetype,upsert:true})
        if(error)return res.status(500).json({ status: 0, error: "Error al subir la imagen." });
        }catch{
            return res.status(500).json({status:0,error:"Error intentelo más tarde."})
        }
    }
    const rol = {'TECNICO':1,'SUPERVISOR':2,'ADMIN':3}
    try{
        const consulta = await sql`SELECT * FROM registrar_usuario(${d.username?? null},${d.nombre?? null},${d.correo?? null},${await generarHash(d.password)?? null},${rol[d.rol]?? null},${nombreArchivo?? null})`;
        res.json({status:1,data:consulta})
    }catch{
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})
app.delete('/api/balanza/:id',autenticar(3),async(req,res)=>{
    const validacion =zodIdParam.safeParse(req.params);
    if(!validacion.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const id = validacion.data.id
    try{
        const consulta = await sql`SELECT * FROM eliminar_balanza(${id})`;
        res.json({status:consulta[0].status,data:[{mensaje:consulta[0].mensaje}]})
    }catch{
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})
app.patch('/api/balanza/:id',autenticar(2),upload.single('img'),async(req,res)=>{
    const validacion =zodIdParam.safeParse(req.params);
    if(!validacion.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const zodBalanza = z.object({
        nombre:   z.string().min(1).max(100).optional(),
        marca:   z.string().min(1).max(100).optional(),
        modelo:   z.string().min(1).max(100).optional(),
        serie:   z.string().min(1).max(100).optional(),
        id_laboratorio: z.coerce.number().int().nonnegative().optional()//Para transformar a int si es string
    })
    const validacionBody = zodBalanza.safeParse(req.body)
    if(!validacionBody.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const imagen = req.file//Si no lo mando pues lo marca como indefinido
    const d = validacionBody.data
    const id = validacion.data.id
    let nombreArchivo = null;
    if(imagen){
        try{
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp','image/jpg']
        if(!tiposPermitidos.includes(imagen.mimetype))return res.status(400).json({ status: -1, error: "Tipo de imagen no permitido" })
        if(imagen.size > 6 * 1024 * 1024)return res.status(400).json({ status: -1, error: "Imagen muy pesada" })
        const extension = imagen.originalname.split('.').pop(); //Aqui separamos la extension y usarla, usamos pop para eliminar todo lo q es el nombre
        nombreArchivo=`balanza_${id}_${Date.now()}.${extension}`;
        const {data, error}= await supabase.storage.from('ColomosScale_img').upload(nombreArchivo,imagen.buffer,{contentType:imagen.mimetype,upsert:true})
        if(error){return res.status(500).json({ status: 0, error: "Error al subir la imagen." });}
        const {data:publicUrlData}= supabase.storage.from('ColomosScale_img').getPublicUrl(nombreArchivo);
        nombreArchivo = publicUrlData.publicUrl
        }catch{
            return res.status(500).json({status:0,error:"Error intentelo más tarde."})
        }
    }
    try{
        const consulta = await sql`SELECT * FROM actualizar_balanza(${id},${d.nombre?? null},${d.marca?? null},${d.modelo?? null},${d.serie?? null},${nombreArchivo},${d.id_laboratorio?? null})`;
        res.json({status:1,data:consulta})
    }catch{
        
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})
app.post('/api/balanza',autenticar(2),upload.single('img'),async(req,res)=>{
    const zodBalanza = z.object({
        nombre:   z.string().min(1).max(100),
        marca:   z.string().min(1).max(100),
        modelo:   z.string().min(1).max(100),
        serie:   z.string().min(1).max(100),
        id_laboratorio: z.coerce.number().int().nonnegative()//Para transformar a int si es string
    })
    const validacionBody = zodBalanza.safeParse(req.body)
    if(!validacionBody.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const imagen = req.file//Si no lo mando pues lo marca como indefinido
    const d = validacionBody.data
    let nombreArchivo = null;
    if(imagen){
        try{
            const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp','image/jpg']
        if(!tiposPermitidos.includes(imagen.mimetype))return res.status(400).json({ status: -1, error: "Tipo de imagen no permitido" })
        if(imagen.size > 6 * 1024 * 1024)return res.status(400).json({ status: -1, error: "Imagen muy pesada" })
        const extension = imagen.originalname.split('.').pop(); //Aqui separamos la extension y usarla, usamos pop para eliminar todo lo q es el nombre
        nombreArchivo=`balanza_${d.serie}_${Date.now()}.${extension}`;
        const {data, error}= await supabase.storage.from('ColomosScale_img').upload(nombreArchivo,imagen.buffer,{contentType:imagen.mimetype,upsert:true})
        if(error){return res.status(500).json({ status: 0, error: "Error al subir la imagen." });}
        const {data:publicUrlData}= supabase.storage.from('ColomosScale_img').getPublicUrl(nombreArchivo);
        nombreArchivo = publicUrlData.publicUrl
        }catch{
            return res.status(500).json({status:0,error:"Error intentelo más tarde."})
        }
    }
    try{
        const consulta = await sql`SELECT * FROM registrar_balanza(${d.nombre?? null},${d.marca?? null},${d.modelo?? null},${d.serie?? null},${nombreArchivo?? null},${d.id_laboratorio?? null})`;
        res.json({status:1,data:consulta})
    }catch{
        
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})
app.delete('/api/laboratorio/:id',autenticar(3),async(req,res)=>{
    const validacion =zodIdParam.safeParse(req.params);
    if(!validacion.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const id = validacion.data.id
    try{
        const consulta = await sql`SELECT * FROM eliminar_laboratorio(${id})`;
        res.json({status:consulta[0].status,data:[{mensaje:consulta[0].mensaje}]})
    }catch{
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})
app.patch('/api/laboratorio/:id',autenticar(3),upload.none(),async(req,res)=>{
    const validacion =zodIdParam.safeParse(req.params);
    if(!validacion.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const zodLaboratorio = z.object({
        nombre:   z.string().min(1).max(100).optional(),
        ubicacion: z.string().min(1).max(120).optional()
    })
    const validacionBody = zodLaboratorio.safeParse(req.body)
    if(!validacionBody.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const d = validacionBody.data
    const id = validacion.data.id
    try{
        const consulta = await sql`SELECT * FROM actualizar_laboratorio(${id},${d.nombre?? null},${d.ubicacion?? null})`;
        res.json({status:1,data:consulta})
    }catch{
        
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})
app.post('/api/laboratorio',autenticar(3),upload.none(),async(req,res)=>{
    const zodLaboratorio = z.object({
        nombre:   z.string().min(1).max(100),
        ubicacion: z.string().min(1).max(120)
    })
    const validacionBody = zodLaboratorio.safeParse(req.body)
    if(!validacionBody.success)return res.status(400).json({satus:-1,error:"Datos de solicitud inválidos"})
    const d = validacionBody.data
    try{
        const consulta = await sql`SELECT * FROM registrar_laboratorio(${d.nombre?? null},${d.ubicacion?? null})`;
        if(consulta=='')return res.json({status:1,error:"No se pudo registrar el laboratorio."})
        res.json({status:1,data:consulta})
    }catch{
        
        return res.status(500).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})
app.get('/api/admin',autenticar(3),async(req,res)=>{
    const rol = req.usuario.rol==4?4:3
    try{
        const usuarios = await sql`SELECT * FROM obtener_tecnicos_id(${rol})`;
        const laboratorios = await sql`SELECT * FROM obtener_laboratorios()`;
        const balanzas = await sql`SELECT * FROM obtener_balanzas()`;
        const reportes = await sql`SELECT * FROM obtener_reportes()`;
        const data = {usuarios:usuarios,laboratorios:laboratorios,balanzas:balanzas,reportes:reportes}
        return res.json({status:1,data:data})
    }catch{
        return res.status(401).json({status:0,error:"Error al conectar a la Base de datos."})
    }
})
app.post('/api/cerrarSesion',(req,res)=>{
    res.clearCookie('token',{
        httpOnly: true,
        secure: true,//Antes de publicarlo lo voy a cambiar
        sameSite: 'strict',
        path: '/'
    })
    res.json({status:1});
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