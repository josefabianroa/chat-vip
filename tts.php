<?php
// tts.php

// Cambia esto por tu clave real
$api_key = 'tu-clave-api-speechify';

header('Content-Type: application/json');

// Obtener los datos del cuerpo del POST
$input = json_decode(file_get_contents('php://input'), true);

$text = $input['text'] ?? '';
$voice = $input['voice'] ?? 'simba';
$model = $input['model'] ?? 'multilingual';


// Validación básica
if (empty($text)) {
  http_response_code(400);
  echo json_encode(['error' => 'Texto vacío']);
  exit;
}


// Preparar la solicitud a Speechify
$url = 'https://api.sws.speechify.com/v1/audio/speech';
$payload = json_encode([
  'voice_id' => $voice,
  'model' => $model,
  'input' => $text,
  'format' => 'wav'
]);

$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => $payload,
  CURLOPT_HTTPHEADER => [
    "Content-Type: application/json",
    "Authorization: Bearer $api_key"
  ]
]);

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Reenviar la respuesta de Speechify al navegador
http_response_code($httpcode);
echo $response;

