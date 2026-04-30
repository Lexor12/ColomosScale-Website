export function crearToaster(mensaje,contenedor_toaster,tipo='info',tiempo=5){
    let classTipo = `toast-${tipo}`;
    const tiempoTotal=tiempo*1000;
    const div = document.createElement('div');
    div.classList.add('toaster__contenedor__elemento',classTipo)

    const divImg = document.createElement('div')
    const img = document.createElement('img')
    img.src=`../assets/icons/icon_${tipo}.png`;
    img.alt=tipo
    divImg.append(img);
    div.append(divImg);

    const p = document.createElement('p')
    p.classList.add('toaster__contenedor__elemento__info')
    p.textContent=mensaje
    div.append(p)
    contenedor_toaster.append(div);
    setTimeout(()=>{
        div.classList.add('toast-hide')
        div.addEventListener('animationend',()=>{div.remove();})
    },tiempoTotal)
}