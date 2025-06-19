import json
import sqlite3

# Clase principal
class VendedorMedicamentos:
    def __init__(self, id_vendedora: int, nombre: str):
        self.id_vendedora = id_vendedora
        self.nombre = nombre
        self.db = self.conectar_bd()

    def conectar_bd(self):
        try:
            conn = sqlite3.connect(":memory:") 
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS farmacia_encargados (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT,
                    email TEXT,
                    turno TEXT
                )
            ''')
            cursor.execute("INSERT INTO farmacia_encargados (nombre, email, turno) VALUES (?, ?, ?)",
                           ("Luis", "luis@farmacia.com", "mañana"))
            conn.commit()
            return conn
        except sqlite3.Error as e:
            print(f"[Error] Conexión fallida: {e}")
            return None

    def dispensar_medicamentos(self, receta: Receta):
        print(f"[{self.nombre}] Dispensando medicamentos...")
        print(str(receta))
        return {"status": "ok", "mensaje": f"Medicamentos dispensados para {receta.paciente}"}

    def registrar_venta(self):
        print(f"[{self.nombre}] Venta registrada correctamente.")
        return {"status": "ok", "mensaje": "Venta registrada en el sistema"}

    def obtener_encargado(self, id_encargado):
        cursor = self.db.cursor()
        cursor.execute("SELECT * FROM farmacia_encargados WHERE id = ?", (id_encargado,))
        fila = cursor.fetchone()
        if fila:
            return dict(zip(["id", "nombre", "email", "turno"], fila))
        else:
            return {"error": "Encargado no encontrado"}

    def crear_encargado(self, nombre, email, turno):
        cursor = self.db.cursor()
        cursor.execute("INSERT INTO farmacia_encargados (nombre, email, turno) VALUES (?, ?, ?)",
                       (nombre, email, turno))
        self.db.commit()
        return {"mensaje": "Encargado creado", "id": cursor.lastrowid}

    def validar_token(self, token):
        return token == "Bearer mi.jwt.falso"


