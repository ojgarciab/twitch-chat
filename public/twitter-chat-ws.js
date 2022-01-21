class TwitterChatWs extends EventTarget {
    #token;
    #login;
    #ws = null;
    readyState = 3; // CLOSED

    /**
     * Saves Twitch API key
     * @param {string} token - Twitch API access_token
     * @param {string} login - Twitch user name
     */
    constructor(token, login) {
        /* Es necesario llamar a super() cuando heredamos de otra clase */
        super();
        this.#token = token;
        this.#login = login;
    }

    /**
     * Saves Twitch API key
     * @param {Event} event - Event triggered when websocket is connected
     */
    #onOpen = (event) => {
        console.log("#onOpen:", event);
        this.readyState = 1; // OPEN
        super.dispatchEvent(new Event("open"));
        /* Enviamos las credenciales del usuario de manera transparente */
        this.#ws.send("PASS oauth:" + this.#token);
        this.#ws.send("NICK " + this.#login);
    }

    /**
     * Saves Twitch API key
     * @param {Event} event - Event triggered when websocket is connected
     */
    #onError = (event) => {
        console.log("#onError:", event);
        super.dispatchEvent(event);
    }

    #onMessage = (event) => {
        console.log("#onMessage:", event);
        super.dispatchEvent(new MessageEvent("message", { data: event.data }));
        /* Procesamos cada línea de texto como un evento independiente */
        event.data.split("\r\n").filter(a => a).forEach(data => {
            super.dispatchEvent(new MessageEvent('messageline', { data }));
        });
    }

    #onClose = (event) => {
        console.log("#onClose:", event);
        super.dispatchEvent(new Event("close"));
    }

    send(message) {
        this.#ws.send(message);
    }
    
    /**
     * Establishes the connection to the IRC server
     */
    connect() {
        /* Si la conexión estaba previamente establecida salimos */
        if (this.#ws !== null) {
            return;
        }
        console.log("connect");
        /* Establecemos una nueva conexión con el servidor */
        this.#ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
        this.readyState = 0; // CONNECTING
        /* Configuramos los manipuladores de eventos */
        this.#ws.addEventListener("open", this.#onOpen);
        this.#ws.addEventListener("error", this.#onError);
        this.#ws.addEventListener("message", this.#onMessage);
        this.#ws.addEventListener("close", this.#onClose);
    }

    /**
     * Disconnects from IRC server
     */
     disconnect() {
        /* Desconectamos el websocket */
        this.#ws.disconnect();
        this.readyState = 0; // CLOSED
        this.#ws = null;
    }
}
