import mysql.connector

class Doctor:
    """
    Clase que representa a un doctor en el sistema hospitalario.
    Permite obtener todos los doctores o filtrar por especialidad.
    """

    def __init__(self, id=None, nombre=None, especialidad=None, contacto=None, horario=None):
        self.id = id
        self.nombre = nombre
        self.especialidad = especialidad
        self.contacto = contacto
        self.horario = horario or {}

    @staticmethod
    def obtener_todos():
        """
        Recupera todos los doctores registrados en la base de datos.
        Devuelve una lista de diccionarios con los datos.
        """
        conn = Doctor._crear_conexion()
        try:
            cursor = conn.cursor(dictionary=True)
            query = "SELECT * FROM doctores"
            cursor.execute(query)
            doctores = cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

        return doctores

    @staticmethod
    def buscar_por_especialidad(especialidad):
        """
        Recupera todos los doctores con una especialidad específica.
        Devuelve una lista de diccionarios con los datos.
        """
        conn = Doctor._crear_conexion()
        try:
            cursor = conn.cursor(dictionary=True)
            query = "SELECT * FROM doctores WHERE especialidad = %s"
            cursor.execute(query, (especialidad,))
            doctores = cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

        return doctores

    @staticmethod
    def _crear_conexion():
        """
        Crea y retorna una conexión a la base de datos del hospital.
        Extraído para centralizar el acceso a BD.
        """
        return mysql.connector.connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
