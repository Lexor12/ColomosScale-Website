const parametrosDeConsulta = window.location.search//Obtiene de la url los parametros, es decir ?id=...
const parametrosDeURL = new URLSearchParams(parametrosDeConsulta);
const numeroReporte = parametrosDeURL.get('id');

let valoresDeConsulta = {}

async function verificarToken() {
    if(numeroReporte===null){window.location.href='../pages/404.html';
    return;}
        try{
            const res = await fetch('http://127.0.0.1:3000/api/verificarToken',{credentials:'include'})
            const result = await res.json();
            if(result.status===0){
                window.location.href='../pages/notAuth.html'
                return;
            }
            if(result.usuario.rol>=3){
                const adminBtn = document.getElementById('btnAdmin');
                adminBtn.style.display="";
                adminBtn.addEventListener('click',()=>{
                    window.location.href='../pages/admin.html';
                })
            }
            valoresDeConsulta = await obtenerValores(`reporte/${numeroReporte}`)
            if(Object.keys(valoresDeConsulta).length===0){
                window.location.href='../pages/404.html';
                return;
            }
            console.log(valoresDeConsulta)
        }catch(e){
            window.location.href='../pages/notAuth.html'
        }
    }
async function configurarNavBar(){
    const botonSalir = document.getElementById('btnSalir')
    botonSalir.addEventListener('click',async()=>{
        await fetch('http://127.0.0.1:3000/api/cerrarSesion', {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href='../index.html'
    })
    const btnDashboard = document.getElementById('btnDashboard');
    btnDashboard.addEventListener('click',()=>{
        window.location.href='../pages/dashboard.html'
    })
    const btnTecnicos = document.getElementById('btnTecnicos');
    btnTecnicos.addEventListener('click',()=>{
        window.location.href='../pages/tecnico.html'
    })
    const nombre = document.getElementById('nombreUsuario')
    const rol = document.getElementById('rolUsuario')
    const imgPersona = document.querySelector('.navbar__about__img__element')
    const infoUsuario = await obtenerValores('usuario');
    nombre.textContent = infoUsuario.nombre_completo
    rol.textContent=infoUsuario.rol;
    imgPersona.src = infoUsuario.img
    const btnVerPerfil = document.querySelector('.navbar__about')
    btnVerPerfil.addEventListener('click',()=>{
        window.location.href=`../pages/infoUsuario.html?id=${infoUsuario.username}`
    })
    const btnPaginaInicio = document.querySelector('.navbar__icon__img')
    btnPaginaInicio.style.cursor='pointer'
    btnPaginaInicio.addEventListener('click',()=>{
        window.location.href=`../index.html`
    })
}

async function obtenerValores(valor){
    try{
        const res = await fetch(`http://127.0.0.1:3000/api/${valor}`,{credentials:'include'})
        const result = await res.json()
        return result.status===0? {}:result.data
    }
    catch(e)   {
        return {}
    }
}
//De aqui para atras son funciones basicas de todos los archivos

function cargarPagina(){
    const nombreBalanza = document.querySelector('.elements__info__report__balanza__nombre')
    const codigoBalanza = document.querySelector('.elements__info__report__balanza__codigo')
    const laboratorioBalanza = document.querySelector('.elements__info__report__balanza__laboratorio')
    const fechaReporte = document.querySelector('.elements__info__report__reporte__fecha')
    const numeroReporte = document.querySelector('.elements__info__report__reporte__numero')
    const nombreUsuario = document.querySelector('.elements__info__report__usuario__nombre')
    const rolUsuario = document.querySelector('.elements__info__report__usuario__rol')
    const correoUsuario = document.querySelector('.elements__info__report__usuario__correo')

    const estadoReporte = document.querySelector('.elements__report__status__estado')
    const emtReporte = document.querySelector('.elements__report__status__emt')
    
    const excentricidad = document.querySelector('.elements__report__table__contenido__excentricidad')
    const rep100 = document.querySelector('.elements__report__table__contenido__rep100')
    const rep50 = document.querySelector('.elements__report__table__contenido__rep50')
    const linealidad = document.querySelector('.elements__report__table__contenido__linealidad')

    const observaciones = document.querySelector('.elements__report__obs__texto')

    const imagen = document.querySelector('.elements__info__image__element')

    nombreBalanza.textContent=valoresDeConsulta.balanza.nombre
    codigoBalanza.textContent=valoresDeConsulta.balanza.codigo_balanza
    laboratorioBalanza.textContent=valoresDeConsulta.balanza.laboratorio
    let fecha = new Date(valoresDeConsulta.reporte.fecha_analisis)
    fechaReporte.textContent= fecha.toLocaleDateString('es-MX')
    numeroReporte.textContent=valoresDeConsulta.reporte.id_reporte
    nombreUsuario.textContent=valoresDeConsulta.usuario.nombre_completo
    rolUsuario.textContent=valoresDeConsulta.usuario.rol
    correoUsuario.textContent=valoresDeConsulta.usuario.correo

    estadoReporte.textContent=valoresDeConsulta.reporte.estado_final
    emtReporte.textContent=valoresDeConsulta.reporte.cumple_emt?"CUMPLE":"NO CUMPLE"
    imagen.src=valoresDeConsulta.balanza.img_url
    excentricidad.textContent=valoresDeConsulta.reporte.excentricidad_promedio
    rep100.textContent=valoresDeConsulta.reporte.repetibilidad_100
    rep50.textContent=valoresDeConsulta.reporte.repetibilidad_50
    linealidad.textContent=valoresDeConsulta.reporte.linealidad_promedio

    observaciones.textContent=valoresDeConsulta.reporte.observaciones===""?"Sin observaciones durante el analisis.":valoresDeConsulta.reporte.observaciones
    // Agrega esto al final de tu función cargarPagina() o en iniciarPagina()
    const btnDescargarPDF = document.querySelector('.elements__info__pdf');
    let fechaActual = new Date().toLocaleDateString('es-MX')
    document.querySelector('.print__datos__fecha').textContent=fechaActual
    btnDescargarPDF.addEventListener('click', () => {
        window.print();
    });
}

async function iniciarPagina(){
    await verificarToken();
    await configurarNavBar();
    cargarPagina();
    document.querySelector('body').classList.add('is-loaded');
}
window.addEventListener('load',iniciarPagina)
