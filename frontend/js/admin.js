import { crearToaster } from "./toaster.js";
let valoresDeConsulta = {}

async function verificarToken() {
        try{
            const res = await fetch('https://colomosscale-website-production.up.railway.app/api/verificarToken',{credentials:'include'})
            const result = await res.json();
            if(result.status===0){
                window.location.href='../pages/notAuth.html'
            }
            if(result.usuario.rol<3){window.location.href='../pages/404.html';return;}
            const adminBtn = document.getElementById('btnAdmin');
            adminBtn.style.display="";
            adminBtn.addEventListener('click',()=>{
                window.location.href='../pages/admin.html';
                return;
            })
            valoresDeConsulta = await obtenerValores(`admin`)
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
        const res = await fetch(`https://colomosscale-website-production.up.railway.app/api/${valor}`,{credentials:'include'})
        const result = await res.json()
        return result.status===0? {}:result.data
    }
    catch(e)   {
        return {}
    }
}
async function eliminarValores(valor) {
    try{
        const resultado = await fetch(`https://colomosscale-website-production.up.railway.app/api/${valor}`,{method:'DELETE',credentials:'include'}).then(result=>result.json())
        if(resultado.status==-1)return {status:-1,error:resultado.data[0].mensaje}
        return resultado
    }catch(e){
        
        return {status:-1,error:"No se pudo conectar a la base de datos."}
    }
}
//De aqui para atras son funciones basicas de todos los archivos
function reiniciarVista(){
    document.querySelectorAll('.elements__general').forEach(nodo=>{
        nodo.style.display='none'
    })
    document.querySelectorAll('.selector__navbar__elemento').forEach(nodo=>{
        nodo.classList.remove('seleccionado')
    })
}
function mostrarNodoVista(nodo){
    reiniciarVista();
    nodo.classList.add('seleccionado')

    const seccion = nodo.dataset.tab
    document.querySelector(`[data-seccion="${seccion}"`).style.display=''
}

let usuarios;
let balanzas;
let laboratorios;
let reportes;

function cargarPagina(){
    document.querySelectorAll('.selector__navbar__elemento').forEach(nodo=>{
        nodo.addEventListener('click',()=>mostrarNodoVista(nodo))
    })
    usuarios = valoresDeConsulta.usuarios;
    balanzas = valoresDeConsulta.balanzas;
    laboratorios = valoresDeConsulta.laboratorios;
    reportes = valoresDeConsulta.reportes;
    cargarUsuarios()
    cargarLaboratorios()
    cargarBalanzas()
    cargarReportes()
    const buscadorUsuario = document.getElementById('buscadorUsuario');
    buscadorUsuario.addEventListener('input',()=>{
        cargarUsuarios(buscadorUsuario.value)
    })
    const buscadorLaboratorio = document.getElementById('buscadorLaboratorio');
    buscadorLaboratorio.addEventListener('input',()=>{
        cargarLaboratorios(buscadorLaboratorio.value)
    })
    const buscadorBalanza = document.getElementById('buscadorBalanza');
    buscadorBalanza.addEventListener('input',()=>{
        cargarBalanzas(buscadorBalanza.value)
    })
    const buscadorReporte = document.getElementById('buscadorReporte');
    buscadorReporte.addEventListener('input',()=>{
        cargarReportes(buscadorReporte.value)
    })
}

