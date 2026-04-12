const token = localStorage.getItem('token_colomos_scale')
let format = {headers:{'token':token}}

const username = document.getElementById('inputUsername');
const contra = document.getElementById('inputPass');
const boton = document.getElementById('btn');
const error = document.getElementById('mensaje-error');

async function verificarToken(){
    if(token)
    {
        try{
            const res = await fetch('http://localhost:3000/api/verificarToken',format)
            const result = await res.json();
            if(result.status===0){
                localStorage.removeItem('token_colomos_scale');
            }
            else if(result.status===1){
                window.location.href='../pages/dashboard.html'
            }
        }
        catch(e){
            localStorage.removeItem('token_colomos_scale');
        }
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
        if(name==""){
            username.style.borderColor = "red";
        } 
        if(pass==""){
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
                    })
                }
                const respuesta = await fetch(`http://localhost:3000/api/iniciarSesion`,opt);
                const datos = await respuesta.json(); // Leemos la respuesta del servidor
                if(datos.status===1){
                    localStorage.setItem('token_colomos_scale',datos.token);
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

async function iniciarApp(){
    await verificarToken();
    cargarPagina();
    document.querySelector('body').classList.add('is-loaded')
}
iniciarApp();