import {crearToaster} from './toaster.js'
const nombre = document.getElementById('nombreUsuario') 
const rol = document.getElementById('rolUsuario') 
const elements = document.querySelector('.elements')//Hacemos referencia a todo nuestro contenedor de balanzas
const buscador = document.querySelector('.selector__filtro__buscador')
let tecnicosOriginal = {}

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
        window.location.href='#'
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
            const res = await fetch('http://127.0.0.1:3000/api/verificarToken',{credentials:'include'})
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
        const res = await fetch(`http://127.0.0.1:3000/api/${valor}`,{credentials:'include'})
        const result = await res.json()
        return result.status===0? {}:result.data
    }
    catch(e)   {
        return {}
    }
}

async function cargarTecnicos(){
    tecnicosOriginal = await obtenerValores('tecnico')
    crearTecnicos(tecnicosOriginal)
}
async function  crearTecnicos(listaTecnicos) {
    elements.replaceChildren();
    listaTecnicos.forEach(tecnico => {
        const nuevoArticle = document.createElement('article')
        nuevoArticle.classList.add('elemento__tecnico')

        const divImg = document.createElement('div')
        divImg.classList.add('elemento__tecnico__img')
        nuevoArticle.appendChild(divImg)

        const img = document.createElement('img')
        img.src = '../assets/icons/user.svg'
        img.classList.add('elemento__tecnico__img__element')
        img.alt="Tecnico"
        divImg.appendChild(img)

        const divContenido = document.createElement('div')
        divContenido.classList.add('elemento__tecnico__content')
        nuevoArticle.appendChild(divContenido)

        const nombreParrafo = document.createElement('p');
        nombreParrafo.innerHTML="<b>Nombre completo: </b>";
        const nombreSpan = document.createElement('span');
        nombreSpan.classList.add('elemento__tecnico__content__name')
        nombreSpan.textContent=tecnico.nombre_completo;
        nombreParrafo.appendChild(nombreSpan)
        divContenido.appendChild(nombreParrafo);

        const correoParrafo = document.createElement('p');
        correoParrafo.innerHTML="<b>Correo: </b>"
        const correoSpan = document.createElement('span');
        correoSpan.classList.add('elemento__tecnico__content__correo');
        correoSpan.textContent = tecnico.correo;
        correoParrafo.appendChild(correoSpan);
        divContenido.appendChild(correoParrafo)

        const rolParrafo = document.createElement('p');
        rolParrafo.innerHTML="<b>Rol: </b>"
        const rolSpan = document.createElement('span');
        rolSpan.classList.add('elemento__balanza__content__rol');
        rolSpan.textContent = tecnico.rol;
        rolParrafo.appendChild(rolSpan);
        divContenido.appendChild(rolParrafo)

        const fechaParrafo = document.createElement('p');
        fechaParrafo.innerHTML="<b>Fecha de ingreso: </b>"
        const fechaSpan = document.createElement('span');
        fechaSpan.classList.add('elemento__tecnico__content__fecha');
        let fecha = new Date(tecnico.fecha_creacion)
        fechaSpan.textContent = fecha.toLocaleDateString('es-MX');
        fechaParrafo.appendChild(fechaSpan);
        divContenido.appendChild(fechaParrafo)
        elements.appendChild(nuevoArticle)

        nuevoArticle.addEventListener('dblclick',()=>{
            window.location.href=`../pages/infoUsuario.html?id=${tecnico.username}`
        })
    });
}
function filtrar(){
    const texto = buscador.value.toLowerCase().trim();
    let nuevaLista = tecnicosOriginal.filter(tecnico=>tecnico.nombre_completo.toLowerCase().trim().includes(texto));
    if(nuevaLista.length===0){
        const toaster__contenedor = document.querySelector('.toaster__contenedor')
        crearToaster("No existe ningún usuario con tal descripción.",toaster__contenedor,'info',2)
    }
    crearTecnicos(nuevaLista)
}

function configurarSelector(){
    buscador.addEventListener('input',filtrar)
}

async function iniciarPagina() {
    await verificarToken(); 
    await configurarNavBar();
    await cargarTecnicos();
    configurarSelector();
    document.querySelector('body').classList.add('is-loaded');
}

window.addEventListener('load',iniciarPagina)




