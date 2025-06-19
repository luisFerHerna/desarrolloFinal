#paciente
import mysql.connector
# O alternativamente:
from mysql.connector import connect

class Paciente:
    def __init__(self, id=None, nombre=None, edad=None, contacto=None, historial=None):
        self.id = id
        self.nombre = nombre
        self.edad = edad
        self.contacto = contacto
        self.historial = historial or []

    def guardar(self):
        conn = mysql.connector.connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
        cursor = conn.cursor()
        
        if self.id:
            query = "UPDATE pacientes SET nombre=%s, edad=%s, contacto=%s WHERE id=%s"
            cursor.execute(query, (self.nombre, self.edad, self.contacto, self.id))
        else:
            query = "INSERT INTO pacientes (nombre, edad, contacto) VALUES (%s, %s, %s)"
            cursor.execute(query, (self.nombre, self.edad, self.contacto))
            self.id = cursor.lastrowid
        
        conn.commit()
        cursor.close()
        conn.close()
        return self

    @staticmethod
    def buscar_por_id(id):
        conn = mysql.connector.connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM pacientes WHERE id = %s"
        cursor.execute(query, (id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if result:
            return Paciente(**result)
        return None

    @staticmethod
    def existe_paciente(nombre, contacto):
        conn = mysql.connector.connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
        cursor = conn.cursor()
        query = "SELECT COUNT(*) FROM pacientes WHERE nombre = %s AND contacto = %s"
        cursor.execute(query, (nombre, contacto))
        count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return count > 0