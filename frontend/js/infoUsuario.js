const parametrosDeConsulta = window.location.search//Obtiene de la url los parametros, es decir ?id=...
const parametrosDeURL = new URLSearchParams(parametrosDeConsulta);
const usernameUsuario = parametrosDeURL.get('id');

let valoresDeConsulta = {}
let datosUsuario ={}
async function verificarToken() {
    if(usernameUsuario===null){window.location.href='../pages/404.html';return;}
        try{
            const res = await fetch('http://127.0.0.1:3000/api/verificarToken',{credentials:'include'})
            const result = await res.json();
            if(result.status===0){
                window.location.href='../pages/notAuth.html'
            }
            if(result.usuario.rol>=3){
                const adminBtn = document.getElementById('btnAdmin');
                adminBtn.style.display="";
                adminBtn.addEventListener('click',()=>{
                    window.location.href='../pages/admin.html';
                })
            }
            valoresDeConsulta = await obtenerValores(`tecnico/${usernameUsuario}`)
            if(Object.keys(valoresDeConsulta).length===0){
                window.location.href='../pages/404.html';
                return;
            }
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
    imgPersona.src = '../assets/icons/user.svg'
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
    datosUsuario = valoresDeConsulta.usuario
    const btnVolver = document.getElementById('btnVolver');
    btnVolver.addEventListener('click',()=>{
        window.location.href='../pages/tecnico.html'
    })
    const img = document.querySelector('.ImagenTecnico__elemento');
    if(!datosUsuario.img) img.src='../assets/icons/user.svg'
    else img.src = datosUsuario.img
    const nombre = document.querySelector('.InfoTecnico__General__nombre')
    nombre.textContent=datosUsuario.nombre_completo
    const correo = document.querySelector('.InfoTecnico__General__correo')
    correo.textContent=datosUsuario.correo
    const fecha = document.querySelector('.InfoTecnico__General__fecha')
    let formatoFecha = new Date(datosUsuario.fecha_creacion)
    fecha.textContent = formatoFecha.toLocaleDateString('es-MX')
    const rol = document.querySelector('.InfoTecnico__General__rol')
    rol.textContent=datosUsuario.nombre_rol
    const reportes = document.querySelector('.InfoTecnico__reportes')
    valoresDeConsulta.reportes.forEach(reporte=>{
        const nuevoDiv = document.createElement('div')
        nuevoDiv.classList.add('InfoTecnico__reportes__elemento')
        
        const strongNombre = document.createElement('strong')
        strongNombre.innerHTML='Nombre balanza: ';
        nuevoDiv.appendChild(strongNombre)
        const spanNombre = document.createElement('span');
        spanNombre.textContent = reporte.nombre_balanza;
        strongNombre.appendChild(spanNombre)

        const strongReporte = document.createElement('strong')
        strongReporte.innerHTML='ID Reporte: ';
        nuevoDiv.appendChild(strongReporte)
        const spanReporte = document.createElement('span');
        spanReporte.textContent = reporte.id_reporte;
        strongReporte.appendChild(spanReporte)

        const strongFecha = document.createElement('strong')
        strongFecha.innerHTML='Fecha de reporte: ';
        nuevoDiv.appendChild(strongFecha)
        const spanFecha = document.createElement('span');
        let fecha = new Date(reporte.fecha_analisis)
        spanFecha.textContent = fecha.toLocaleDateString('es-MX');
        strongFecha.appendChild(spanFecha)
        
        nuevoDiv.addEventListener('click',()=>{
            window.location.href=`../pages/reporte.html?id=${reporte.id_reporte}`
        })
        reportes.appendChild(nuevoDiv);
    })
}

async function iniciarPagina(){
    await verificarToken();
    await configurarNavBar();
    cargarPagina();
    document.querySelector('body').classList.add('is-loaded');
}
window.addEventListener('load',iniciarPagina)
