from datetime import date
import json

class HistorialMedico:
    def __init__(self, idReporte: int, tipo: str):
        self.idReporte = idReporte
        self.fecha = date.today()
        self.tipo = tipo

    def generarReporteCitas(self) -> str:
        citas = [
            {"paciente": "Juan Pérez", "fecha": "2025-06-01", "especialista": "Dra. Gómez"},
            {"paciente": "María López", "fecha": "2025-06-02", "especialista": "Dr. Torres"},
        ]
        reporte = f"=== Reporte de Citas ({self.fecha}) ===\n"
        for c in citas:
            reporte += f"Paciente: {c['paciente']} | Fecha: {c['fecha']} | Especialista: {c['especialista']}\n"
        return reporte

    def generarReporteInventario(self) -> str:
        inventario = [
            {"medicamento": "Paracetamol", "cantidad": 120},
            {"medicamento": "Ibuprofeno", "cantidad": 75},
            {"medicamento": "Amoxicilina", "cantidad": 200}
        ]
        reporte = f"=== Reporte de Inventario ({self.fecha}) ===\n"
        for i in inventario:
            reporte += f"Medicamento: {i['medicamento']} | Cantidad: {i['cantidad']}\n"
        return reporte

    def generarReportePacientes(self) -> str:
        pacientes = [
            {"nombre": "Carlos Rivas", "edad": 45, "diagnostico": "Hipertensión"},
            {"nombre": "Lucía Vega", "edad": 30, "diagnostico": "Asma"},
        ]
        reporte = f"=== Reporte de Pacientes ({self.fecha}) ===\n"
        for p in pacientes:
            reporte += f"Nombre: {p['nombre']} | Edad: {p['edad']} | Diagnóstico: {p['diagnostico']}\n"
        return reporte


