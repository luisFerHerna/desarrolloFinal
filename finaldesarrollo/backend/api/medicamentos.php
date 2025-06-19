<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once __DIR__ . '/database.php';
// Manejo de la solicitud OPTIONS (preflight request de CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $database = new Database();
    $pdo = $database->getConnection();

    $method = $_SERVER['REQUEST_METHOD'];
    $id = $_GET['id'] ?? null;

    switch ($method) {
        case 'GET':
            if ($id) {
                // Obtener un solo medicamento por ID
                $stmt = $pdo->prepare("SELECT id, nombre, descripcion, cantidad, precio FROM medicamentos WHERE id = ?");
                $stmt->execute([$id]);
                $medicamento = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($medicamento) {
                    echo json_encode($medicamento);
                } else {
                    http_response_code(404);
                    echo json_encode(["message" => "Medicamento no encontrado."]);
                }
            } else {
                // Obtener todos los medicamentos
                $stmt = $pdo->query("SELECT id, nombre, descripcion, cantidad, precio FROM medicamentos");
                $medicamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($medicamentos);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);

            if (!isset($data['nombre']) || !isset($data['descripcion']) || !isset($data['cantidad']) || !isset($data['precio'])) {
                http_response_code(400);
                echo json_encode(["message" => "Datos incompletos para agregar medicamento."]);
                exit();
            }

            $query = "INSERT INTO medicamentos (nombre, descripcion, cantidad, precio) VALUES (?, ?, ?, ?)";
            $stmt = $pdo->prepare($query);
            $stmt->execute([
                $data['nombre'],
                $data['descripcion'],
                $data['cantidad'],
                $data['precio']
            ]);

            $newMedicamentoId = $pdo->lastInsertId();
            echo json_encode(["message" => "Medicamento agregado exitosamente.", "id" => $newMedicamentoId]);
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(["message" => "ID del medicamento es requerido para actualizar."]);
                exit();
            }

            $data = json_decode(file_get_contents("php://input"), true);

            if (!isset($data['nombre']) || !isset($data['descripcion']) || !isset($data['cantidad']) || !isset($data['precio'])) {
                http_response_code(400);
                echo json_encode(["message" => "Datos incompletos para actualizar medicamento."]);
                exit();
            }

            $query = "UPDATE medicamentos SET nombre = ?, descripcion = ?, cantidad = ?, precio = ? WHERE id = ?";
            $stmt = $pdo->prepare($query);
            $stmt->execute([
                $data['nombre'],
                $data['descripcion'],
                $data['cantidad'],
                $data['precio'],
                $id
            ]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(["message" => "Medicamento actualizado exitosamente."]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Medicamento no encontrado o no hubo cambios."]);
            }
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(["message" => "ID del medicamento es requerido para eliminar."]);
                exit();
            }

            // Verificar si el medicamento está asociado a recetas
            $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM receta_medicamentos WHERE medicamento_id = ?");
            $checkStmt->execute([$id]);
            if ($checkStmt->fetchColumn() > 0) {
                http_response_code(409);
                echo json_encode(["message" => "No se puede eliminar el medicamento porque está asociado a una o más recetas."]);
                exit();
            }

            $query = "DELETE FROM medicamentos WHERE id = ?";
            $stmt = $pdo->prepare($query);
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(["message" => "Medicamento eliminado exitosamente."]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Medicamento no encontrado."]);
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
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["error" => $e->getMessage()]);
}
?>