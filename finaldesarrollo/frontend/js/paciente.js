//paciente
document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Si el usuario está logueado (paciente)
    if (user && user.rol === 'paciente') {
        document.getElementById('logoutBtn').style.display = 'block';
        document.getElementById('userInfo').textContent = `Bienvenido, ${user.nombre}`;
        cargarCitasPaciente(user.id);
    }
    
    // Logout para pacientes logueados
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });
    
    // Cargar doctores para el select
    cargarDoctores();
    
    // Formulario para agendar cita
    document.getElementById('citaForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const citaData = {
            doctor_id: document.getElementById('doctor_id').value,
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value,
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value
        };
        
        // Validar horario (7:00 - 22:00)
        const hora = citaData.hora.split(':');
        const horaNum = parseInt(hora[0]);
        if (horaNum < 7 || horaNum > 22) {
            document.getElementById('message').textContent = 'Las citas solo pueden ser entre 7:00 y 22:00';
            document.getElementById('message').className = 'message error';
            return;
        }
        
        fetch('http://localhost/backend/api/citas.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(citaData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('message').textContent = data.error;
                document.getElementById('message').className = 'message error';
            } else {
                document.getElementById('message').textContent = 'Cita agendada correctamente';
                document.getElementById('message').className = 'message success';
                document.getElementById('citaForm').reset();
                
                // Si el paciente está logueado, actualizar la lista de citas
                if (user && user.rol === 'paciente') {
                    cargarCitasPaciente(user.id);
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('message').textContent = 'Error al agendar cita';
            document.getElementById('message').className = 'message error';
        });
    });
});

function cargarDoctores() {
    fetch('http://localhost/backend/api/doctores.php')
    .then(response => response.json())
    .then(doctores => {
        const select = document.getElementById('doctor_id');
        select.innerHTML = '<option value="">Seleccione un doctor</option>';
        
        doctores.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor.id;
            option.textContent = doctor.nombre;
            select.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function cargarCitasPaciente(pacienteId) {
    fetch(`http://localhost/backend/api/citas.php?paciente_id=${pacienteId}`)
    .then(response => response.json())
    .then(citas => {
        const citasList = document.getElementById('citasList');
        citasList.innerHTML = '';
        
        if (citas.length === 0) {
            citasList.innerHTML = '<p>No tienes citas agendadas.</p>';
            return;
        }
        
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Doctor</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        
        citas.forEach(cita => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cita.doctor_nombre}</td>
                <td>${cita.fecha}</td>
                <td>${cita.hora}</td>
                <td>${cita.estado}</td>
            `;
            tbody.appendChild(row);
        });
        
        citasList.appendChild(table);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}