const queryParams = window.location.search;//Sirve para obtener los parametros de a URL actual, es decir lo del id y el id
const urlParams = new URLSearchParams(queryParams);
const codigoBalanza = urlParams.get('id')
//De aqui en adelante son funciones basicas de todos los archivos
const token = localStorage.getItem('token_colomos_scale');
let format = {headers:{'token':token}};
let datosBalanza;
async function verificarToken() {
    if(codigoBalanza===null)window.location.href='../pages/noEncontrada.html'
    if(!token)window.location.href='../pages/notAuth.html';
    else{
        try{
            const res = await fetch('http://localhost:3000/api/verificarToken',format)
            const result = await res.json();
            if(result.status===0){
                localStorage.removeItem('token_colomos_scale');
                window.location.href='../pages/notAuth.html'
            }
            if(result.usuario.rol>=2){
                const btnEditar = document.querySelector('.selector__editar__boton')
                btnEditar.style.display='block';
                btnEditar.addEventListener('click',()=>{
                    window.location.href=`../pages/editarBalanza.html?id=${codigoBalanza}`;
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
            datosBalanza = await obtenerValores(`obtenerBalanza/${codigoBalanza}`)
            if(Object.keys(datosBalanza).length===0){
                window.location.href='../pages/noEncontrada.html'
            }
        }catch(e){
            localStorage.removeItem('token_colomos_scale');
            window.location.href='../pages/notAuth.html'
        }
    }
}
async function configurarNavBar(){
    const botonSalir = document.getElementById('btnSalir')
    botonSalir.addEventListener('click',()=>{
        localStorage.removeItem('token_colomos_scale');
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
    imgPersona.src = datosUsuario.img
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
        const res = await fetch(`http://localhost:3000/api/${valor}`,format)
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
    imagenBalanza.src = datosBalanza.balanza.img_url
    nombreBalanza.textContent=datosBalanza.balanza.nombre
    laboratorio.textContent=datosBalanza.balanza.nombre_laboratorio
    estado.textContent=datosBalanza.balanza.estado
    marca.textContent=datosBalanza.balanza.marca
    modelo.textContent=datosBalanza.balanza.modelo
    serie.textContent=datosBalanza.balanza.serie
    codigo.textContent=datosBalanza.balanza.codigo_balanza

    let fecha = new Date(datosBalanza.balanza.ultima);
    ultimaMedicion.textContent=fecha.toLocaleDateString('es-MX');
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

async function iniciarPagina() {
    await verificarToken();
    await configurarNavBar();
    await cargarSelector();
    await cargarDatosBalanza();
    document.querySelector('body').classList.add('is-loaded');
}
window.addEventListener('load',iniciarPagina())