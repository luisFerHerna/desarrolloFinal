import mysql.connector
# O alternativamente:
from mysql.connector import connect

class Receta:
    def __init__(self, id=None, paciente_id=None, doctor_id=None, fecha=None, medicamentos=None, instrucciones=None):
        self.id = id
        self.paciente_id = paciente_id
        self.doctor_id = doctor_id
        self.fecha = fecha
        self.medicamentos = medicamentos or []
        self.instrucciones = instrucciones

    def guardar(self):
        conn = mysql.connector.connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
        cursor = conn.cursor()
        
        query = """
        INSERT INTO recetas (paciente_id, doctor_id, fecha, instrucciones)
        VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (self.paciente_id, self.doctor_id, self.fecha, self.instrucciones))
        self.id = cursor.lastrowid
        
        for med in self.medicamentos:
            query = """
            INSERT INTO receta_medicamentos (receta_id, medicamento_id, cantidad, dosis)
            VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query, (self.id, med['id'], med['cantidad'], med['dosis']))
        
        conn.commit()
        cursor.close()
        conn.close()
        return self

    @staticmethod
    def obtener_por_paciente(paciente_id):
        conn = mysql.connector.connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT r.id, r.fecha, r.instrucciones, 
               d.nombre as doctor_nombre, d.especialidad as doctor_especialidad
        FROM recetas r
        JOIN doctores d ON r.doctor_id = d.id
        WHERE r.paciente_id = %s
        ORDER BY r.fecha DESC
        """
        cursor.execute(query, (paciente_id,))
        recetas = cursor.fetchall()
        
        for receta in recetas:
            query = """
            SELECT m.nombre, rm.cantidad, rm.dosis
            FROM receta_medicamentos rm
            JOIN medicamentos m ON rm.medicamento_id = m.id
            WHERE rm.receta_id = %s
            """
            cursor.execute(query, (receta['id'],))
            receta['medicamentos'] = cursor.fetchall()
        
        cursor.close()
        conn.close()
        return recetas