import React, { useEffect, useState } from "react";
import Chat from "./components/Chat";
import "bootstrap/dist/css/bootstrap.min.css";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import CocheYellowSVG from "./components/CocheYellowSVG";
import { Client } from "@stomp/stompjs";

export default function App() {
    // Posicion por defecto del mapa
    const position = [51.505, -0.09];

    // Posicion del auto
    const [posicionCoche, setPosicionCoche] = useState([0, 0]);
    
    // Constantes para calcular angulo del auto
    // Coordenadas anteriores donde estaba el auto
    const [puntoAnterior, setPuntoAnterior] = useState([0, 0]);
    // Angulo al que mira el auto
    const [anguloCoche, setAnguloCoche] = useState(0);

    // Conexion con el socket
    useEffect(() => {
        const cliente = new Client({
            brokerURL: "ws://localhost:8080/websocket",
        });

        cliente.onConnect = () => {
            console.log("Conexion para coordenadas");

            // Se suscribe para obtener las coordenadas
            cliente.subscribe("/taxi/coordenada", (m) => {
                // Se trae la coordenada del body que se recibe
                const coordenada = JSON.parse(m.body);

                // Se setea las coordenadas del punto nuevo
                const puntoNuevo = [coordenada.x, coordenada.y];
                console.log("Coordenada recibida: " + puntoNuevo);

                // Se calcula el angulo del auto
                const anguloNuevo = calcularAnguloDireccionGPS(
                    puntoAnterior,
                    puntoNuevo
                );

                setPuntoAnterior(puntoNuevo);

                setPosicionCoche([coordenada.x, coordenada.y]);
                setAnguloCoche(anguloNuevo);
            });
        };
        cliente.activate();

        return () => {
            if (cliente) {
                cliente.deactivate();
            }
        };
    }, [puntoAnterior]);

    // Importamos el svg del auto
    const svgIconoCoche = L.divIcon({
        html: `<div class='svg-icon' style="transform: rotate(${anguloCoche}deg);">${CocheYellowSVG}</div>`,
        className: "svg-icon",
    });

    // Calculo de la rotacion del auto
    const calcularAnguloDireccionGPS = (puntoActual, puntoNuevo) => {
        const [lat1, lon1] = puntoActual;
        const [lat2, lon2] = puntoNuevo;

        const deltaX = lat2 - lat1;
        const deltaY = lon2 - lon1;
        const anguloRad = Math.atan2(deltaY, deltaX);
        const anguloGrados = (anguloRad * 180) / Math.PI;

        return anguloGrados;
    };

    return (
        <div className="container-fluid">
            <div className="row h-100">
                {/* Mapa */}
                <div className="col-9">
                    <MapContainer
                        center={position}
                        zoom={13}
                        scrollWheelZoom={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={posicionCoche} icon={svgIconoCoche} />
                    </MapContainer>
                </div>

                {/* Chat */}
                <div className="col-3 d-flex flex-column">
                    <Chat/>
                </div>
            </div>
        </div>
    );
}