function cargarLaboratorios(input=''){
    document.getElementById('valorTotalLaboratorios').textContent=laboratorios.length
    document.getElementById('contenidoTablaLaboratorios').innerHTML=''
    const lista= laboratorios.filter(a=>a.nombre.trim().toLowerCase().includes(input.toLowerCase()));
    if(lista.length===0 &&input!=''){
        const contenedor_toaster = document.querySelector('.toaster__contenedor');
        crearToaster("No existe ningún laboratorio con ese nombre.",contenedor_toaster,'info',1.5)
    }
    lista.forEach(laboratorio=>{
        const fila = document.createElement('tr')
        const nombre = document.createElement('td')
        fila.append(nombre)
        const Ubicacion = document.createElement('td')
        fila.append(Ubicacion)
        const balanzas = document.createElement('td')
        fila.append(balanzas)

        const botones = document.createElement('td')
        const editar = document.createElement('button')
        const eliminar = document.createElement('button')
        editar.classList.add('btn__accion__editar')
        eliminar.classList.add('btn__accion__eliminar')
        editar.textContent='Editar'
        eliminar.textContent='Eliminar'
        botones.append(editar)
        botones.append(eliminar)
        fila.append(botones)

        const camposLaboratorioEditar = [//Arreglo de conjunto de objetos
        { id:'nombre', labelTexto:'Nombre del Laboratorio', tipo:'text',contenido:laboratorio.nombre },
        { id:'ubicacion', labelTexto:'Ubicación del Laboratorio', tipo:'text',contenido:laboratorio.ubicacion },
        ]//El estado y codigo son creados aqui, ultima medicion siempre será el dia de creación

        editar.addEventListener('click',()=>{
            abrirModalFormulario('Editar una Balanza',camposLaboratorioEditar,(elemento)=>{editarElemento(`laboratorio/${laboratorio.id_laboratorio}`,elemento)})
        })
        eliminar.addEventListener('click',()=>{
            abrirModalEliminar(`laboratorio/${laboratorio.id_laboratorio}`)
        })
        
        nombre.textContent=laboratorio.nombre
        Ubicacion.textContent=laboratorio.ubicacion
        balanzas.textContent=laboratorio.total_balanzas
        document.getElementById('contenidoTablaLaboratorios').append(fila)
    })
}
function cargarBalanzas(input=''){
    document.getElementById('valorTotalBalanza').textContent=balanzas.length
    document.getElementById('valorTotalBalanzaAdecuada').textContent=balanzas.filter(balanza=>balanza.estado_calibracion==="ADECUADA").length
    document.getElementById('valorTotalBalanzaIntermedia').textContent=balanzas.filter(balanza=>balanza.estado_calibracion==="INTERMEDIA").length
    document.getElementById('valorTotalBalanzaMala').textContent=balanzas.filter(balanza=>balanza.estado_calibracion==="MALA").length
    document.getElementById('contenidoTablaBalanzas').innerHTML=''
    
    let lista= balanzas.filter(a=>a.nombre.trim().toLowerCase().includes(input.toLowerCase()));
    if(lista.length==0)lista= balanzas.filter(a=>a.codigo.trim().toLowerCase().includes(input.toLowerCase()));
    if(lista.length==0 && input!=''){
        const contenedor_toaster = document.querySelector('.toaster__contenedor');
        crearToaster("No existe ningúna balanza con ese nombre.",contenedor_toaster,'info',1.5)
    }
    lista.forEach(balanza=>{
        const fila = document.createElement('tr')
        const nombre = document.createElement('td')
        fila.append(nombre)
        const codigo = document.createElement('td')
        fila.append(codigo)
        const laboratorio = document.createElement('td')
        fila.append(laboratorio)
        const reportesAsociados = document.createElement('td')
        const calibracion = document.createElement('td')
        const calibracionspan = document.createElement('span')
        calibracion.append(calibracionspan)
        fila.append(calibracion)
        fila.append(reportesAsociados)

        const botones = document.createElement('td')
        const editar = document.createElement('button')
        const eliminar = document.createElement('button')
        const ver = document.createElement('button')
        editar.classList.add('btn__accion__editar')
        eliminar.classList.add('btn__accion__eliminar')
        ver.classList.add('btn__accion__ver')
        editar.textContent='Editar'
        eliminar.textContent='Eliminar'
        ver.textContent='Ver'
        botones.append(eliminar)
        botones.append(editar)
        botones.append(ver)
        fila.append(botones)

        ver.addEventListener('click',()=>{
            window.location.href=`../pages/balanza.html?id=${balanza.codigo}`
        })
        eliminar.addEventListener('click',()=>{
            abrirModalEliminar(`balanza/${balanza.id_balanza}`)
        })

        const camposBalanzaEditar = [//Arreglo de conjunto de objetos
        { id:'nombre', labelTexto:'Nombre de balanza', tipo:'text',contenido:balanza.nombre },
        { id:'marca', labelTexto:'Marca de balanza', tipo:'text',contenido:balanza.marca },
        { id:'modelo', labelTexto:'Modelo de balanza', tipo:'text',contenido:balanza.modelo },
        { id:'serie', labelTexto:'Código de Serie de balanza', tipo:'text',contenido:balanza.serie },
        { id:'img', labelTexto:'Nueva Imagen de balanza', tipo:'file' },
        ]//El estado y codigo son creados aqui, ultima medicion siempre será el dia de creación

        
        editar.addEventListener('click',()=>{
            let laboratoriosSelector = [];
            laboratorios.forEach(lab =>{
                laboratoriosSelector.push({id:lab.nombre,value:lab.id_laboratorio,text:lab.nombre})
            })
            const selector = devolverObjetoSelector('Laboratorio',laboratoriosSelector,'id_laboratorio')
            selector.querySelector('select').value=balanza.id_laboratorio
        abrirModalFormulario('Editar una Balanza',camposBalanzaEditar,(elemento)=>{editarElemento(`balanza/${balanza.id_balanza}`,elemento)},[selector])})
        

        nombre.textContent=balanza.nombre
        codigo.textContent=balanza.codigo
        laboratorio.textContent=balanza.nombre_laboratorio
        reportesAsociados.textContent=reportes.filter(reporte=>reporte.id_balanza==balanza.id_balanza).length
        calibracionspan.textContent=balanza.estado_calibracion
        switch(balanza.estado_calibracion){
            case "ADECUADA": calibracionspan.classList.add('estado-bueno')
                break;
            case "INTERMEDIA": calibracionspan.classList.add('estado-intermedio')
                break;
            case "MALA": calibracionspan.classList.add('estado-malo')
                break;
        }
        document.getElementById('contenidoTablaBalanzas').append(fila)
    })
}
function cargarReportes(input=''){
    document.getElementById('valorTotalReportes').textContent=reportes.length
    document.getElementById('contenidoTablaReportes').innerHTML=''
    const lista= reportes.filter(a=>a.id_reporte.toString().includes(input));
    if(lista.length==0 && input!=''){
        const contenedor_toaster = document.querySelector('.toaster__contenedor');
        crearToaster("No existe ningún reporte con ese id.",contenedor_toaster,'info',1.5)
    }
    lista.forEach(reporte=>{
        const fila = document.createElement('tr')
        const id = document.createElement('td')
        fila.append(id)
        const balanza = document.createElement('td')
        fila.append(balanza)
        const tecnico = document.createElement('td')
        fila.append(tecnico)
        const fecha = document.createElement('td')
        fila.append(fecha)

        const botones = document.createElement('td')
        const editar = document.createElement('button')
        const eliminar = document.createElement('button')
        const ver = document.createElement('button')
        editar.classList.add('btn__accion__editar')
        eliminar.classList.add('btn__accion__eliminar')
        ver.classList.add('btn__accion__ver')
        editar.textContent='Editar'
        eliminar.textContent='Eliminar'
        ver.textContent='Ver'
        botones.append(eliminar)
        botones.append(editar)
        botones.append(ver)
        fila.append(botones)

        ver.addEventListener('click',()=>{
            window.location.href=`../pages/reporte.html?id=${reporte.id_reporte}`
        })
        const fechavalor = new Date(reporte.fecha_analisis)
        const camposReporteEditar = [//Arreglo de conjunto de objetos
            { id:'excentricidad', labelTexto:'Excentricidad (gramos)', tipo:'text',contenido:reporte.excentricidad_promedio },
            { id:'rep50', labelTexto:'Repetibilidad 50 (gramos)', tipo:'text',contenido:reporte.repetibilidad_50 },
            { id:'rep100', labelTexto:'Repetibilidad 100 (gramos)', tipo:'text',contenido:reporte.repetibilidad_100 },
            { id:'linealidad', labelTexto:'Linealidad Promedio (gramos)', tipo:'text',contenido:reporte.linealidad_promedio },
            { id:'observaciones', labelTexto:'Observaciones', tipo:'text',contenido:reporte.observaciones }
        ]//El estado y codigo son creados aqui, ultima medicion siempre será el dia de creación

        editar.addEventListener('click',()=>{
            let usuariosSelector = [];
            let balanzaSelector = [];
            balanzas.forEach(balanza=>{
                balanzaSelector.push({id:balanza.id_balanza,value:balanza.id_balanza,text:balanza.nombre})
            })
            usuarios.forEach(usuario =>{
                usuariosSelector.push({id:usuario.username,value:usuario.id,text:usuario.username})
            })
            const selectorUsuario = devolverObjetoSelector('Usuario',usuariosSelector,'id_usuario')
            const selectorBalanza = devolverObjetoSelector('Balanza',balanzaSelector,'id_balanza')
            selectorUsuario.querySelector('select').value=reporte.id_usuario
            selectorBalanza.querySelector('select').value=reporte.id_balanza
            abrirModalFormulario('Editar Reporte',camposReporteEditar,(elemento)=>{editarElemento(`reporte/${reporte.id_reporte}`,elemento)},[selectorUsuario,selectorBalanza])
        })
        eliminar.addEventListener('click',()=>{
            abrirModalEliminar(`reporte/${reporte.id_reporte}`)
        })
        

        id.textContent=reporte.id_reporte
        balanza.textContent=reporte.nombre_balanza
        tecnico.textContent=reporte.nombre_tecnico
        
        fecha.textContent= fechavalor.toLocaleDateString('es-MX')
        document.getElementById('contenidoTablaReportes').append(fila)
    })
}

