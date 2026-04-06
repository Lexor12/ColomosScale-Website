const username = document.getElementById('inputUsername');
const contra = document.getElementById('inputPass');
const boton = document.getElementById('btn');

username.addEventListener('input',()=>{
    if(username.value.trim()!=""){
        username.style.borderColor = "#e0e0e0";
    }
})
contra.addEventListener('input',()=>{
    if(contra.value.trim()!=""){
        contra.style.borderColor = "#e0e0e0";
    }
})

boton.addEventListener('click',async(e)=>{
    e.preventDefault();//evita que la pagina recargue
    const name = username.value.trim();
    const pass = contra.value.trim();
    username.style.borderColor = "#e0e0e0";
    contra.style.borderColor = "#e0e0e0";
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
        }
        catch(e){
            console.error("Error al mandar los datos del login.")
        }
    }
})

