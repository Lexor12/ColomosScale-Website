const botonBuscar = document.querySelector('#buscar');
const inputBalanza = document.querySelector('#txtbalanza');
const cuadroResult = document.querySelector('#result');
const msgError = document.getElementById('mensaje-error'); 
const msgNoEncontrado = document.getElementById('mensaje-noencontrado')
const etiquetas = document.querySelectorAll('.result__label');

botonBuscar.addEventListener('click',async(e)=>{
    e.preventDefault();//evita que la pagina recargue
    const idBalanza = inputBalanza.value;
    msgError.style.display = 'none';
    msgNoEncontrado.style.display = 'none';
    etiquetas.forEach(n => n.style.display='block');
    cuadroResult.style.display = 'none';
    if(inputBalanza.value.trim()===""){
        return;
    }
    try{
        const respuesta = await fetch(`http://localhost:3000/api/buscador/${idBalanza}`);
        if(!respuesta.ok)throw new Error("Error en la respuesta del servidor");
        const datos = await respuesta.json();
        if(Object.keys(datos).length==0){
            etiquetas.forEach(n => n.style.display='none');
            msgNoEncontrado.textContent = "Código de balanza no existente."
            msgNoEncontrado.style.display ='block';
        }
        else{
            const fecha = new Date(datos[0].ultima_medicion);
            document.getElementById('estado-valor').textContent = datos[0].estado_calibracion;
            document.getElementById('fecha-valor').textContent = fecha.toLocaleDateString('es-MX');
        }
        cuadroResult.style.display = 'block';
    }
    catch(error){
        etiquetas.forEach(n => n.style.display='none');
        msgError.textContent = "Error: Inténtelo más tarde.";
        msgError.style.display = 'block'; // Mostramos solo el mensaje de error
        cuadroResult.style.display = 'block';
    }
})
inputBalanza.addEventListener('input',function(){
    if(this.value.trim()==""){
        msgError.style.display = 'none';
        msgNoEncontrado.style.display = 'none';
        etiquetas.forEach(n => n.style.display='block');
        cuadroResult.style.display = 'none';
    }
})
