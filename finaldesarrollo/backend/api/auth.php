<?php
// Habilitar la visualización de errores (SOLO PARA DESARROLLO)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Encabezados CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Rutas de inclusión (ajusta si es necesario)
// Asegúrate de que estas rutas sean correctas desde la ubicación de auth.php
require_once __DIR__ . '/../vendor/autoload.php'; // Para JWT
require_once __DIR__ . '/../config.php';          // Para JWT_SECRET y APP_URL
require_once __DIR__ . '/database.php';           // Clase Database
require_once __DIR__ . '/usuario.php';            // Clase Usuario

use Firebase\JWT\JWT;

try {
    // Obtener los datos RAW de la solicitud POST
    $json = file_get_contents('php://input');
    $data = json_decode($json);

    // Depuración: Log de los datos recibidos
    error_log("auth.php: Datos recibidos (RAW JSON): " . $json);
    error_log("auth.php: Datos decodificados (PHP object): " . print_r($data, true));

    // Validar que se recibieron email y password
    if (!$data || !isset($data->email) || !isset($data->password)) {
        http_response_code(400); // Bad Request
        echo json_encode(["message" => "Email y password son requeridos"]);
        exit();
    }

    // Instanciar la base de datos y el usuario
    $database = new Database();
    $db = $database->getConnection();

    $usuario = new Usuario($db);
    $usuario->email = $data->email;
    $usuario->password = $data->password; // Contraseña en texto plano del formulario

    // Depuración: Log de las credenciales antes del intento de login
    error_log("auth.php: Intentando login para email: " . $usuario->email);
    error_log("auth.php: Password ingresado (sin hashear): " . $usuario->password); 

    // Intentar el login
    if ($usuario->login()) {
        // Login exitoso, generar JWT
        $payload = [
            "iss" => APP_URL, // Emisor (Issuer)
            "aud" => APP_URL, // Audiencia (Audience)
            "iat" => time(),  // Tiempo en que el token fue emitido (Issued At)
            "exp" => time() + 3600, // Expira en 1 hora (Expiration Time)
            "data" => [
                "id" => $usuario->id,
                "nombre" => $usuario->nombre,
                "email" => $usuario->email,
                "rol" => $usuario->rol
            ]
        ];

        // Asegúrate de que JWT_SECRET esté definido en tu config.php
        if (!defined('JWT_SECRET') || !JWT_SECRET) {
            throw new Exception("JWT_SECRET no está definido o está vacío en config.php");
        }

        $jwt = JWT::encode(
            $payload,
            JWT_SECRET,
            'HS256' // Algoritmo de hashing
        );
        
        http_response_code(200); // OK
        echo json_encode([
            "message" => "Login exitoso",
            "jwt" => $jwt,
            "user" => [ // Información del usuario para el frontend
                "id" => $usuario->id,
                "nombre" => $usuario->nombre,
                "email" => $usuario->email,
                "rol" => $usuario->rol
            ]
        ]);
        error_log("auth.php: Login exitoso para email: " . $usuario->email);
    } else {
        // Credenciales inválidas
        http_response_code(401); // Unauthorized
        echo json_encode(["message" => "Credenciales inválidas"]);
        error_log("auth.php: Login fallido (credenciales inválidas) para email: " . $usuario->email);
    }

} catch (Exception $e) {
    // Manejo de errores generales del servidor
    http_response_code(500); // Internal Server Error
    echo json_encode([
        "message" => "Error en el servidor",
        "error" => $e->getMessage()
    ]);
    error_log("auth.php: Excepción capturada: " . $e->getMessage() . " en " . $e->getFile() . " en la línea " . $e->getLine());
}
?>