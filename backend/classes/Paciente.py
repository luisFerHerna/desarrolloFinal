import mysql.connector

class Paciente:
    """
    Clase que representa a un paciente del sistema hospitalario.
    Permite guardar, buscar y verificar existencia en base de datos.
    """

    def __init__(self, id=None, nombre=None, edad=None, contacto=None, historial=None):
        self.id = id
        self.nombre = nombre
        self.edad = edad
        self.contacto = contacto
        self.historial = historial or []

    def guardar(self):
        """
        Guarda o actualiza el paciente en la base de datos.
        Si el paciente ya tiene un ID, se actualiza.
        Si no, se inserta uno nuevo y se asigna el ID generado.
        """
        if not self.nombre or not self.contacto:
            raise ValueError("El nombre y el contacto del paciente son obligatorios.")

        conn = self._crear_conexion()
        try:
            cursor = conn.cursor()

            if self.id:
                query = "UPDATE pacientes SET nombre=%s, edad=%s, contacto=%s WHERE id=%s"
                valores = (self.nombre, self.edad, self.contacto, self.id)
            else:
                query = "INSERT INTO pacientes (nombre, edad, contacto) VALUES (%s, %s, %s)"
                valores = (self.nombre, self.edad, self.contacto)

            cursor.execute(query, valores)

            if not self.id:
                self.id = cursor.lastrowid

            conn.commit()
        finally:
            cursor.close()
            conn.close()

        return self

    @staticmethod
    def buscar_por_id(id):
        """
        Busca un paciente por su ID en la base de datos.
        Devuelve una instancia de Paciente si se encuentra, o None en caso contrario.
        """
        conn = Paciente._crear_conexion()
        try:
            cursor = conn.cursor(dictionary=True)
            query = "SELECT * FROM pacientes WHERE id = %s"
            cursor.execute(query, (id,))
            resultado = cursor.fetchone()
        finally:
            cursor.close()
            conn.close()

        if resultado:
            return Paciente(**resultado)
        return None

    @staticmethod
    def existe_paciente(nombre, contacto):
        """
        Verifica si ya existe un paciente con el mismo nombre y contacto.
        Devuelve True si existe, False si no.
        """
        conn = Paciente._crear_conexion()
        try:
            cursor = conn.cursor()
            query = "SELECT COUNT(*) FROM pacientes WHERE nombre = %s AND contacto = %s"
            cursor.execute(query, (nombre, contacto))
            conteo = cursor.fetchone()[0]
        finally:
            cursor.close()
            conn.close()

        return conteo > 0

    @staticmethod
    def _crear_conexion():
        """
        Crea y retorna una conexión a la base de datos del hospital.
        Se extrae para reutilización y facilitar cambios futuros.
        """
        return mysql.connector.connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
