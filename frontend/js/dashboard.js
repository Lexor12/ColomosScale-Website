const token = localStorage.getItem('token_colomos_scale');
let format = {headers:{'token':token}};

const nombre = document.getElementById('nombreUsuario') 
const rol = document.getElementById('rolUsuario') 
const elements = document.querySelector('.elements')//Hacemos referencia a todo nuestro contenedor de balanzas

async function verificarToken() {
    if(!token)window.location.href='../pages/notAuth.html';
    else{
        try{
            const res = await fetch('http://localhost:3000/api/verificarToken',format)
            const result = await res.json();
            if(result.status===0){
                localStorage.removeItem('token_colomos_scale');
                window.location.href='../pages/notAuth.html'
            }
        }catch(e){
            localStorage.removeItem('token_colomos_scale');
            window.location.href='../pages/notAuth.html'
        }
    }
}

async function obtenerValores(valor){
    try{
        const res = await fetch(`http://localhost:3000/api/${valor}`,format)
        const result = await res.json()
        return result.status===0? {}:result.data
    }
    catch(e)   {
        console.log(e);
        return {}
    }
}

async function cargarBalanzas(){
    const datosUsuario = await obtenerValores('usuario')
    const balanzas = await obtenerValores('obtenerBalanzas')
    console.log(balanzas)
    nombre.textContent = datosUsuario.nombre_completo;
    rol.textContent = datosUsuario.rol;
    balanzas.forEach(element => {
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

        nuevoArticle.addEventListener('click',()=>{
            window.location.href=`../pages/balanza.html?id=${element.codigo}`
        })
    });
}
async function iniciarApp() {
    // 1. Esperamos a ver si el token es válido
    await verificarToken(); 

    await cargarBalanzas(); 
}

iniciarApp();




