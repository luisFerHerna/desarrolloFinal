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
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $_GET['id'] ?? null;

    switch ($method) {
        case 'GET':
            $query = "SELECT id, nombre, email FROM usuarios WHERE rol = 'distribuidor'";
            $stmt = $db->prepare($query);
            $stmt->execute();

            $distribuidores = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode($distribuidores);
            break;

        case 'POST':
            if (!isset($input['nombre']) || !isset($input['email']) || !isset($input['password'])) {
                http_response_code(400);
                echo json_encode(["message" => "Faltan campos obligatorios (nombre, email, password)."]);
                exit();
            }

            $query = "INSERT INTO usuarios (nombre, email, password, rol) 
                      VALUES (:nombre, :email, :password, 'distribuidor')";
            $stmt = $db->prepare($query);

            $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
            
            $stmt->bindParam(':nombre', $input['nombre']);
            $stmt->bindParam(':email', $input['email']);
            $stmt->bindParam(':password', $hashedPassword);

            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode([
                    "message" => "Distribuidor creado exitosamente.", 
                    "id" => $db->lastInsertId()
                ]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "No se pudo crear el distribuidor."]);
            }
            break;

        case 'PUT':
            if (!$id || !isset($input['nombre']) || !isset($input['email'])) {
                http_response_code(400);
                echo json_encode(["message" => "Faltan campos obligatorios (id, nombre, email)."]);
                exit();
            }

            $query = "UPDATE usuarios SET nombre = :nombre, email = :email";
            $params = [':nombre' => $input['nombre'], ':email' => $input['email']];
            
            if (isset($input['password']) && !empty($input['password'])) {
                $query .= ", password = :password";
                $params[':password'] = password_hash($input['password'], PASSWORD_DEFAULT);
            }
            
            $query .= " WHERE id = :id AND rol = 'distribuidor'";
            $params[':id'] = $id;
            
            $stmt = $db->prepare($query);
            
            if ($stmt->execute($params)) {
                http_response_code(200);
                echo json_encode(["message" => "Distribuidor actualizado exitosamente."]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "No se pudo actualizar el distribuidor."]);
            }
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(["message" => "ID no proporcionado."]);
                exit();
            }

            $query = "DELETE FROM usuarios WHERE id = :id AND rol = 'distribuidor'";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode(["message" => "Distribuidor eliminado exitosamente."]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "No se pudo eliminar el distribuidor."]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["message" => "Método no permitido."]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "message" => "Error interno del servidor: " . $e->getMessage(),
        "trace" => $e->getTraceAsString() // Solo para desarrollo
    ]);
}
?>