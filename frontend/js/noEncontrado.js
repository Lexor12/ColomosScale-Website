async function verificarToken() {
        try{
            const res = await fetch('https://colomosscale-website-production.up.railway.app/api/verificarToken',{credentials:'include'})
            const result = await res.json();
            if(result.status===0){
                redirigir();
            }
            setTimeout(() => {
                window.location.href='../pages/dashboard.html'
            }, 1500);
        }catch(e){
            window.location.href='../pages/notAuth.html'
        }
}
function redirigir(){
    setTimeout(() => {
    window.location.href='../index.html'
}, 2000);
}

verificarToken();