function cargarUsuarios(input=''){
    document.getElementById('valorTotalUsuarios').textContent = usuarios.length 
    document.getElementById('valorTotalUsuariosAdmins').textContent = usuarios.filter(u=>u.rol==="ADMIN").length
    document.getElementById('valorTotalUsuariosSupervisores').textContent = usuarios.filter(u=>u.rol==="SUPERVISOR").length
    document.getElementById('valorTotalUsuariosTecnicos').textContent = usuarios.filter(u=>u.rol==="TECNICO").length
    document.getElementById('contenidoTablaUsuarios').innerHTML=''
    const lista= usuarios.filter(a=>a.nombre_completo.trim().toLowerCase().includes(input.toLowerCase()));
    if(lista.length==0 && input!=''){
        const contenedor_toaster = document.querySelector('.toaster__contenedor');
        crearToaster("No existe ningún usuario con ese nombre.",contenedor_toaster,'info',1.5)
    }
    lista.forEach(usuario =>{
        const fila = document.createElement('tr')
        const nombre = document.createElement('td')
        fila.append(nombre)
        const username = document.createElement('td')
        fila.append(username)
        const correo = document.createElement('td')
        fila.append(correo)
        const reportesAsociados = document.createElement('td')
        
        const rol = document.createElement('td')
        const rolspan = document.createElement('span')
        rol.append(rolspan)
        fila.append(rol)
        const botones = document.createElement('td')
        const editar = document.createElement('button')
        const eliminar = document.createElement('button')
        const ver = document.createElement('button')
        editar.classList.add('btn__accion__editar')
        eliminar.classList.add('btn__accion__eliminar')
        ver.classList.add('btn__accion__ver')
        editar.textContent='Editar'
        eliminar.textContent='Eliminar'
        ver.textContent='Ver'
        botones.append(eliminar)
        botones.append(editar)
        botones.append(ver)
        fila.append(reportesAsociados)
        fila.append(botones)
        

        ver.addEventListener('click',()=>{
            window.location.href=`../pages/infoUsuario.html?id=${usuario.username}`
        })
        

        const camposUsuarioEditar = [
        { id: 'nombre',   labelTexto: 'Nombre completo', tipo: 'text',contenido:usuario.nombre_completo     },
        { id: 'username', labelTexto: 'Username',         tipo: 'text',contenido:usuario.username     },
        { id: 'correo',   labelTexto: 'Correo',           tipo: 'text',contenido:usuario.correo     },
        { id: 'password', labelTexto: 'Nueva Contraseña',       tipo: 'password',placeholder:"Mínimo 8 Caracteres si desea cambiarla" },
        { id: 'img', labelTexto: 'Nueva imagen',       tipo: 'file' },
        ]

        
        editar.addEventListener('click',()=>{
            const selector = devolverObjetoSelector('Seleccione el Rol',[
                {id:'tecnico',value:'TECNICO'},
                {id:'supervisor',value:'SUPERVISOR'},
                {id:'admin',value:'ADMIN'}
            ],'rol');
            selector.querySelector('select').value =usuario.rol
            abrirModalFormulario('Editar un Usuario',camposUsuarioEditar,(elemento)=>{
                editarElemento(`usuario/${usuario.id}`,elemento)
            } ,[selector])})
        eliminar.addEventListener('click',()=>abrirModalEliminar(`usuario/${usuario.id}`))
        reportesAsociados.textContent=reportes.filter(reporte=>reporte.id_usuario==usuario.id).length
        nombre.textContent=usuario.nombre_completo
        username.textContent=usuario.username
        correo.textContent=usuario.correo
        rolspan.textContent=usuario.rol
        switch(usuario.rol){
            case "ADMIN": rolspan.classList.add('rol-admin')
                break;
            case "SUPERVISOR": rolspan.classList.add('rol-supervisor')
                break;
            case "TECNICO": rolspan.classList.add('rol-tecnico')
                break;
        }
        document.getElementById('contenidoTablaUsuarios').append(fila)
    })
}

