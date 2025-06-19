<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/auth.php';

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

// En tus archivos PHP (doctores.php, farmacia.php, etc.)
if ($user['rol'] !== 'recepcionista' && $user['rol'] !== 'recepcion') {
    http_response_code(403);
    echo json_encode(array("message" => "Acceso no autorizado."));
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

try {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $db->prepare("SELECT * FROM farmacia_encargados WHERE id = ?");
                $stmt->execute([$id]);
                $encargado = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($encargado) {
                    echo json_encode($encargado);
                } else {
                    http_response_code(404);
                    echo json_encode(["message" => "Encargado no encontrado."]);
                }
            } else {
                $stmt = $db->query("SELECT * FROM farmacia_encargados");
                $encargados = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($encargados);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);

            if (!isset($data['nombre']) || !isset($data['email']) || !isset($data['turno'])) {
                http_response_code(400);
                echo json_encode(["message" => "Datos incompletos."]);
                exit;
            }

            $query = "INSERT INTO farmacia_encargados (nombre, email, turno) VALUES (?, ?, ?)";
            $stmt = $db->prepare($query);
            $stmt->execute([
                $data['nombre'],
                $data['email'],
                $data['turno']
            ]);

            $newId = $db->lastInsertId();
            echo json_encode(["message" => "Encargado creado.", "id" => $newId]);
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(["message" => "ID de encargado requerido."]);
                exit;
            }

            $data = json_decode(file_get_contents("php://input"), true);

            $query = "UPDATE farmacia_encargados SET nombre = ?, email = ?, turno = ? WHERE id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([
                $data['nombre'],
                $data['email'],
                $data['turno'],
                $id
            ]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(["message" => "Encargado actualizado."]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Encargado no encontrado."]);
            }
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(["message" => "ID de encargado requerido."]);
                exit;
            }

            $query = "DELETE FROM farmacia_encargados WHERE id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(["message" => "Encargado eliminado."]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Encargado no encontrado."]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["message" => "Método no permitido."]);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en base de datos: " . $e->getMessage()]);
}
?>