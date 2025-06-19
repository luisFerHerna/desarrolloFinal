<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

require_once __DIR__ . '/database.php';

try {
    $database = new Database();
    $pdo = $database->getConnection();

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $pacienteId = $_GET['paciente_id'] ?? null;

        $sql = "SELECT r.* FROM recetas r"; // Empezar con la tabla de recetas
        $params = [];

        if ($pacienteId) {
            $sql .= " WHERE r.paciente_id = ?";
            $params[] = $pacienteId;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $recetas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Para cada receta, obtener sus medicamentos asociados
        foreach ($recetas as &$receta) {
            $stmtMed = $pdo->prepare("SELECT rm.medicamento_id, rm.cantidad, rm.instrucciones, m.nombre FROM receta_medicamentos rm JOIN medicamentos m ON rm.medicamento_id = m.id WHERE rm.receta_id = ?");
            $stmtMed->execute([$receta['id']]);
            $receta['medicamentos'] = $stmtMed->fetchAll(PDO::FETCH_ASSOC);
        }
        unset($receta); // Romper la referencia con el último elemento

        echo json_encode($recetas);

    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data) {
            throw new Exception("Datos inválidos");
        }

        if (
            empty($data['paciente_id']) ||
            empty($data['doctor_id']) ||
            empty($data['medicamentos']) ||
            !is_array($data['medicamentos'])
        ) {
            throw new Exception("Campos obligatorios incompletos o formato de medicamentos incorrecto");
        }

        // Insertar receta
        $query = "INSERT INTO recetas (paciente_id, doctor_id, fecha, diagnostico, instrucciones) VALUES (?, ?, NOW(), ?, ?)";
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            $data['paciente_id'],
            $data['doctor_id'],
            $data['diagnostico'] ?? '',
            $data['instrucciones'] ?? ''
        ]);

        $recetaId = $pdo->lastInsertId();

        // Insertar medicamentos asociados a la receta en la tabla receta_medicamentos
        $queryMed = "INSERT INTO receta_medicamentos (receta_id, medicamento_id, cantidad, instrucciones) VALUES (?, ?, ?, ?)";
        $stmtMed = $pdo->prepare($queryMed);

        foreach ($data['medicamentos'] as $med) {
            if (
                !isset($med['medicamento_id']) ||
                !isset($med['cantidad'])
            ) {
                continue;
            }
            $stmtMed->execute([
                $recetaId,
                $med['medicamento_id'],
                $med['cantidad'],
                $med['instrucciones'] ?? ''
            ]);
        }

        echo json_encode([
            "success" => true,
            "receta_id" => $recetaId,
            "message" => "Receta guardada correctamente"
        ]);
    } else {
        http_response_code(405);
        echo json_encode(["error" => "Método no permitido"]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en base de datos: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["error" => $e->getMessage()]);
}
?>