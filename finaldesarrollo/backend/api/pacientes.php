<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

require_once __DIR__ . '/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            $query = "SELECT id, nombre, email, telefono FROM pacientes";
            $stmt = $db->prepare($query);
            $stmt->execute();

            $pacientes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode($pacientes);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);

            if (!$data) {
                throw new Exception("Datos inválidos");
            }

            $query = "INSERT INTO pacientes (nombre, email, telefono) VALUES (:nombre, :email, :telefono)";
            $stmt = $db->prepare($query);

            $stmt->bindParam(':nombre', $data['nombre']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':telefono', $data['telefono']);

            $stmt->execute();

            $nuevoPaciente = [
                "id" => $db->lastInsertId(),
                "nombre" => $data['nombre'],
                "email" => $data['email'],
                "telefono" => $data['telefono']
            ];

            echo json_encode($nuevoPaciente);
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Método no permitido"]);
            break;
    }

} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
