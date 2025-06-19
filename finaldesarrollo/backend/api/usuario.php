<?php
// No es necesario error_reporting aquí, ya que auth.php lo maneja al inicio
// require_once 'database.php'; // Esto ya está incluido por auth.php, o debería ser un path absoluto si se usa directamente

class Usuario {
    private $conn;
    private $table = 'usuarios';

    public $id;
    public $nombre;
    public $email;
    public $password; // En esta clase, este contendrá la contraseña sin hashear al intentar login
    public $rol;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function login() {
        // Consulta para obtener el usuario por email
        $query = "SELECT id, nombre, email, password, rol FROM " . $this->table . " 
                  WHERE email = :email 
                  LIMIT 1"; // Limitar a 1 por si hay duplicados (aunque no debería)

        $stmt = $this->conn->prepare($query);
        // Sanitizar el email antes de usarlo en la consulta
        // Ojo: htmlspecialchars y strip_tags pueden no ser los más adecuados para un email,
        // pero para evitar inyección SQL, PDO::bindParam ya es suficiente
        $sanitized_email = htmlspecialchars(strip_tags($this->email));
        $stmt->bindParam(':email', $sanitized_email);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        // --- DEPURACIÓN AQUI ---
        error_log("Usuario::login(): Resultados de la consulta para email " . $sanitized_email . ": " . print_r($row, true));
        
        if ($row) {
            error_log("Usuario::login(): Password del formulario: '" . $this->password . "'");
            error_log("Usuario::login(): Password hasheado de la DB: '" . $row['password'] . "'");
            
            // Realizar la verificación de la contraseña hasheada
            if (password_verify($this->password, $row['password'])) {
                error_log("Usuario::login(): password_verify() fue TRUE para " . $sanitized_email);
                // Si la verificación es exitosa, asigna las propiedades del usuario
                $this->id = $row['id'];
                $this->nombre = $row['nombre'];
                $this->email = $row['email']; // Asigna el email real de la DB
                $this->rol = $row['rol'];
                return true; // Login exitoso
            } else {
                error_log("Usuario::login(): password_verify() fue FALSE para " . $sanitized_email . " (contraseña no coincide).");
            }
        } else {
            error_log("Usuario::login(): Usuario no encontrado en la DB para email: " . $sanitized_email);
        }
        // --- FIN DEPURACIÓN ---

        return false; // Login fallido
    }
}
?>