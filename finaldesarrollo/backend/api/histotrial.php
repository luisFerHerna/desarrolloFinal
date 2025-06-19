<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';
require_once '../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$jwt = $auth->getJwtFromHeaders();

if (!$auth->validateToken($jwt)) {
    http_response_code(401);
    echo json_encode(array("message" => "Acceso denegado."));
    exit;
}

$user = $auth->getUserFromJwt($jwt);

if ($user['rol'] !== 'doctor') {
    http_response_code(403);
    echo json_encode(array("message" => "Acceso no autorizado."));
    exit;
}

$query = "SELECT r.*, p.nombre as paciente_nombre 
          FROM recetas r 
          JOIN pacientes p ON r.paciente_id = p.id 
          WHERE r.doctor_id = :doctor_id";

$stmt = $db->prepare($query);
$stmt->bindParam(':doctor_id', $user['id']);
$stmt->execute();

$recetas = $stmt->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode($recetas);