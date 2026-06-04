
const username = document.getElementById('inputUsername');
const contra = document.getElementById('inputPass');
const boton = document.getElementById('btn');
const error = document.getElementById('mensaje-error');

async function verificarToken(){
        try{
            const res = await fetch('https://colomosscale-website-production-a4de.up.railway.app/api/verificarToken',{
                credentials:'include'
            })
            const result = await res.json();
            if(result.status===1){
                window.location.href='../pages/dashboard.html'
            }
        }
        catch(e){
            
        }
}
function cargarPagina(){
        username.addEventListener('input',()=>{
    if(username.value.trim()!=""){
        username.style.borderColor = "#e0e0e0";
        error.style.display='none';
    }
    })

    contra.addEventListener('input',()=>{
        if(contra.value.trim()!=""){
            contra.style.borderColor = "#e0e0e0";
            error.style.display='none';
        }
    })

    boton.addEventListener('click',async(e)=>{
        e.preventDefault();//evita que la pagina recargue
        const name = username.value.trim();
        const pass = contra.value.trim();
        username.style.borderColor = "#e0e0e0";
        contra.style.borderColor = "#e0e0e0";
        error.style.display='none';
        if(name=="" || name.length>48){
            username.style.borderColor = "red";
        } 
        if(pass=="" || pass.length>256){
            contra.style.borderColor = "red";
        }
        else{
            try{
                let opt = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: name,
                        password:pass
                    }),
                    credentials:'include'
                }
                const respuesta = await fetch(`https://colomosscale-website-production-a4de.up.railway.app/api/iniciarSesion`,opt);
                const datos = await respuesta.json(); // Leemos la respuesta del servidor
                if(datos.status===1){
                    window.location.href='../pages/dashboard.html'
                }
                else{
                    error.style.display='block';
                }
            }
            catch(e){
                console.error("Error al mandar los datos del login.")
            }
        }
    })
}

async function iniciarPagina(){
    await verificarToken();
    cargarPagina();
    document.querySelector('body').classList.add('is-loaded')
}
window.addEventListener('load',iniciarPagina)
