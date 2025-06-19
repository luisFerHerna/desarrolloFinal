import mysql.connector
# O alternativamente:
from mysql.connector import connect

class Medicamento:
    def __init__(self, id=None, nombre=None, descripcion=None, stock=None, precio=None):
        self.id = id
        self.nombre = nombre
        self.descripcion = descripcion
        self.stock = stock
        self.precio = precio

    @staticmethod
    def buscar_por_nombre(nombre):
        conn = mysql.connector.connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM medicamentos WHERE nombre LIKE %s AND stock > 0"
        cursor.execute(query, (f"%{nombre}%",))
        medicamentos = cursor.fetchall()
        cursor.close()
        conn.close()
        return medicamentos

    @staticmethod
    def verificar_stock(medicamento_id, cantidad):
        conn = mysql.connector.connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
        cursor = conn.cursor()
        query = "SELECT stock FROM medicamentos WHERE id = %s"
        cursor.execute(query, (medicamento_id,))
        stock = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return stock >= cantidad

    @staticmethod
    def actualizar_stock(medicamento_id, cantidad):
        conn = mysql.connector.connect(
            host="db",
            user="hospital_user",
            password="hospital_pass",
            database="hospital_db"
        )
        cursor = conn.cursor()
        query = "UPDATE medicamentos SET stock = stock - %s WHERE id = %s"
        cursor.execute(query, (cantidad, medicamento_id))
        conn.commit()
        cursor.close()
        conn.close()