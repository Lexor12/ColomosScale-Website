import { crearToaster } from "./toaster.js";
const queryParams = window.location.search;//Sirve para obtener los parametros de a URL actual, es decir lo del id y el id
const urlParams = new URLSearchParams(queryParams);
const codigoBalanza = urlParams.get('id')
//De aqui en adelante son funciones basicas de todos los archivos
let datosBalanza;
let laboratorios;
async function verificarToken() {
    if(codigoBalanza===null){window.location.href='../pages/404.html';return;}
        try{
            const res = await fetch('http://127.0.0.1:3000/api/verificarToken',{credentials:'include'})
            const result = await res.json();
            if(result.status===0){
                window.location.href='../pages/notAuth.html'
                return;
            }
            if(result.usuario.rol>=2){
                const btnEditar = document.querySelector('.selector__editar__boton')
                btnEditar.style.display='block';
                btnEditar.addEventListener('click',()=>{
                    editarBalanza()
                })
                //Aqui vamos a meter la logica para redigirlo a otra pagina solo si es mayor que supervisor
            }
            if(result.usuario.rol>=3){
                const adminBtn = document.getElementById('btnAdmin');
                adminBtn.style.display="";
                adminBtn.addEventListener('click',()=>{
                    window.location.href='../pages/admin.html';
                })
            }
            datosBalanza = await obtenerValores(`balanza/${codigoBalanza}`)
            if(Object.keys(datosBalanza).length===0){
                window.location.href='../pages/404.html';
                return;
            }
            console.log(datosBalanza)
            laboratorios = await obtenerValores('laboratorio');
            
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
    const datosUsuario = await obtenerValores('usuario');
    nombre.textContent = datosUsuario.nombre_completo
    rol.textContent=datosUsuario.rol;
    imgPersona.src = '../assets/icons/user.svg'
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
async function cargarDatosBalanza() {
    const imagenBalanza = document.getElementById('ImagenBalanzaContenido');
    const nombreBalanza = document.getElementById('balanzaNombre');
    const laboratorio = document.getElementById('balanzaLaboratorio');
    const estado = document.getElementById('balanzaEstado')
    const ultimaMedicion =document.getElementById('balanzaUltimaMedición');
    const listaReportes = document.querySelector('.HistorialReportes__lista')
    const marca = document.getElementById('balanzaMarca')
    const modelo =document.getElementById('balanzaModelo');
    const serie = document.getElementById('balanzaSerie')
    const codigo = document.getElementById('balanzaCodigo')
    if(!datosBalanza.balanza.img_url)imagenBalanza.src ='../assets/logo/ic_logo_sin_fondo.png'
        else imagenBalanza.src = datosBalanza.balanza.img_url
    nombreBalanza.textContent=datosBalanza.balanza.nombre
    laboratorio.textContent=datosBalanza.balanza.nombre_laboratorio
    estado.textContent=datosBalanza.balanza.estado
    marca.textContent=datosBalanza.balanza.marca
    modelo.textContent=datosBalanza.balanza.modelo
    serie.textContent=datosBalanza.balanza.serie
    codigo.textContent=datosBalanza.balanza.codigo_balanza

    let fecha = new Date(datosBalanza.balanza.ultima);
    ultimaMedicion.textContent=fecha.toLocaleDateString('es-MX');
    listaReportes.innerHTML=''
    datosBalanza.reportes.forEach(reporte => {
        const nuevoElemento = document.createElement('div')
        nuevoElemento.classList.add('HistorialReportes__lista__elemento')

        const strongReporte = document.createElement('strong');
        strongReporte.textContent="ID Reporte: "
        const spanReporte =document.createElement('span')
        spanReporte.textContent=reporte.id_reporte;
        strongReporte.appendChild(spanReporte)
        nuevoElemento.appendChild(strongReporte)

        let fecha = new Date(reporte.fecha_analisis);
        const strongFecha = document.createElement('strong');
        strongFecha.textContent="Fecha: "
        const spanFecha=document.createElement('span')
        spanFecha.textContent=fecha.toLocaleDateString('es-MX');
        strongFecha.appendChild(spanFecha)
        nuevoElemento.appendChild(strongFecha)

        const strongRealizado = document.createElement('strong');
        strongRealizado.textContent="Realizado por: "
        const spanRealizado =document.createElement('span')
        spanRealizado.textContent=reporte.nombre_tecnico;
        strongRealizado.appendChild(spanRealizado)
        nuevoElemento.appendChild(strongRealizado)
        nuevoElemento.addEventListener('click',()=>{
            window.location.href=`../pages/reporte.html?id=${reporte.id_reporte}`
        })
        listaReportes.appendChild(nuevoElemento)
    });
}
async function cargarSelector() {
    const btnSalir = document.getElementById('btnVolver')
    btnSalir.addEventListener('click',()=>{
        window.location.href='../pages/dashboard.html'
    })
}
function editarBalanza(){
    const modal = document.querySelector('.modal')
    const modalAgregar = document.querySelector('.modal__editaragregar')
    const formulario = document.querySelector('.modal__editaragregar__formulario')
    const btnAceptar = modalAgregar.querySelector('.aceptar')
    const btnRechazar = modalAgregar.querySelector('.rechazar')
    //Borrar todo el contenido y sobre escribir
    const Balanza=datosBalanza.balanza
    modal.classList.add('activo')
    modalAgregar.classList.add('mostrar')
    const selectorLabs = document.querySelector('.campo__formulario__select')
    selectorLabs.innerHTML=''
    laboratorios.forEach(item =>{
        const option = document.createElement('option');
        option.value = item.id_laboratorio
        option.textContent = item.nombre
        selectorLabs.appendChild(option)
    })  
    selectorLabs.value=Balanza.id_lab;
    document.querySelector('.campo__formulario>input#nombre').value=Balanza.nombre
    document.querySelector('.campo__formulario>input#marca').value=Balanza.marca
    document.querySelector('.campo__formulario>input#modelo').value=Balanza.modelo
    document.querySelector('.campo__formulario>input#serie').value=Balanza.serie
    btnAceptar.addEventListener('click',editarElemento)
    btnRechazar.addEventListener('click',borrar)
    function borrar(){
        modal.classList.remove('activo')
        modalAgregar.classList.remove('mostrar')
        btnAceptar.removeEventListener('click',editarElemento)
        btnRechazar.removeEventListener('click',borrar)
    }
    async function editarElemento(){
        const datos = new FormData()
        formulario.querySelectorAll('input').forEach(input=>{
            if(input.type==='file' && input.files[0]){
                datos.append(input.id,input.files[0])
            }
            else{
                if(input.value){
                    datos.append(input.id,input.value)
                }
            }
        })
        datos.append('id_laboratorio',selectorLabs.value)
        
        await fetch(`http://127.0.0.1:3000/api/balanza/${Balanza.id}`,{method:'PATCH',credentials:'include',body:datos}).then(a=>a.json()).then(datos=>{
            const contenedor_toaster = document.querySelector('.toaster__contenedor');
            let tipo;
            let mensaje;
            switch(datos.status){
                case 1:
                    tipo='correcto'
                    mensaje=Object.values(datos.data[0])
                break;
                default: 
                    tipo='error'
                    mensaje=datos.error;
                break;
            }
            crearToaster(mensaje,contenedor_toaster,tipo,5)
        })
        datosBalanza = await obtenerValores(`balanza/${codigoBalanza}`)
        cargarDatosBalanza()
        borrar()
    }
}
async function iniciarPagina() {
    await verificarToken();
    await configurarNavBar();
    await cargarSelector();
    await cargarDatosBalanza();
    document.querySelector('body').classList.add('is-loaded');
}
window.addEventListener('load',iniciarPagina)