async function crearElemento(direccion,formulario) {
    const datos = new FormData()
    formulario.querySelectorAll('input').forEach(input => {
        if (input.type === 'file' && input.files[0]) {
            datos.append(input.id, input.files[0])
        } else {
            if(input.value)
            datos.append(input.id,input.value)
        }
    })
    formulario.querySelectorAll('select').forEach(select => {
        datos.append(select.id,select.value)
    })

    await fetch(`https://colomosscale-website-production.up.railway.app/api/${direccion}`,{method:'POST',credentials:'include',body:datos}).then(a=>a.json()).then(datos=>{
        notificar(datos)
    })
    volverACargarElementos()
}

async function editarElemento(direccion,formulario){
    const datos = new FormData()
    
    formulario.querySelectorAll('input').forEach(input => {
        if (input.type === 'file' && input.files[0]) {
            datos.append(input.id, input.files[0])
        }
        else {
            if(input.value)
            datos.append(input.id,input.value)
        }
    })
    
    formulario.querySelectorAll('select').forEach(select => {
        datos.append(select.id,select.value)
    })
    await fetch(`https://colomosscale-website-production.up.railway.app/api/${direccion}`,{method:'PATCH',credentials:'include',body:datos}).then(a=>a.json()).then(datos=>{
        notificar(datos)
    })
    volverACargarElementos()
}

