import sqlite3
import json
from datetime import date

class Inventario:
    def __init__(self, idInventario: int):
        self.idInventario = idInventario
        self.fechaActualizacion = date.today()
        self.db = self.conectar_bd()

    def conectar_bd(self):
        try:
            conn = sqlite3.connect(":memory:")  # Base de datos en memoria
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS inventario (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    id_medicamento INTEGER,
                    nombre_medicamento TEXT,
                    cantidad INTEGER,
                    fecha_actualizacion TEXT
                )
            ''')
            conn.commit()
            return conn
        except sqlite3.Error as e:
            print(f"[Error] Conexión fallida: {e}")
            return None

    def registrar_lote(self, m: Medicamento, cantidad: int):
        cursor = self.db.cursor()
        cursor.execute("SELECT cantidad FROM inventario WHERE id_medicamento = ?", (m.id_medicamento,))
        row = cursor.fetchone()

        if row:
            nueva_cantidad = row[0] + cantidad
            cursor.execute(
                "UPDATE inventario SET cantidad = ?, fecha_actualizacion = ? WHERE id_medicamento = ?",
                (nueva_cantidad, str(date.today()), m.id_medicamento)
            )
        else:
            cursor.execute(
                "INSERT INTO inventario (id_medicamento, nombre_medicamento, cantidad, fecha_actualizacion) VALUES (?, ?, ?, ?)",
                (m.id_medicamento, m.nombre, cantidad, str(date.today()))
            )

        self.db.commit()
        self.fechaActualizacion = date.today()
        print(f"[Inventario] Lote registrado: {cantidad} unidades de {m.nombre}.")

    def consultar_stock(self, m: Medicamento) -> int:
        cursor = self.db.cursor()
        cursor.execute("SELECT cantidad FROM inventario WHERE id_medicamento = ?", (m.id_medicamento,))
        row = cursor.fetchone()
        return row[0] if row else 0

    def validar_token(self, token):
        return token == "Bearer mi.jwt.inventario"

