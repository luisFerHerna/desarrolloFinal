<?php
class Database {
    private $host = 'db'; // Nombre del servicio en docker-compose
    private $db_name = 'hospital_db'; // Nombre de la BD
    private $username = 'hospital_user'; // Usuario definido en docker-compose
    private $password = 'hospital_pass'; // Contraseña definida en docker-compose
    public $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            error_log("Error de conexión: " . $exception->getMessage());
            throw $exception; // Relanza la excepción para manejo superior
        }

        return $this->conn;
    }
}
?>