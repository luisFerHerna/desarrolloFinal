CREATE DATABASE IF NOT EXISTS hospital_db;
USE hospital_db;


-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('doctor', 'farmacia', 'recepcion', 'paciente') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de doctores
CREATE TABLE doctores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    especialidad VARCHAR(100),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla de pacientes
CREATE TABLE pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_nacimiento DATE,
    genero ENUM('M', 'F', 'O')
);

-- Tabla de medicamentos
CREATE TABLE medicamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    cantidad INT NOT NULL DEFAULT 0,
    precio DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de citas
CREATE TABLE citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    doctor_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    urgencia ENUM('baja', 'media', 'alta') DEFAULT 'baja',
    estado ENUM('pendiente', 'completada', 'cancelada') DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    FOREIGN KEY (doctor_id) REFERENCES doctores(id)
);

-- Tabla de recetas
CREATE TABLE recetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cita_id INT,
    paciente_id INT NOT NULL,
    doctor_id INT NOT NULL,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cita_id) REFERENCES citas(id),
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    FOREIGN KEY (doctor_id) REFERENCES doctores(id)
);

-- Tabla de recetas_medicamentos (relación muchos a muchos)
CREATE TABLE recetas_medicamentos (
    receta_id INT NOT NULL,
    medicamento_id INT NOT NULL,
    cantidad INT NOT NULL,
    instrucciones TEXT,
    PRIMARY KEY (receta_id, medicamento_id),
    FOREIGN KEY (receta_id) REFERENCES recetas(id),
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id)
);

-- Insertar datos iniciales
-- Usuarios
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Dr. Juan Pérez', 'doctor@hospital.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor'),
('Farmacia Maria', 'farmacia@hospital.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'farmacia'),
('Recepcion Ana', 'recepcion@hospital.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'recepcion'),
('Paciente Carlos', 'paciente@hospital.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'paciente');

-- Doctores
INSERT INTO doctores (usuario_id, especialidad) VALUES 
(1, 'Cardiología');

-- Pacientes
INSERT INTO pacientes (nombre, email, telefono, direccion, fecha_nacimiento, genero) VALUES 
('Carlos López', 'carlos@example.com', '5551234567', 'Calle Falsa 123', '1985-05-15', 'M'),
('María García', 'maria@example.com', '5557654321', 'Avenida Siempreviva 742', '1990-08-22', 'F');

-- Medicamentos
INSERT INTO medicamentos (nombre, descripcion, cantidad, precio) VALUES 
('Paracetamol', 'Analgésico y antipirético', 100, 25.50),
('Ibuprofeno', 'Antiinflamatorio no esteroideo', 75, 32.75),
('Amoxicilina', 'Antibiótico de amplio espectro', 50, 45.00);

-- Citas
INSERT INTO citas (paciente_id, doctor_id, fecha, hora, urgencia) VALUES 
(1, 1, CURDATE() + INTERVAL 1 DAY, '10:00:00', 'baja'),
(2, 1, CURDATE() + INTERVAL 2 DAY, '15:30:00', 'media');
-- Agrega la columna 'direccion' si no existe
ALTER TABLE pacientes
ADD COLUMN direccion VARCHAR(255) NOT NULL DEFAULT 'Dirección no especificada';

-- Agrega la columna 'prioridad' si no existe, con un valor por defecto
ALTER TABLE pacientes
ADD COLUMN prioridad ENUM('alta', 'media', 'baja') NOT NULL DEFAULT 'media';

-- Si ya existen las columnas y quieres asegurarte de que sean NOT NULL
-- (ten cuidado si tienes datos existentes con valores NULL, necesitarás actualizarlos primero)
ALTER TABLE pacientes
MODIFY COLUMN direccion VARCHAR(255) NOT NULL;

ALTER TABLE pacientes
MODIFY COLUMN prioridad ENUM('alta', 'media', 'baja') NOT NULL;