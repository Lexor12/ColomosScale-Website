const token = localStorage.getItem('token_colomos_scale')
let format = {headers:{'token':token}};
async function verificarToken() {
    if(!token)redirigir();
    else{
        try{
            const res = await fetch('http://localhost:3000/api/verificarToken',format)
            const result = await res.json();
            if(result.status===0){
                localStorage.removeItem('token_colomos_scale');
                redirigir();
            }
            setTimeout(() => {
                window.location.href='../pages/dashboard.html'
            }, 1500);
        }catch(e){
            localStorage.removeItem('token_colomos_scale');
            window.location.href='../pages/notAuth.html'
        }
    }
}
function redirigir(){
    setTimeout(() => {
    window.location.href='../index.html'
}, 2000);
}

verificarToken();