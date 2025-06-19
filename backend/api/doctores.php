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
            $query = "SELECT d.id, u.nombre, u.email, d.especialidad 
                      FROM doctores d
                      JOIN usuarios u ON d.usuario_id = u.id";
            $stmt = $db->prepare($query);
            $stmt->execute();

            $doctores = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode($doctores);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);

            if (!isset($data['nombre']) || !isset($data['email']) || !isset($data['especialidad']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode(["message" => "Faltan campos obligatorios (nombre, email, especialidad, password)."]);
                exit();
            }

            // Primero crear el usuario
            $query = "INSERT INTO usuarios (nombre, email, password, rol) VALUES (:nombre, :email, :password, 'doctor')";
            $stmt = $db->prepare($query);

            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            
            $stmt->bindParam(':nombre', $data['nombre']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':password', $hashedPassword);

            if ($stmt->execute()) {
                $usuarioId = $db->lastInsertId();
                
                // Luego crear el doctor
                $query = "INSERT INTO doctores (usuario_id, especialidad) VALUES (:usuario_id, :especialidad)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':usuario_id', $usuarioId);
                $stmt->bindParam(':especialidad', $data['especialidad']);

                if ($stmt->execute()) {
                    http_response_code(201);
                    echo json_encode(["message" => "Doctor creado exitosamente.", "id" => $db->lastInsertId()]);
                } else {
                    // Revertir la creación del usuario si falla la creación del doctor
                    $db->query("DELETE FROM usuarios WHERE id = $usuarioId");
                    http_response_code(500);
                    echo json_encode(["message" => "No se pudo crear el doctor."]);
                }
            } else {
                http_response_code(500);
                echo json_encode(["message" => "No se pudo crear el usuario para el doctor."]);
            }
            break;

        case 'PUT':
    $id = $_GET['id'] ?? null;
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$id || !isset($data['nombre']) || !isset($data['email']) || !isset($data['especialidad'])) {
        http_response_code(400);
        echo json_encode(["message" => "Faltan campos obligatorios (id, nombre, email, especialidad)."]);
        exit();
    }

    // Actualizar usuario
    $query = "UPDATE usuarios SET nombre = :nombre, email = :email";
    $params = [':nombre' => $data['nombre'], ':email' => $data['email']];
    
    if (isset($data['password']) && !empty($data['password'])) {
        $query .= ", password = :password";
        $params[':password'] = password_hash($data['password'], PASSWORD_DEFAULT);
    }
    
    $query .= " WHERE id = (SELECT usuario_id FROM doctores WHERE id = :doctor_id)";
    $params[':doctor_id'] = $id;
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    
    // Actualizar especialidad del doctor
    $query = "UPDATE doctores SET especialidad = :especialidad WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':especialidad', $data['especialidad']);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Doctor actualizado exitosamente."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "No se pudo actualizar el doctor."]);
    }
    break;
        case 'DELETE':
            $id = $_GET['id'] ?? null;

            if (!$id) {
                http_response_code(400);
                echo json_encode(["message" => "Falta el ID del doctor."]);
                exit();
            }

            // Primero eliminar el doctor
            $query = "DELETE FROM doctores WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);

            if ($stmt->execute()) {
                // Luego eliminar el usuario asociado
                $query = "DELETE FROM usuarios WHERE id = (SELECT usuario_id FROM doctores WHERE id = :id)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $id);
                $stmt->execute();

                http_response_code(200);
                echo json_encode(["message" => "Doctor eliminado exitosamente."]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "No se pudo eliminar el doctor."]);
            }
            break;        
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