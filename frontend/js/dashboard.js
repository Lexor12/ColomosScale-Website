const nombre = document.getElementById('nombreUsuario') 
const rol = document.getElementById('rolUsuario') 
const imgPersona = document.querySelector('.navbar__about__img__element')
const elements = document.querySelector('.elements')//Hacemos referencia a todo nuestro contenedor de balanzas
const selectorLabs = document.querySelector('.selector__filtro__laboratorio')
const selectorEstado = document.querySelector('.selector__filtro__estado')
const buscador = document.querySelector('.selector__filtro__buscador')
let estados = ['ADECUADA','INTERMEDIA','MALA']
let balanzasOriginal = []

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
            }
            if(result.usuario.rol>=2){
                const botonAgregarBalanza = document.getElementById('agregarBalanza')
                botonAgregarBalanza.style.display='block';
                botonAgregarBalanza.addEventListener('click',()=>{
                    window.location.href='../pages/crearBalanza.html';
                })
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
function crearBalanzas(listaBalanzas){
    elements.replaceChildren();
    listaBalanzas.forEach(element => {
        const nuevoArticle = document.createElement('article');
        nuevoArticle.classList.add('elemento__balanza');

        const divImg = document.createElement('div');
        divImg.classList.add('elemento__balanza__img');
        nuevoArticle.appendChild(divImg);

        const img = document.createElement('img');
        img.classList.add('elemento__balanza__img__element')
        img.src = element.img_url;
        img.alt = `balanza`
        divImg.appendChild(img)

        const divContenido = document.createElement('div')
        divContenido.classList.add('elemento__balanza__content')
        nuevoArticle.appendChild(divContenido);

        const nombreParrafo = document.createElement('p');
        nombreParrafo.innerHTML="<b>Nombre de balanza:</b>";
        const nombreSpan = document.createElement('span');
        nombreSpan.classList.add('elemento__balanza__content__name')
        nombreSpan.textContent=element.nombre;
        nombreParrafo.appendChild(nombreSpan)
        divContenido.appendChild(nombreParrafo);

        const laboratorioParrafo = document.createElement('p');
        laboratorioParrafo.innerHTML="<b>Laboratorio:</b>"
        const LaboratorioSpan = document.createElement('span');
        LaboratorioSpan.classList.add('elemento__balanza__content__lab');
        LaboratorioSpan.textContent = element.nombre_laboratorio;
        laboratorioParrafo.appendChild(LaboratorioSpan);
        divContenido.appendChild(laboratorioParrafo)

        const codigoParrafo = document.createElement('p');
        codigoParrafo.innerHTML="<b>Código:</b>"
        const codigoSpan = document.createElement('span');
        codigoSpan.classList.add('elemento__balanza__content__code');
        codigoSpan.textContent = element.codigo;
        codigoParrafo.appendChild(codigoSpan);
        divContenido.appendChild(codigoParrafo)

        const estadoParrafo = document.createElement('p');
        estadoParrafo.innerHTML="<b>Calibración:</b>"
        const estadoSpan = document.createElement('span');
        estadoSpan.classList.add('elemento__balanza__content__estado');
        estadoSpan.textContent = element.estado_calibracion;
        estadoParrafo.appendChild(estadoSpan);
        divContenido.appendChild(estadoParrafo)

        const ultimaMedParrafo = document.createElement('p');
        ultimaMedParrafo.innerHTML="<b>Ultima medicion:</b>"
        const ultimaMedSpan = document.createElement('span');
        ultimaMedSpan.classList.add('elemento__balanza__content__name__last');
        const fecha = new Date(element.ultima_medicion);
        ultimaMedSpan.textContent = fecha.toLocaleDateString('es-MX');
        ultimaMedParrafo.appendChild(ultimaMedSpan);
        divContenido.appendChild(ultimaMedParrafo)
        elements.appendChild(nuevoArticle);

        nuevoArticle.addEventListener('dblclick',()=>{
            window.location.href=`../pages/balanza.html?id=${element.codigo}`
        })
    });
}
async function cargarBalanzas(){
    const datosUsuario = await obtenerValores('usuario')
    balanzasOriginal = await obtenerValores('balanza')
    nombre.textContent = datosUsuario.nombre_completo;
    rol.textContent = datosUsuario.rol;
    imgPersona.src = '../assets/icons/user.svg'
    const btnVerPerfil = document.querySelector('.navbar__about')
    btnVerPerfil.addEventListener('click',()=>{
        window.location.href=`../pages/infoUsuario.html?id=${datosUsuario.username}`
    })
    crearBalanzas(balanzasOriginal)
}
function manejarFiltros(){
    const lab = selectorLabs.value;
    const estado = selectorEstado.value;
    const texto = buscador.value.toLowerCase().trim();
    let resultado = balanzasOriginal;
    if (lab !== '') {
        resultado = resultado.filter(a => a.nombre_laboratorio === lab);
    }
    if (estado !== '') {
        resultado = resultado.filter(a => a.estado_calibracion === estado);
    }
    if (texto !== '') {
        resultado = resultado.filter(a => 
            a.nombre.toLowerCase().includes(texto) || 
            a.codigo.toLowerCase().includes(texto)
        );
    }
    crearBalanzas(resultado);
}
async function configurarSelector(){
    const laboratorios = await obtenerValores('laboratorio');
    laboratorios.forEach(item =>{
        const option = document.createElement('option');
        option.value = item.nombre
        option.textContent = item.nombre
        selectorLabs.appendChild(option)
    })  
    estados.forEach(a=>{
        const option = document.createElement('option')
        option.value = a
        option.textContent = a
        selectorEstado.appendChild(option)
    })
    selectorLabs.addEventListener('change', manejarFiltros);
    selectorEstado.addEventListener('change', manejarFiltros);
    buscador.addEventListener('input',manejarFiltros)
}
async function iniciarPagina() {
    await verificarToken(); 
    await cargarBalanzas(); 
    await configurarSelector();
    await configurarNavBar();
    document.querySelector('body').classList.add('is-loaded');
}

window.addEventListener('load',iniciarPagina)




