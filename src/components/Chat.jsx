import { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import "bootstrap/dist/css/bootstrap.min.css";

const Chat = () => {
    const [nombre, setNombre] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [mensajesRecibidos, setMensajesRecibidos] = useState([]);
    const clienteRef = useRef(null);
    const isConnectedRef = useRef(false);

    // Manejador de input nombre
    const handleNombreChange = (e) => {
        setNombre(e.target.value);
    };

    // Manejador de input mensaje
    const handleMensajeChange = (e) => {
        setMensaje(e.target.value);
    };

    // Coneccion al socket y suscripcion para descargar mensajes
    const connectToSocket = () => {
        // Se verifica el useRef de conexion
        if (isConnectedRef.current) {
            return;
        }

        // Se realiza la conexion al socket
        const cliente = new Client({
            brokerURL: "ws://localhost:8080/websocket",
            onConnect: () => {
                console.log("Conexion para chat");

                // Se suscribe al socket de mensajes pare recibirlos
                cliente.subscribe("/tema/mensajes", (message) => {
                    const mensajeRecibido = JSON.parse(message.body);
                    console.log("Mensaje recibido:", mensajeRecibido);
                    setMensajesRecibidos((prevMensajes) => [
                        ...prevMensajes,
                        mensajeRecibido,
                    ]);
                });

                // Se setea la referencia como true para evitar la doble conexion al socket
                isConnectedRef.current = true;
            },
            onStompError: (frame) => {
                console.error("Error en STOMP: ", frame.headers["message"]);
                console.error("Detalles: ", frame.body);
            },
        });

        cliente.activate();
        clienteRef.current = cliente;
    };

    useEffect(() => {
        connectToSocket();
        return () => {
            if (clienteRef.current) {
                clienteRef.current.deactivate();
            }
        };
    }, []);

    // Maneja lo que sucede al presionar enter o el boton de enviar
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Enviando mensaje:", { nombre, mensaje });

        // Se envia el mensaje al socket si se esta conectado al mismo
        if (clienteRef.current && clienteRef.current.connected) {
            clienteRef.current.publish({
                destination: "/app/envio",
                body: JSON.stringify({
                    nombre: nombre,
                    contenido: mensaje,
                }),
            });
            console.log("Mensaje enviado");
            setMensaje("");
        } else {
            console.log("Cliente no está conectado");
        }
    };

    // Si se presiona enter, se envia el mensaje
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="d-flex flex-column h-100">
            <h2 className="mt-2"><strong>Chat con el conductor</strong></h2>
            <div className="flex-grow-1 mt-3 overflow-auto">
                <ul className="list-group">
                    {mensajesRecibidos.map((msg, index) => (
                        <li key={index} className="list-group-item">
                            <i>
                                <strong>{msg.nombre}:</strong>
                            </i>{" "}
                            {msg.contenido}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-auto p-3 bg-light rounded">
                <div className="mb-2">
                    <label htmlFor="txtNombre"><strong>Nombre</strong></label>
                    <input
                        id="txtNombre"
                        type="text"
                        value={nombre}
                        onChange={handleNombreChange}
                        className="form-control"
                        placeholder="Nombre"
                    />
                </div>
                <div className="mb-2">
                    <label htmlFor="txtMensaje"><strong>Mensaje</strong></label>
                    <input
                        id="txtMensaje"
                        type="text"
                        value={mensaje}
                        onChange={handleMensajeChange}
                        className="form-control"
                        placeholder="Mensaje"
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <button
                    id="btnEnviar"
                    className="btn btn-primary"
                    onClick={handleSubmit}
                >
                    Enviar
                </button>
            </div>
        </div>
    );
};

export default Chat;
