import mysql.connector
# O alternativamente:
from mysql.connector import connect

class Doctor:
    def __init__(self, id=None, nombre=None, especialidad=None, contacto=None, horario=None):
        self.id = id
        self.nombre = nombre
        self.especialidad = especialidad
        self.contacto = contacto
        self.horario = horario or {}

    @staticmethod
    def obtener_todos():
        conn = mysql.connector.connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM doctores"
        cursor.execute(query)
        doctores = cursor.fetchall()
        cursor.close()
        conn.close()
        return doctores

    @staticmethod
    def buscar_por_especialidad(especialidad):
        conn = mysql.connector.connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM doctores WHERE especialidad = %s"
        cursor.execute(query, (especialidad,))
        doctores = cursor.fetchall()
        cursor.close()
        conn.close()
        return doctores