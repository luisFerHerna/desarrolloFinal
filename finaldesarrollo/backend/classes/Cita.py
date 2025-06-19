import mysql.connector
# O alternativamente:
from mysql.connector import connect
from datetime import datetime

class Cita:
    def __init__(self, id=None, paciente_id=None, doctor_id=None, fecha=None, hora=None, estado='pendiente'):
        self.id = id
        self.paciente_id = paciente_id
        self.doctor_id = doctor_id
        self.fecha = fecha
        self.hora = hora
        self.estado = estado

    def guardar(self):
        conn = mysql.connector.connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
        cursor = conn.cursor()
        
        if self.id:
            query = "UPDATE citas SET paciente_id=%s, doctor_id=%s, fecha=%s, hora=%s, estado=%s WHERE id=%s"
            cursor.execute(query, (self.paciente_id, self.doctor_id, self.fecha, self.hora, self.estado, self.id))
        else:
            query = "INSERT INTO citas (paciente_id, doctor_id, fecha, hora, estado) VALUES (%s, %s, %s, %s, %s)"
            cursor.execute(query, (self.paciente_id, self.doctor_id, self.fecha, self.hora, self.estado))
            self.id = cursor.lastrowid
        
        conn.commit()
        cursor.close()
        conn.close()
        return self

    @staticmethod
    def buscar_disponibilidad(doctor_id, fecha, hora):
        conn = mysql.connector.connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
        cursor = conn.cursor()
        query = "SELECT COUNT(*) FROM citas WHERE doctor_id = %s AND fecha = %s AND hora = %s"
        cursor.execute(query, (doctor_id, fecha, hora))
        count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return count == 0

    @staticmethod
    def obtener_citas_paciente(paciente_id):
        conn = mysql.connector.connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
        cursor = conn.cursor(dictionary=True)
        query = """
        SELECT c.id, c.fecha, c.hora, c.estado, 
               d.nombre as doctor_nombre, d.especialidad as doctor_especialidad
        FROM citas c
        JOIN doctores d ON c.doctor_id = d.id
        WHERE c.paciente_id = %s
        ORDER BY c.fecha, c.hora
        """
        cursor.execute(query, (paciente_id,))
        citas = cursor.fetchall()
        cursor.close()
        conn.close()
        return citas