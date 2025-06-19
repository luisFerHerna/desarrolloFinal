import mysql.connector
# Alternativamente:
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
        conn = connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
        try:
            cursor = conn.cursor()
            if self.id:
                query = """
                    UPDATE citas
                    SET paciente_id=%s, doctor_id=%s, fecha=%s, hora=%s, estado=%s
                    WHERE id=%s
                """
                cursor.execute(query, (self.paciente_id, self.doctor_id, self.fecha, self.hora, self.estado, self.id))
            else:
                query = """
                    INSERT INTO citas (paciente_id, doctor_id, fecha, hora, estado)
                    VALUES (%s, %s, %s, %s, %s)
                """
                cursor.execute(query, (self.paciente_id, self.doctor_id, self.fecha, self.hora, self.estado))
                self.id = cursor.lastrowid
            conn.commit()
        finally:
            cursor.close()
            conn.close()
        return self

    @staticmethod
    def buscar_disponibilidad(doctor_id, fecha, hora):
        conn = connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
        try:
            cursor = conn.cursor()
            query = """
                SELECT COUNT(*) FROM citas
                WHERE doctor_id = %s AND fecha = %s AND hora = %s
            """
            cursor.execute(query, (doctor_id, fecha, hora))
            count = cursor.fetchone()[0]
        finally:
            cursor.close()
            conn.close()
        return count == 0

    @staticmethod
    def obtener_citas_paciente(paciente_id):
        conn = connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
        try:
            cursor = conn.cursor(dictionary=True)
            query = """
                SELECT c.id, c.fecha, c.hora, c.estado,
                       d.nombre AS doctor_nombre,
                       d.especialidad AS doctor_especialidad
                FROM citas c
                INNER JOIN doctores d ON c.doctor_id = d.id
                WHERE c.paciente_id = %s
                ORDER BY c.fecha ASC, c.hora ASC
            """
            cursor.execute(query, (paciente_id,))
            citas = cursor.fetchall()
        finally:
            cursor.close()
            conn.close()
        return citas
