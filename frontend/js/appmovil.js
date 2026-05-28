import {crearToaster} from './toaster.js'
const nombre = document.getElementById('nombreUsuario') 
const rol = document.getElementById('rolUsuario') 

async function configurarNavBar(){
    const botonSalir = document.getElementById('btnSalir')
    botonSalir.addEventListener('click',async()=>{
        await fetch('https://colomosscale-website-production.up.railway.app/api/cerrarSesion', {
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
    const btnLaboratorios = document.getElementById('btnLaboratorios');
    btnLaboratorios.addEventListener('click',()=>{
        window.location.href='../pages/laboratorios.html'
    })
    const btnAppMovil = document.getElementById('btnAppMovil');
    btnAppMovil.addEventListener('click',()=>{
        window.location.href='../pages/appmovil.html'
    })
    const nombre = document.getElementById('nombreUsuario')
    const rol = document.getElementById('rolUsuario')
    const img  = document.querySelector('.navbar__about__img__element')
    const datosUsuario = await obtenerValores('usuario')
    nombre.textContent = datosUsuario.nombre_completo
    rol.textContent=datosUsuario.rol
    img.src = '../assets/icons/user.svg'
    const btnVerPerfil = document.querySelector('.navbar__about')
    btnVerPerfil.addEventListener('click',()=>{
        window.location.href=`../pages/infoUsuario.html?id=${datosUsuario.username}`
    })
    const btnPaginaInicio = document.querySelector('.navbar__icon__img')
    btnPaginaInicio.style.cursor='pointer'
    btnPaginaInicio.addEventListener('click',()=>{
        window.location.href=`../index.html`
    })
}

async function verificarToken() {
        try{
            const res = await fetch('https://colomosscale-website-production.up.railway.app/api/verificarToken',{credentials:'include'})
            const result = await res.json();
            if(result.status===0){
                window.location.href='../pages/notAuth.html'
                return
            }
            if(result.usuario.rol>=3){
                const adminBtn = document.getElementById('btnAdmin');
                adminBtn.style.display="";
                adminBtn.addEventListener('click',()=>{
                    window.location.href='../pages/admin.html';
                })
            }
        }catch(e){
            window.location.href='../pages/notAuth.html'
        }
}

async function obtenerValores(valor){
    try{
        const res = await fetch(`https://colomosscale-website-production.up.railway.app/api/${valor}`,{credentials:'include'})
        const result = await res.json()
        return result.status===0? {}:result.data
    }
    catch(e)   {
        return {}
    }
}

function inicializarEventos(){
    const btnAppMovil = document.getElementById('btnDescargarApk');
    btnAppMovil.addEventListener('click',()=>{descargarApp()})
}

function descargarApp(){
    const contenedor_toaster = document.querySelector('.toaster__contenedor');
    crearToaster("Por el momento esta funcionalidad no esta activa.",contenedor_toaster,'info',1.5)
}

async function iniciarPagina() {
    await verificarToken(); 
    await configurarNavBar();
    inicializarEventos();
    document.querySelector('body').classList.add('is-loaded');
}

window.addEventListener('load',iniciarPagina)