function notificar(datos){
    const contenedor_toaster = document.querySelector('.toaster__contenedor');
        let tipo;
        let mensaje;
        switch(datos.status){
            case 1:
                tipo='correcto'
                mensaje=Object.values(datos.data[0])
                break;
            default: tipo='error'
                mensaje=datos.error;
                break;
    }
    crearToaster(mensaje,contenedor_toaster,tipo,5)
}

function devolverObjetoSelector(labeltxt,items,id='selector'){
    const div = document.createElement('div')
    div.classList.add('campo__formulario')
    const selector = document.createElement('select')
    selector.id=id
    const label = document.createElement('label')
    label.htmlFor = 'selector'
    label.textContent = labeltxt
    items.forEach(({id,value,text=null})=>{
        const option = document.createElement('option')
        option.id=id
        option.value=value
        if(!text)option.text=value
        else option.text=text
        selector.append(option)
    })
    div.append(label)
    div.append(selector)
    return div
}

function abrirModalEliminar(ruta) {
    const modal = document.querySelector('.modal')
    const modalEliminar = document.querySelector('.modal__eliminar')
    const btnAceptar = document.querySelector('.modal__eliminar .modal__elemento__botones .aceptar')
    const btnRechazar = document.querySelector('.modal__eliminar .modal__elemento__botones .rechazar')

    modal.classList.add('activo')
    modalEliminar.classList.add('mostrar')

    btnAceptar.addEventListener('click', confirmarEliminar)
    btnRechazar.addEventListener('click', cerrarModal)

    async function confirmarEliminar() {
        const resultado = await eliminarValores(ruta)
        notificar(resultado)
        volverACargarElementos()
        cerrarModal()
    }
    function cerrarModal() {
        modal.classList.remove('activo')
        modalEliminar.classList.remove('mostrar')
        btnAceptar.removeEventListener('click', confirmarEliminar)
        btnRechazar.removeEventListener('click', cerrarModal)
    }
}

function abrirModalFormulario(titulo, camposTexto, callbackAceptar,elementosAdicionales=null) {
    const modal = document.querySelector('.modal')
    const modalEditar = document.querySelector('.modal__editaragregar')
    const btnAceptar = document.querySelector('.modal__editaragregar .modal__elemento__botones .aceptar')
    const btnRechazar = document.querySelector('.modal__editaragregar .modal__elemento__botones .rechazar')
    const formulario = document.querySelector('.modal__editaragregar__formulario')

    formulario.innerHTML = ''

    document.querySelector('.modal__editaragregar__header__titulo').textContent = titulo
    modal.classList.add('activo')
    modalEditar.classList.add('mostrar')

    camposTexto.forEach(({ id, labelTexto, tipo,contenido,placeholder=null }) => {
        const div = document.createElement('div')
        div.classList.add('campo__formulario')

        const label = document.createElement('label')
        label.htmlFor = id
        label.textContent = labelTexto

        const input = document.createElement('input')
        input.id = id
        if(placeholder)input.placeholder=placeholder
        input.type = tipo
        if(contenido){input.value=contenido}

        div.append(label, input)
        formulario.append(div)
    })
    if(elementosAdicionales){//Tiene que devolver 
        elementosAdicionales.forEach(elemento=>{
            formulario.append(elemento)
        })
    }
    btnAceptar.addEventListener('click', aceptar)
    btnRechazar.addEventListener('click', cerrarModal)

    function aceptar(){
        callbackAceptar(formulario)//La funcion debe saber que hacer con los valores
        cerrarModal()
    }

    function cerrarModal() {
        modal.classList.remove('activo')
        modalEditar.classList.remove('mostrar')
        btnAceptar.removeEventListener('click', aceptar)
        btnRechazar.removeEventListener('click', cerrarModal)
        formulario.innerHTML = ''
    }
}
const camposUsuario = [
        { id: 'nombre',   labelTexto: 'Nombre completo', tipo: 'text'},
        { id: 'username', labelTexto: 'Username',tipo: 'text'},
        { id: 'correo',   labelTexto: 'Correo',tipo: 'text'},
        { id: 'password', labelTexto: 'Nueva Contraseña', tipo: 'password',placeholder:"Mínimo 8 Caracteres si desea cambiarla" },
        { id: 'img', labelTexto: 'Nueva imagen',tipo: 'file' },
    ]
