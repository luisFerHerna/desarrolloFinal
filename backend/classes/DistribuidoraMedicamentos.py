import sqlite3
import json


class DistribuidoraMedicamentos:
    def __init__(self, id_distribuidor: int, nombre: str, empresa: str):
        self.id_distribuidor = id_distribuidor
        self.nombre = nombre
        self.empresa = empresa
        self.db = self.conectar_bd()

    def conectar_bd(self):
        try:
            conn = sqlite3.connect(":memory:")  # Simulación en memoria
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS stock (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    id_medicamento INTEGER,
                    nombre_medicamento TEXT,
                    cantidad INTEGER
                )
            ''')
            conn.commit()
            return conn
        except sqlite3.Error as e:
            print(f"[Error] Conexión fallida: {e}")
            return None

    def registrar_lote(self, m: Medicamento, cantidad: int):
        cursor = self.db.cursor()
        cursor.execute("SELECT cantidad FROM stock WHERE id_medicamento = ?", (m.id_medicamento,))
        row = cursor.fetchone()

        if row:
            nueva_cantidad = row[0] + cantidad
            cursor.execute("UPDATE stock SET cantidad = ? WHERE id_medicamento = ?", (nueva_cantidad, m.id_medicamento))
        else:
            cursor.execute("INSERT INTO stock (id_medicamento, nombre_medicamento, cantidad) VALUES (?, ?, ?)",
                           (m.id_medicamento, m.nombre, cantidad))
        self.db.commit()
        print(f"[{self.nombre}] Lote registrado: {cantidad} unidades de {m.nombre}.")

    def consultar_stock(self, m: Medicamento) -> int:
        cursor = self.db.cursor()
        cursor.execute("SELECT cantidad FROM stock WHERE id_medicamento = ?", (m.id_medicamento,))
        row = cursor.fetchone()
        return row[0] if row else 0

    def validar_token(self, token):
        return token == "Bearer mi.jwt.distribuidor"

