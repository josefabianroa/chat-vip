const startBtn = document.getElementById("startBtn");
const transcriptEl = document.getElementById("transcript");
const playBtn = document.getElementById('playBtn');

function setBotonEstado(enabled) {
  if (enabled) {
    playBtn.style.opacity = "1";
    playBtn.style.pointerEvents = "auto";
  } else {
    playBtn.style.opacity = "0.5";
    playBtn.style.pointerEvents = "none";
  }
}

// Cuando empiezas a pedir a Speechify
setBotonEstado(false);

let recognition;
let escuchando = false;

let recibidoAudio = false;

const checkAudioInterval = setInterval(() => {
  setBotonEstado(recibidoAudio);
}, 500);

if (!('webkitSpeechRecognition' in window)) {
  alert("Tu navegador no soporta la Web Speech API 😢");
} else {
  recognition = new webkitSpeechRecognition(); // Chrome usa este prefijo
  recognition.lang = "es-ES";
  // no continuo recognition.continuous = true;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = async (event) => {
    const texto = event.results[event.results.length - 1][0].transcript;

    recibidoAudio = false;

    document.getElementById("escuchado").value = texto;
    //transcriptEl.textContent = `🔊 ${texto}`;

    try {
      transcriptEl.textContent = "Escucha detenida";

      console.log(new Date().toLocaleString(), "pensando...");
      await new Promise(resolve => setTimeout(resolve, 0)); // fuerza repintado

      const respuesta = await enviarAOllama(texto);

      console.log(new Date().toLocaleString(), "tts...");
      // esto cuesta dinero 
      await reproducirConSpeechify(respuesta);

      console.log(new Date().toLocaleString(), "listo para reproducir");
    }
    catch (err) {
      console.error(new Date().toLocaleString(), "Error procesando texto con Ollama o reproduciendo:", err);
    }
  };

  recognition.onerror = (event) => {
    console.error(new Date().toLocaleString(), "Error de reconocimiento:", event.error);
  };

  recognition.onend = () => {
    if (escuchando) {
      // Reiniciar automáticamente
      // no continuo recognition.start();
      //console.log("escucha reiniciada");
	    
      // reinicio manual
      escuchando = false;
      transcriptEl.textContent = "Escucha detenida";
      console.log(new Date().toLocaleString(), "escucha detenida onend");
    }
  };
}

startBtn.addEventListener("click", () => {
  if (!escuchando) {
    if (recognition) {
      transcriptEl.textContent = "Escuchando...";
      document.getElementById('escuchado').value = '';
      document.getElementById('respuesta').value = '';

      // Detener reproducción si hay audio activo
      if (audioActual) {
        audioActual.pause();
        audioActual.currentTime = 0;
      }

      recognition.start();
      escuchando = true;
      console.log(new Date().toLocaleString(), "escucha iniciada");
    }
  }
});

document.getElementById("stopBtn").onclick = () => {
  if (escuchando) {
    recognition.stop();
    escuchando = false;
    console.log(new Date().toLocaleString(), "escucha detenida por el usuario");

    document.getElementById("escuchado").value = "";
    document.getElementById("respuesta").value = "";
    transcriptEl.textContent = "Escucha detenida";
  }
};

async function enviarAOllama(texto) {

  const selectVip = document.getElementById("voiceSelect");
  const vip = selectVip.options[selectVip.selectedIndex].text;
  console.log(new Date().toLocaleString(), "vip elegido: ", vip); // Ejemplo: "Español - Voz A"

  const textoVip = "asume la personalidad de " + vip + ", y contesta brevemente esta pregunta: " + texto;

  try {
    const response = await fetch("/ollama/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
	model: "gemma3:latest", // Cambia por el modelo que uses
	stream: false,
        messages: [
          { role: "user", content: textoVip }
        ]
      })
    });

    if (!response.ok) {
      throw new Error("Error en la respuesta de Ollama: " + response.statusText);
    }

    const data = await response.json();

    respuesta = data.message?.content || "Sin respuesta";
    console.log(new Date().toLocaleString(), "respuesta ", respuesta);

    respuesta = respuesta.replace(/\s*\([^)]*\)/g, '');
    console.log(new Date().toLocaleString(), "respuestaLimpia ", respuesta);

    // ✅ Mostrar en la caja de texto
    document.getElementById("respuesta").value = respuesta;

    return respuesta;

  } catch (error) {
    console.error(new Date().toLocaleString(), "Error enviando a Ollama:", error);
    return null;
  }
}

