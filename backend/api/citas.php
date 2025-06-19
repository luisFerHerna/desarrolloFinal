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
    $input = json_decode(file_get_contents('php://input'), true); // Decode as associative array
    $id = $_GET['id'] ?? null;
    $fecha = $_GET['fecha'] ?? null;

    switch ($method) {
        case 'GET':
            $query = "SELECT c.*, p.nombre as paciente_nombre, u.nombre as doctor_nombre
                      FROM citas c
                      JOIN pacientes p ON c.paciente_id = p.id
                      JOIN doctores d ON c.doctor_id = d.id
                      JOIN usuarios u ON d.usuario_id = u.id";

            if ($fecha) {
                $query .= " WHERE c.fecha = :fecha";
            }

            if ($id) {
                $query .= ($fecha ? " AND" : " WHERE") . " c.id = :id";
            }

            $query .= " ORDER BY c.fecha ASC, c.hora ASC";

            $stmt = $db->prepare($query);

            if ($fecha) {
                $stmt->bindParam(':fecha', $fecha);
            }

            if ($id) {
                $stmt->bindParam(':id', $id);
            }

            $stmt->execute();
            $citas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode($citas);
            break;

        case 'POST':
            // Asegúrate de que los campos obligatorios estén presentes
            if (empty($input['paciente_id']) || empty($input['doctor_id']) || empty($input['fecha']) || empty($input['hora'])) {
                http_response_code(400);
                echo json_encode(["message" => "Datos obligatorios incompletos (paciente_id, doctor_id, fecha, hora son requeridos)."]);
                break;
            }

            $query = "INSERT INTO citas (paciente_id, doctor_id, fecha, hora, urgencia)
                      VALUES (:paciente_id, :doctor_id, :fecha, :hora, :urgencia)";
            $stmt = $db->prepare($query);

            $stmt->bindParam(':paciente_id', $input['paciente_id']);
            $stmt->bindParam(':doctor_id', $input['doctor_id']);
            $stmt->bindParam(':fecha', $input['fecha']);
            $stmt->bindParam(':hora', $input['hora']);
            $stmt->bindParam(':urgencia', $input['urgencia']);

            if ($stmt->execute()) {
                http_response_code(201); // Created
                echo json_encode(["message" => "Cita creada exitosamente."]);
            } else {
                http_response_code(400); // Bad Request
                echo json_encode(["message" => "No se pudo crear la cita. Verifique los datos e intente de nuevo."]);
            }
            break;

        case 'PUT':
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["message" => "ID de cita no proporcionado para actualizar."]);
                break;
            }
            if (empty($input['paciente_id']) || empty($input['doctor_id']) || empty($input['fecha']) || empty($input['hora'])) {
                http_response_code(400);
                echo json_encode(["message" => "Datos obligatorios incompletos para actualizar (paciente_id, doctor_id, fecha, hora son requeridos)."]);
                break;
            }

            $query = "UPDATE citas
                          SET paciente_id = :paciente_id,
                              doctor_id = :doctor_id,
                              fecha = :fecha,
                              hora = :hora,
                              urgencia = :urgencia,
                          WHERE id = :id";
            $stmt = $db->prepare($query);

            $stmt->bindParam(':paciente_id', $input['paciente_id']);
            $stmt->bindParam(':doctor_id', $input['doctor_id']);
            $stmt->bindParam(':fecha', $input['fecha']);
            $stmt->bindParam(':hora', $input['hora']);
            $stmt->bindParam(':urgencia', $input['urgencia']);
            $stmt->bindParam(':id', $id);

            if ($stmt->execute()) {
                http_response_code(200); // OK
                echo json_encode(["message" => "Cita actualizada exitosamente."]);
            } else {
                http_response_code(400); // Bad Request
                echo json_encode(["message" => "No se pudo actualizar la cita."]);
            }
            break;

        case 'DELETE':
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["message" => "ID no proporcionado para eliminar."]);
                break;
            }

            $query = "DELETE FROM citas WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);

            if ($stmt->execute()) {
                http_response_code(200); // OK
                echo json_encode(["message" => "Cita eliminada exitosamente."]);
            } else {
                http_response_code(400); // Bad Request
                echo json_encode(["message" => "No se pudo eliminar la cita."]);
            }
            break;

        default:
            http_response_code(405); // Method Not Allowed
            echo json_encode(["message" => "Método no permitido."]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["message" => "Error interno del servidor: " . $e->getMessage()]);
}
?>