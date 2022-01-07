/**
 * Configura la conexión mediante Websockets y gestiona los mensajes.
 */
function comenzarChat() {
    /* Tiempo de espera entre reintentos exponencial */
    let retraso = 0;

    /* Creamos el websocket al servicio IRC de Twitch https://dev.twitch.tv/docs/irc/guide */
    const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

    /**
     * Realiza una petición al API de Twitch para comprobar si el token proporcionado es válido. Cambia el estado de la página acorde con el resultado.
     * @param {string} mensaje - Mensaje a ser enviado.
     */
    function chatEnviar(mensaje) {
        let pre = document.createElement("pre");
        pre.className = "cliente";
        pre.textContent = mensaje;
        chat.append(pre);
        ws.send(mensaje);
        chat.scrollTo({ top: chat.scrollHeight - chat.clientHeight, left: 0, behavior: 'smooth' });
    }

    /**
     * Gestionamos el evento del envío del formulario.
     */
    function formularioEnvio(evento) {
        /* Evitamos el envío del formulario */
        evento.preventDefault();
        /* Enviamos el mensaje */
        chatEnviar("PRIVMSG #" + sessionStorage.login + " :" + texto.value);
        /* Limpiamos el formulario */
        texto.value = "";
    }

    /**
     * Nos autenticamos en el servidor.
     */
    function chatAutenticacion() {
        /* Enviamos las credenciales del usuario de manera silenciosa (sin usar chatEnviar) */
        ws.send("PASS oauth:" + sessionStorage.token);
        ws.send("NICK " + sessionStorage.login);
    }

    /* Activamos el envío de PINGs periódicos y lanzamos el primero */
    ws.onopen = function(event) {
        console.log("comenzarChat: conexión establecida");
        /* Restablecemos el retraso de los reintentos de conexión */
        retraso = 0;
        /* Autenticamos la sesión del usuario */
        chatAutenticacion();
        /* Agregamos el manipulador del evento del envío del formulario */
        formulario.addEventListener("submit", formularioEnvio, false);
    };

    ws.onerror = function(error) {
        console.error("Websocket (error):", error);
    };

    ws.onmessage = function(evento) {
        console.log("Websocket (onmessage):", evento);
        /* Agregamos el mensaje recibido a la ventana del chat */
        let pre = document.createElement("pre");
        pre.className = "servidor";
        pre.textContent = evento.data;
        chat.append(pre);
        chat.scrollTo({ top: chat.scrollHeight - chat.clientHeight, left: 0, behavior: 'smooth' });
        /* Procesamos los mensajes uno a uno (filtrando los vacíos) */
        evento.data.split("\r\n").filter(a => a).forEach(mensaje => {
            console.log("Websocket (onmessage, analizando):", mensaje);
            /* Disponemos de 5 minutos para responder a un PING */
            if (mensaje == "PING :tmi.twitch.tv") {
                chatEnviar("PONG :tmi.twitch.tv");
                return;
            }
            /* Obtenemos las partes del mensaje */
            [ servidor, codigo, destino, mensaje ] = mensaje.split(" ", 4);
            /* Índice de códigos: https://www.rfc-editor.org/rfc/rfc2812#section-5 */
            switch (codigo) {
                case "001": // RPL_WELCOME
                    /* Solicitamos el acceso a nuestro propio canal */
                    chatEnviar("JOIN #" + sessionStorage.login);
                    return;
            }
        })
    };

    ws.onclose = function() {
        /* Volvemos a conectarnos pasado un tiempo de espera prudencial y exponencial */
        const tiempo = Math.pow(2, retraso++);
        console.log(`Reconectando en ${tiempo} segundos`);
        setTimeout(comenzarChat, tiempo * 1000);
        /* Eliminamos el manipulador anterior */
        formulario.removeEventListener("submit", formularioEnvio, false);
    };
}

/**
 * Realiza una petición al API de Twitch para comprobar si el token proporcionado es válido. Cambia el estado de la página acorde con el resultado.
 * @param {string} token - Token a comprobar.
 */
function comprobarSesion(token) {
    fetch(
        "https://api.twitch.tv/helix/users",
        {
            "headers": {
                "Client-ID": clientId,
                "Authorization": "Bearer " + token
            }
        }
    )
    .then(respuesta => respuesta.json())
    .then(respuesta => {
        /* Mostramos por consola la salida */
        console.log("comprobarSesion (respuesta): ", respuesta);
        sessionStorage.twitch_id = respuesta.data[0].id;
        sessionStorage.login = respuesta.data[0].login;
        cambiarEstado(true);
    })
    .catch((respuesta, error) => {
        /* En caso de error mostramos la información necesaria */
        console.log("Error en comprobarSesion:", respuesta, error);
        cambiarEstado(false);
    });
}

/**
 * Cambia el estado de la página entre inicio de sesión y mostrar el chat.
 * @param {boolean} estado - Estado del inicio de sesión. En caso de ser false se requerirá iniciar sesión.
 */
function cambiarEstado(estado) {
    if (estado) {
        /* Ocultamos el enlace de inicio de sesión y mostramos el chat */
        iniciarSesion.style.display = "none";
        contenidoChat.style.display = "block";
        comenzarChat(sessionStorage.token);
    } else {
        /* Calculamos el enlace de inicio de sesión */
        sessionStorage.estado = Math.random(0).toString(36).substring(2);
        var url = new URL("https://id.twitch.tv/oauth2/authorize?response_type=token");
        url.searchParams.append("client_id", clientId);
        url.searchParams.append("redirect_uri", redirect);
        url.searchParams.append("scope", "chat:edit chat:read");
        url.searchParams.append("state", sessionStorage.estado);
        enlaceInicio.href = url.href;
        /* Mostramos el enlace de inicio de sesión y ocultamos el chat */
        iniciarSesion.style.display = "block";
        contenidoChat.style.display = "none";
    }
}

/* Cosas que hacer al cargar la página */
document.addEventListener("DOMContentLoaded", (evento) => {
    /* Lo primero de todo, comprobar si estamos esperando un token para validarlo */
    if (sessionStorage.estado && document.location.hash.match(/access_token=(\w+)/)) {
        const state = document.location.hash.match(/[#&]state=([\w]*)(?:&|$)/)[1];
        console.log("Estado:", state);
        if (state === sessionStorage.estado) {
            /* Olvidamos el estado */
            sessionStorage.removeItem("estado");
            /* Obtenemos el token de la URL */
            sessionStorage.token = document.location.hash.match(/[#&]access_token=([\w]*)(?:&|$)/)[1];
            console.log("Token:", sessionStorage.token);
        }
        /* Quitamos el hash de la URL */
        history.replaceState(null, null, ' ');
    }
    /* Si hemos obtenido un token de Twitch comprobamos que es válido */
    if (sessionStorage.token) {
        comprobarSesion(sessionStorage.token);
    } else {
        cambiarEstado(false);
    }
});