let audioActual = null;
let audioUrlAnterior = null;

async function reproducirConSpeechify(texto) {

  //recibidoAudio = false;

  const playBtn = document.getElementById('playBtn');

  const vozSelect = document.getElementById("voiceSelect");
  const opcionSel = vozSelect.selectedOptions[0];
  const voice = opcionSel.value;
  const modelo = opcionSel.dataset.model;

  base64Audio = null

  console.log(new Date().toLocaleString(), "solicitamos TTS ", voice, modelo, texto);

  fetch('tts.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: texto,
      voice: voice,
      model: modelo
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log(new Date().toLocaleString(), "✅ recibido tts");
    const base64Audio = data.audio_data;
    console.log(new Date().toLocaleString(), "Longitud base64:", base64Audio.length);
    console.log(new Date().toLocaleString(), typeof base64Audio);
    console.log(new Date().toLocaleString(), "Inicio de base64Audio:", base64Audio.substring(0, 100));

    // ⏹️ Detener cualquier reproducción anterior
    if (audioActual) {
      audioActual.pause();
      audioActual.currentTime = 0;
    }
    if (audioUrlAnterior) {
      URL.revokeObjectURL(audioUrlAnterior);
    }

    // 🔄 Convertir base64 a array de bytes
    const byteCharacters = atob(base64Audio);
    const byteNumbers = Array.from(byteCharacters, c => c.charCodeAt(0));
    const byteArray = new Uint8Array(byteNumbers);

    // 🎧 Crear blob y reproducir
    const blob = new Blob([byteArray], { type: "audio/wav" });
    console.log(new Date().toLocaleString(), "Blob size:", blob.size);
    console.log(new Date().toLocaleString(), "Blob type:", blob.type);

    const audioUrl = URL.createObjectURL(blob);
    audioUrlAnterior = audioUrl;
    audioActual = new Audio(audioUrl);
    //audioActual.play();

    recibidoAudio = true;
  })
  .catch(err => {
    console.error(new Date().toLocaleString(), "❌ error tts ", err);
  });

  playBtn.onclick = () => {
    playBtn.textContent = '⏳ Reproduciendo...';

    console.log(new Date().toLocaleString(), "Audio src:", audioActual.src);

    audioActual.play().catch(err => {
      console.error(new Date().toLocaleString(), "Error al reproducir:", err);
      playBtn.textContent = '🔊 Reproducir respuesta';
    });

    // Restaurar botón cuando termine
    audioActual.onended = () => {
      playBtn.textContent = '🔊 Reproducir respuesta';
    };
  };
}

document.getElementById("audioBtn").onclick = () => {

  console.log(new Date().toLocaleString(), "pulsado audioBtn");

  // Crear un contexto de audio
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 440; // A4

  // Conectar al destino (parlantes)
  osc.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.2); // sonido de 0.2 segundos

  // También sirve para desbloquear SpeechSynthesis
  const msg = new SpeechSynthesisUtterance("Audio activado");
  msg.lang = "es-ES";
  speechSynthesis.speak(msg);
};

document.getElementById("llmBtn").onclick = () => {

  console.log(new Date().toLocaleString(), "pulsado llmBtn");

  document.getElementById("respuesta").value = "";
  testOllama();
}

async function testOllama() {

  try {
    const response = await fetch("/ollama/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
	model: "gemma3:latest", // Cambia por el modelo que uses
	stream: false,
        messages: [
          { role: "user", content: "Hola" }
        ]
      })
    });

    if (!response.ok) {
      throw new Error("Error en la respuesta de Ollama: " + response.statusText);
    }

    const data = await response.json();

    respuesta = data.message?.content || "Sin respuesta";
    console.log(new Date().toLocaleString(), "respuesta ", respuesta);

    // ✅ Mostrar en la caja de texto
    document.getElementById("respuesta").value = respuesta;

    return respuesta;

  } catch (error) {
    console.error(new Date().toLocaleString(), "Error enviando a Ollama:", error);
    return null;
  }
}
