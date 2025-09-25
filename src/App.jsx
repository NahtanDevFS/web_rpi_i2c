import { useState, useEffect } from "react";
import "./App.css";

//LLamada al servidor
const API_BASE_URL = "https://topologic-quarrelingly-terri.ngrok-free.app";

function App() {
  //Estados
  const [sensorData, setSensorData] = useState({ distancia: "--" });
  const [isConnected, setIsConnected] = useState(false);

  //Estados para las lineas de cada LCD
  const [linesLcd1, setLinesLcd1] = useState(["", ""]);
  const [linesLcd2, setLinesLcd2] = useState(["", "", "", ""]);

  //Efecto para obtener datos del sensor
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/data`, {
          method: "GET",
          headers: { "ngrok-skip-browser-warning": "true" },
          signal: AbortSignal.timeout(5000), //Evita que se quede esperando indefinidamente
        });

        if (!response.ok) throw new Error("Respuesta de red no fue OK");

        const data = await response.json();
        setSensorData(data);
        if (!isConnected) setIsConnected(true);
      } catch (error) {
        console.error("Error de conexion:", error);
        if (isConnected) setIsConnected(false);
        setSensorData({ distancia: "--" });
      }
    };

    fetchData(); // Llamada inicial
    const intervalId = setInterval(fetchData, 1500); //Refresca cada 1.5 segundos

    return () => clearInterval(intervalId); //Limpieza al desmontar
  }, [isConnected]);

  //Manejador de envio de formularios para las LCD
  const handleLcdSubmit = async (endpoint, lines, setLinesCallback) => {
    //Expresión regular para evitar caracteres especiales
    const specialCharRegex = /[^a-zA-Z0-9\s.,:;'"!?@#$%^&*()_+\-=[\]{}]/g;
    for (const line of lines) {
      if (specialCharRegex.test(line)) {
        alert(
          "El texto contiene caracteres no permitidos, por favor, use solo letras, números y símbolos comunes"
        );
        return; //Detiene el envio si encuentra caracteres invalidos
      }
    }

    const body = lines.reduce((obj, line, i) => {
      obj[`line${i + 1}`] = line;
      return obj;
    }, {});

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Fallo al enviar el mensaje");

      setLinesCallback(Array(lines.length).fill("")); //Limpia los inputs
    } catch (error) {
      console.error(`Error al enviar mensaje a ${endpoint}:`, error);
      alert(`No se pudo enviar el mensaje a la pantalla.`);
    }
  };

  //Funciones de evento para los formularios
  const handleLcd1Submit = (e) => {
    e.preventDefault();
    handleLcdSubmit("/api/message_lcd1", linesLcd1, setLinesLcd1);
  };

  const handleLcd2Submit = (e) => {
    e.preventDefault();
    handleLcdSubmit("/api/message_lcd2", linesLcd2, setLinesLcd2);
  };

  return (
    <div className="app-container">
      <header>
        <h1>Control Remoto Raspberry Pi I2C</h1>
        <p className="subtitle">Jonathan David Franco Sosa 1190-22-515</p>
        <p className="subtitle">Mánleo Alexander Chacón Chacón 1190-22-7368</p>
      </header>

      <section className="status-panel">
        <div className="status-row">
          <div className="status-item">
            <span className="status-label">Conexión:</span>
            <span
              id="connection-status"
              className={isConnected ? "connected" : "disconnected"}
            >
              {isConnected ? "Conectado" : "Desconectado"}
            </span>
          </div>
        </div>
        <div className="status-row">
          <div className="status-item">
            <span className="status-label">Distancia del sensor vl53l0x:</span>
            <span className="distance-value">{sensorData.distancia} mm</span>
          </div>
        </div>
      </section>

      <main className="lcd-controls">
        <div className="lcd-form-container">
          <h2>Enviar Mensaje a LCD 1 (16x2)</h2>
          <h3>16 caracteres por fila y 2 filas</h3>
          <form onSubmit={handleLcd1Submit} className="lcd-form">
            {linesLcd1.map((line, index) => (
              <input
                key={index}
                type="text"
                value={line}
                onChange={(e) => {
                  const newLines = [...linesLcd1];
                  newLines[index] = e.target.value;
                  setLinesLcd1(newLines);
                }}
                placeholder={`Línea ${index + 1}`}
                maxLength="16"
                disabled={!isConnected}
              />
            ))}
            <button type="submit" disabled={!isConnected}>
              Enviar a LCD 1
            </button>
          </form>
        </div>

        <div className="lcd-form-container">
          <h2>Enviar Mensaje a LCD 2 (20x4)</h2>
          <h3>20 caracteres por fila y 4 filas</h3>
          <form onSubmit={handleLcd2Submit} className="lcd-form">
            {linesLcd2.map((line, index) => (
              <input
                key={index}
                type="text"
                value={line}
                onChange={(e) => {
                  const newLines = [...linesLcd2];
                  newLines[index] = e.target.value;
                  setLinesLcd2(newLines);
                }}
                placeholder={`Línea ${index + 1}`}
                maxLength="20"
                disabled={!isConnected}
              />
            ))}
            <button type="submit" disabled={!isConnected}>
              Enviar a LCD 2
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default App;
