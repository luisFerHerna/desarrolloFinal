<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
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

if ($user['rol'] !== 'recepcionista' && $user['rol'] !== 'doctor') {
    http_response_code(403);
    echo json_encode(array("message" => "Acceso no autorizado."));
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$fecha = $_GET['fecha'] ?? null;
$force = isset($_GET['force']) && $_GET['force'] == '1';

switch ($method) {
    case 'GET':
        // Obtener citas
        $query = "SELECT c.*, p.nombre as paciente_nombre, d.nombre as doctor_nombre 
                  FROM citas c
                  JOIN pacientes p ON c.paciente_id = p.id
                  JOIN doctores d ON c.doctor_id = d.id";
        
        $params = [];
        
        if ($id) {
            $query .= " WHERE c.id = ?";
            $params[] = $id;
        } elseif ($fecha) {
            $query .= " WHERE c.fecha = ?";
            $params[] = $fecha;
        }
        
        $query .= " ORDER BY c.prioridad DESC, c.fecha ASC, c.hora ASC";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $citas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($citas);
        break;
        
    case 'POST':
        // Crear nueva cita
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['paciente_id']) || !isset($data['doctor_id']) || 
            !isset($data['fecha']) || !isset($data['hora']) || 
            !isset($data['prioridad']) || !isset($data['motivo'])) {
            http_response_code(400);
            echo json_encode(array("message" => "Datos incompletos."));
            exit;
        }
        
        // Verificar disponibilidad del doctor
        $query = "SELECT COUNT(*) FROM citas 
                  WHERE doctor_id = ? AND fecha = ? AND hora = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$data['doctor_id'], $data['fecha'], $data['hora']]);
        
        if ($stmt->fetchColumn() > 0) {
            http_response_code(409);
            echo json_encode(array("message" => "El doctor ya tiene una cita programada en ese horario."));
            exit;
        }
        
        $query = "INSERT INTO citas 
                  (paciente_id, doctor_id, fecha, hora, prioridad, motivo, notas) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $db->prepare($query);
        
        $success = $stmt->execute([
            $data['paciente_id'],
            $data['doctor_id'],
            $data['fecha'],
            $data['hora'],
            $data['prioridad'],
            $data['motivo'],
            $data['notas'] ?? null
        ]);
        
        if ($success) {
            $newId = $db->lastInsertId();
            http_response_code(201);
            echo json_encode(array("message" => "Cita creada.", "id" => $newId));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Error al crear cita."));
        }
        break;
        
    case 'PUT':
        // Actualizar cita
        if (!$id) {
            http_response_code(400);
            echo json_encode(array("message" => "ID de cita requerido."));
            exit;
        }
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Verificar si la cita existe
        $stmt = $db->prepare("SELECT * FROM citas WHERE id = ?");
        $stmt->execute([$id]);
        $cita = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$cita) {
            http_response_code(404);
            echo json_encode(array("message" => "Cita no encontrada."));
            exit;
        }
        
        // Verificar disponibilidad del doctor si se cambia el doctor o el horario
        if ((isset($data['doctor_id']) && $data['doctor_id'] != $cita['doctor_id']) || 
            (isset($data['fecha']) && $data['fecha'] != $cita['fecha']) || 
            (isset($data['hora']) && $data['hora'] != $cita['hora'])) {
            
            $doctorId = $data['doctor_id'] ?? $cita['doctor_id'];
            $fecha = $data['fecha'] ?? $cita['fecha'];
            $hora = $data['hora'] ?? $cita['hora'];
            
            $query = "SELECT COUNT(*) FROM citas 
                      WHERE doctor_id = ? AND fecha = ? AND hora = ? AND id != ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$doctorId, $fecha, $hora, $id]);
            
            if ($stmt->fetchColumn() > 0) {
                http_response_code(409);
                echo json_encode(array("message" => "El doctor ya tiene una cita programada en ese horario."));
                exit;
            }
        }
        
        $query = "UPDATE citas SET 
                  paciente_id = :paciente_id, 
                  doctor_id = :doctor_id, 
                  fecha = :fecha, 
                  hora = :hora, 
                  prioridad = :prioridad, 
                  motivo = :motivo, 
                  notas = :notas 
                  WHERE id = :id";
        
        $stmt = $db->prepare($query);
        
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':paciente_id', $data['paciente_id'] ?? $cita['paciente_id']);
        $stmt->bindParam(':doctor_id', $data['doctor_id'] ?? $cita['doctor_id']);
        $stmt->bindParam(':fecha', $data['fecha'] ?? $cita['fecha']);
        $stmt->bindParam(':hora', $data['hora'] ?? $cita['hora']);
        $stmt->bindParam(':prioridad', $data['prioridad'] ?? $cita['prioridad']);
        $stmt->bindParam(':motivo', $data['motivo'] ?? $cita['motivo']);
        $stmt->bindParam(':notas', $data['notas'] ?? $cita['notas']);
        
        if ($stmt->execute()) {
            echo json_encode(array("message" => "Cita actualizada."));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Error al actualizar cita."));
        }
        break;
        
    case 'PATCH':
        // Actualizar parcialmente (para cambiar prioridad)
        if (!$id) {
            http_response_code(400);
            echo json_encode(array("message" => "ID de cita requerido."));
            exit;
        }
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['prioridad'])) {
            http_response_code(400);
            echo json_encode(array("message" => "Campo 'prioridad' requerido."));
            exit;
        }
        
        $query = "UPDATE citas SET prioridad = ? WHERE id = ?";
        $stmt = $db->prepare($query);
        
        if ($stmt->execute([$data['prioridad'], $id])) {
            echo json_encode(array("message" => "Prioridad de cita actualizada."));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Error al actualizar prioridad."));
        }
        break;
        
    case 'DELETE':
        // Eliminar cita
        if (!$id) {
            http_response_code(400);
            echo json_encode(array("message" => "ID de cita requerido."));
            exit;
        }
        
        // Verificar si la cita tiene una receta asociada
        $checkReceta = $db->prepare("SELECT COUNT(*) FROM recetas WHERE cita_id = ?");
        $checkReceta->execute([$id]);
        $hasReceta = $checkReceta->fetchColumn() > 0;
        
        if ($hasReceta && !$force) {
            http_response_code(409);
            echo json_encode(array(
                "message" => "No se puede eliminar la cita porque tiene una receta asociada.",
                "error" => "Cita asociada a una receta"
            ));
            exit;
        }
        
        // Si hay receta y force=true, eliminar primero la receta
        if ($hasReceta && $force) {
            $deleteReceta = $db->prepare("DELETE FROM recetas WHERE cita_id = ?");
            $deleteReceta->execute([$id]);
            
            // También eliminar los medicamentos asociados a la receta
            $deleteMedicamentos = $db->prepare("DELETE FROM receta_medicamentos WHERE receta_id IN (SELECT id FROM recetas WHERE cita_id = ?)");
            $deleteMedicamentos->execute([$id]);
        }
        
        $query = "DELETE FROM citas WHERE id = ?";
        $stmt = $db->prepare($query);
        
        if ($stmt->execute([$id])) {
            echo json_encode(array("message" => "Cita eliminada."));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Error al eliminar cita."));
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Método no permitido."));
        break;
}
?>