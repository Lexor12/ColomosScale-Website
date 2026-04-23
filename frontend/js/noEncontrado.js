async function verificarToken() {
    if(!token)redirigir();
    else{
        try{
            const res = await fetch('http://127.0.0.1:3000/api/verificarToken',{credentials:'include'})
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
}
function redirigir(){
    setTimeout(() => {
    window.location.href='../index.html'
}, 2000);
}

verificarToken();