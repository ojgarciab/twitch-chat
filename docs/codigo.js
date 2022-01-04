console.log(redirect);

document.addEventListener("DOMContentLoaded", (evento) => {
    var url = new URL("https://id.twitch.tv/oauth2/authorize?response_type=token");
    url.searchParams.append("client_id", clientId);
    url.searchParams.append("redirect_uri", redirect);
    url.searchParams.append("scope", "chat:edit chat:read");
    enlaceInicio.href = url.href;
});