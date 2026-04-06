const token = localStorage.getItem('token_colomos_scale');
if(!token){
    window.location.href='../pages/notAuth.html'
}
else{
    console.log("Usuario autenticado, cargando datos...");
}