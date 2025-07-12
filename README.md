# chat-vip
Interactuar con un LLM mediante personajes famosos con sus voces clonadas.

<img width="555" height="681" alt="Captura de pantalla 2025-07-12 a las 16 31 13" src="https://github.com/user-attachments/assets/eb233254-9a8f-4760-9b61-8145bd782cfd" />

Uso:
1. pulsamos "Activar audio" para confirmar que el navegador nos permitirá emitir sonido.
2. pulsamos "Activar VIP" para confirmar que el LLM está funcionando.
3. pulsamos "Activar lectura en voz alta" para confirmar que queremos escuchar la voz, además de ver el texto de la respuesta.
4. elegimos el personaje. Tanto en voz como en personalidad.
5. pulsamos el botón "Empezar a escuchar". Si la página pide permiso para utilizar el micrófono, aceptamos.
6. cuando hayamos terminado la frase, lo escuchado aparece en la caja "Texto escuchado".
7. a continuación, se produce la consulta al LLM. El resultado aparece en la caja "Respuesta del VIP".
8. cuando la página haya recibido el audio correspondiente a ese texto, el botón "Reproducir respuesta" se habilita.
9. al pulsarlo, escucharemos la respuesta en la voz del personaje elegido.
10. podemos interrumpir la locución de la respuesta pulsando "Empezar a escuchar".
11. podemos repetir la locución pulsando de nuevo "Reproducir respuesta".
12. podemos detener la escucha pulsando "Detener escucha".

Para el LLM usamos Ollama con Gemma3, por ejemplo.

Para la transcripción de texto a voz necesitamos una API KEY de Speechify. Pueden ser voces estándar o voces clonadas.

La instalación necesita:
- los ficheros básicos son "index.html", "script.js", "style.css" y "tts.php"
- alojar la página en un servidor con HTTPS habilitado. El acceso al micróno lo necesita.
- el servidor necesita tener soporte PHP para ocultar el API KEY durante la comunicación con Speechify. En ese fichero "tts.php" debemos ponerla en "$api_key".
- en "index.html" añadiremos la identidad de los personajes y el VoiceID de su voz. Es un "option" dentro de un "select". Debemos indicar también el tipo de modelo.
- dado que el servicio de Speechify tiene un coste, podemos utilizar ficheros ".htaccess" para proteger el acceso a la página. Como ejemplo en "utils" he dejado un "htaccess".
- si el servidor Ollama está en una máquina remota, podemos hacer un túnel y preparar un endpoint en apache. Como ejemplo en "utils" están los ficheros "site.apache2" y "tunel-ollama-up.sh"
