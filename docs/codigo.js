console.log(redirect);

document.addEventListener("DOMContentLoaded", (evento) => {
    console.log("Estado almacenado:", sessionStorage.estado);
    if (sessionStorage.estado && document.location.hash.match(/access_token=(\w+)/)) {
        const state = document.location.hash.match(/[#&]state=([\w]*)(?:&|$)/)[1];
        console.log("Estado obtenido:", state);
        if (state === sessionStorage.estado) {
            sessionStorage.token = document.location.hash.match(/[#&]access_token=([\w]*)(?:&|$)/)[1];
            console.log("Token:", sessionStorage.token);
        }
        history.replaceState(null, null, ' ');
    } else {
        sessionStorage.estado = Math.random(0).toString(36).substring(2);
        var url = new URL("https://id.twitch.tv/oauth2/authorize?response_type=token");
        url.searchParams.append("client_id", clientId);
        url.searchParams.append("redirect_uri", redirect);
        url.searchParams.append("scope", "chat:edit chat:read");
        url.searchParams.append("state", sessionStorage.estado);
        enlaceInicio.href = url.href;
        iniciarSesion.style.display = "block";
    }
});
