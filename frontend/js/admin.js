let valoresDeConsulta = {}

async function verificarToken() {
        try{
            const res = await fetch('http://127.0.0.1:3000/api/verificarToken',{credentials:'include'})
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
}

function cargarLaboratorios(){
    document.getElementById('valorTotalLaboratorios').textContent=laboratorios.length
    laboratorios.forEach(laboratorio=>{
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
        nombre.textContent=laboratorio.nombre
        Ubicacion.textContent=laboratorio.ubicacion
        balanzas.textContent=laboratorio.total_balanzas
        document.getElementById('contenidoTablaLaboratorios').append(fila)
    })
}
function cargarBalanzas(){
    document.getElementById('valorTotalBalanza').textContent=balanzas.length
    document.getElementById('valorTotalBalanzaAdecuada').textContent=balanzas.filter(balanza=>balanza.estado_calibracion==="ADECUADA").length
    document.getElementById('valorTotalBalanzaIntermedia').textContent=balanzas.filter(balanza=>balanza.estado_calibracion==="INTERMEDIA").length
    document.getElementById('valorTotalBalanzaMala').textContent=balanzas.filter(balanza=>balanza.estado_calibracion==="MALA").length
    balanzas.forEach(balanza=>{
        const fila = document.createElement('tr')
        const nombre = document.createElement('td')
        fila.append(nombre)
        const codigo = document.createElement('td')
        fila.append(codigo)
        const laboratorio = document.createElement('td')
        fila.append(laboratorio)
        const calibracion = document.createElement('td')
        const calibracionspan = document.createElement('span')
        calibracion.append(calibracionspan)
        fila.append(calibracion)

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

        nombre.textContent=balanza.nombre
        codigo.textContent=balanza.codigo
        laboratorio.textContent=balanza.nombre_laboratorio
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
function cargarReportes(){
    document.getElementById('valorTotalReportes').textContent=reportes.length
    reportes.forEach(reporte=>{
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

        id.textContent=reporte.id_reporte
        balanza.textContent=reporte.nombre_balanza
        tecnico.textContent=reporte.nombre_tecnico
        const fechavalor = new Date(reporte.fecha_analisis)
        fecha.textContent= fechavalor.toLocaleDateString('es-MX')
        document.getElementById('contenidoTablaReportes').append(fila)
    })
}

function cargarUsuarios(){
    document.getElementById('valorTotalUsuarios').textContent = usuarios.length 
    document.getElementById('valorTotalUsuariosAdmins').textContent = usuarios.filter(u=>u.rol==="ADMIN").length
    document.getElementById('valorTotalUsuariosSupervisores').textContent = usuarios.filter(u=>u.rol==="SUPERVISOR").length
    document.getElementById('valorTotalUsuariosTecnicos').textContent = usuarios.filter(u=>u.rol==="TECNICO").length
    usuarios.forEach(usuario =>{
        const fila = document.createElement('tr')
        const nombre = document.createElement('td')
        fila.append(nombre)
        const username = document.createElement('td')
        fila.append(username)
        const correo = document.createElement('td')
        fila.append(correo)
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
        fila.append(botones)

        ver.addEventListener('click',()=>{
            window.location.href=`../pages/infoUsuario.html?id=${usuario.username}`
        })

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

async function iniciarPagina(){
    await verificarToken();
    await configurarNavBar();
    cargarPagina();
    mostrarNodoVista(document.querySelector('.selector__navbar__elemento__usuarios'))
    document.querySelector('body').classList.add('is-loaded');
    
}
window.addEventListener('load',iniciarPagina)