const camposBalanza = [//Arreglo de conjunto de objetos
        { id:'nombre', labelTexto:'Nombre de balanza', tipo:'text' },
        { id:'marca', labelTexto:'Marca de balanza', tipo:'text' },
        { id:'modelo', labelTexto:'Modelo de balanza', tipo:'text' },
        { id:'serie', labelTexto:'Número de Serie de balanza', tipo:'text' },
        { id:'img', labelTexto:'Imagen de balanza', tipo:'file' }
    ]//El estado y codigo son creados aqui, ultima medicion siempre será el dia de creación
const camposLaboratorio = [
        {id:'nombre',labelTexto:'Nombre del Laboratorio',tipo:'text'},
        {id:'ubicacion',labelTexto:'Ubicación del Laboratorio',tipo:'text'}
    ]

function registrarBotonesNuevo(){
    document.getElementById('btnNuevoUsuario').addEventListener('click', () => {
        const selector = devolverObjetoSelector('Seleccione el Rol', [
        { id: 'tecnico',    value: 'TECNICO'    },
        { id: 'supervisor', value: 'SUPERVISOR' },
        { id: 'admin',      value: 'ADMIN'      }
        ], 'rol')
        selector.querySelector('select').value ='TECNICO'
        abrirModalFormulario('Crear nuevo Usuario', camposUsuario,async (elemento)=>{crearElemento('usuario',elemento)},[selector])
    })

    document.getElementById('btnNuevaBalanza').addEventListener('click', () => {
        let laboratoriosSelector = [];
            laboratorios.forEach(lab =>{
                laboratoriosSelector.push({id:lab.nombre,value:lab.id_laboratorio,text:lab.nombre})
            })
        const selector = devolverObjetoSelector('Laboratorio',laboratoriosSelector,'id_laboratorio')
        selector.querySelector('select').value =0
        abrirModalFormulario('Crear nueva Balanza', camposBalanza, async (elemento)=>{crearElemento('balanza',elemento)},[selector])
    })

    document.getElementById('btnNuevoLaboratorio').addEventListener('click', () => {
        abrirModalFormulario('Crear nuevo Laboratorio',camposLaboratorio,async (elemento)=>{crearElemento('laboratorio',elemento)})
    })
}

async function volverACargarElementos(){
    try{
            const res = await fetch('https://colomosscale-website-production.up.railway.app/api/verificarToken',{credentials:'include'})
            const result = await res.json();
            if(result.status===0){
                window.location.href='../pages/notAuth.html'
            }
            if(result.usuario.rol<3){window.location.href='../pages/404.html';return;}
            valoresDeConsulta = await obtenerValores(`admin`)
            if(Object.keys(valoresDeConsulta).length===0){
                window.location.href='../pages/404.html';
                return;
            }
        }catch(e){
            window.location.href='../pages/notAuth.html'
        }
    usuarios = valoresDeConsulta.usuarios;
    balanzas = valoresDeConsulta.balanzas;
    laboratorios = valoresDeConsulta.laboratorios;
    reportes = valoresDeConsulta.reportes;
    cargarUsuarios()
    cargarLaboratorios()
    cargarBalanzas()
    cargarReportes()
}
async function iniciarPagina(){
    await verificarToken();
    await configurarNavBar();
    cargarPagina();
    registrarBotonesNuevo();
    mostrarNodoVista(document.querySelector('.selector__navbar__elemento__usuarios'))
    document.querySelector('body').classList.add('is-loaded');
    
}
window.addEventListener('load',iniciarPagina)