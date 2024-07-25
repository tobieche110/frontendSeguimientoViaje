import React, { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import CocheYellowSVG from "./CocheYellowSVG";
import { Client } from "@stomp/stompjs";

export default function App() {
    const position = [51.505, -0.09];

    const [posicionCoche, setPosicionCoche] = useState([0, 0]);
    const [puntoAnterior, setPuntoAnterior] = useState([0, 0]);
    const [anguloCoche, setAnguloCoche] = useState(0);

    useEffect(() => {
        const cliente = new Client({
            brokerURL: "ws://localhost:8080/websocket",
        });

        cliente.onConnect = () => {
            console.log("Conectado");
            cliente.subscribe("/taxi/coordenada", (m) => {
                const coordenada = JSON.parse(m.body);
                const puntoNuevo = [coordenada.x, coordenada.y];
                console.log("Coordenada recibida: " + puntoNuevo);

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
        // Mapa
        <MapContainer center={position} zoom={13} scrollWheelZoom={false}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={posicionCoche} icon={svgIconoCoche} />
        </MapContainer>
    );
}
