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
            // Asegúrate de incluir 'direccion' y 'prioridad' en la consulta SELECT
            $query = "SELECT id, nombre, email, telefono, direccion, prioridad FROM pacientes";
            $stmt = $db->prepare($query);
            $stmt->execute();

            $pacientes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode($pacientes);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);

            // Validar que los campos obligatorios estén presentes
            if (!isset($data['nombre']) || !isset($data['email']) || !isset($data['telefono']) || !isset($data['direccion']) || !isset($data['prioridad'])) {
                http_response_code(400); // Bad Request
                echo json_encode(["message" => "Faltan campos obligatorios (nombre, email, telefono, direccion, prioridad)."]);
                exit();
            }

            $query = "INSERT INTO pacientes (nombre, email, telefono, direccion, prioridad) VALUES (:nombre, :email, :telefono, :direccion, :prioridad)";
            $stmt = $db->prepare($query);

            $stmt->bindParam(':nombre', $data['nombre']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':telefono', $data['telefono']);
            $stmt->bindParam(':direccion', $data['direccion']); // Bind de direccion
            $stmt->bindParam(':prioridad', $data['prioridad']); // Bind de prioridad

            if ($stmt->execute()) {
                http_response_code(201); // Created
                echo json_encode(["message" => "Paciente creado exitosamente.", "id" => $db->lastInsertId()]);
            } else {
                http_response_code(500); // Internal Server Error
                echo json_encode(["message" => "No se pudo crear el paciente."]);
            }
            break;

        case 'PUT':
            // Obtener el ID del paciente desde la URL o el cuerpo
            $id = isset($_GET['id']) ? $_GET['id'] : (isset($_SERVER['QUERY_STRING']) ? explode('=', $_SERVER['QUERY_STRING'])[1] : null);
            $data = json_decode(file_get_contents("php://input"), true);

            if (!$id) {
                http_response_code(400);
                echo json_encode(["message" => "Se requiere ID para actualizar."]);
                exit();
            }

            // Validar que los campos obligatorios estén presentes
            if (!isset($data['nombre']) || !isset($data['email']) || !isset($data['telefono']) || !isset($data['direccion']) || !isset($data['prioridad'])) {
                http_response_code(400); // Bad Request
                echo json_encode(["message" => "Faltan campos obligatorios para actualizar (nombre, email, telefono, direccion, prioridad)."]);
                exit();
            }

            $query = "UPDATE pacientes SET nombre = :nombre, email = :email, telefono = :telefono, direccion = :direccion, prioridad = :prioridad WHERE id = :id";
            $stmt = $db->prepare($query);

            $stmt->bindParam(':nombre', $data['nombre']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':telefono', $data['telefono']);
            $stmt->bindParam(':direccion', $data['direccion']);
            $stmt->bindParam(':prioridad', $data['prioridad']);
            $stmt->bindParam(':id', $id);

            if ($stmt->execute()) {
                http_response_code(200); // OK
                echo json_encode(["message" => "Paciente actualizado exitosamente."]);
            } else {
                http_response_code(500); // Internal Server Error
                echo json_encode(["message" => "No se pudo actualizar el paciente."]);
            }
            break;

        case 'DELETE':
            $id = isset($_GET['id']) ? $_GET['id'] : (isset($_SERVER['QUERY_STRING']) ? explode('=', $_SERVER['QUERY_STRING'])[1] : null);

            if (!$id) {
                http_response_code(400);
                echo json_encode(["message" => "Se requiere ID para eliminar."]);
                exit();
            }

            $query = "DELETE FROM pacientes WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);

            if ($stmt->execute()) {
                http_response_code(200); // OK
                echo json_encode(["message" => "Paciente eliminado exitosamente."]);
            } else {
                http_response_code(500); // Internal Server Error
                echo json_encode(["message" => "No se pudo eliminar el paciente."]);
            }
            break;

        case 'OPTIONS':
            // Pre-flight request. No Content.
            http_response_code(204);
            exit();

        default:
            http_response_code(405);
            echo json_encode(["message" => "Método no permitido."]);
            break;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error interno del servidor: " . $e->getMessage()]);
}
?>