const botonBuscar = document.querySelector('#buscar');
const inputBalanza = document.querySelector('#txtbalanza');
const cuadroResult = document.querySelector('#result');
const msgError = document.getElementById('mensaje-error'); 
const etiquetas = document.querySelectorAll('.result__label');

botonBuscar.addEventListener('click',async(e)=>{
    e.preventDefault();//evita que la pagina recargue
    const idBalanza = inputBalanza.value;
    msgError.style.display = 'none';
    etiquetas.forEach(n => n.style.display='block');
    cuadroResult.style.display = 'none';
    if(inputBalanza.value.trim()===""){
        return;
    }
    try{
        const respuesta = await fetch(`http://localhost:3000/buscar?id=${idBalanza}`);
        if(!respuesta.ok)throw new Error("Error en la respuesta del servidor");
        const datos = await respuesta.json();
        if(Object.keys(datos).length===0){
            document.getElementById('estado-valor').textContent = "No encontrado";
            document.getElementById('fecha-valor').textContent = "---";
            return;
        }
        else{
            document.getElementById('estado-valor').textContent = datos.estado;
            document.getElementById('fecha-valor').textContent = datos.fecha;
            
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
