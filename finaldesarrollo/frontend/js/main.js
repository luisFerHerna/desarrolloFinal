//main
// Configuración base
// Usa esta configuración al inicio de tu main.js
const API_BASE_URL = 'http://localhost:8000/backend/api/';
document.addEventListener('DOMContentLoaded', function () {
    // Navegación entre secciones
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const sectionId = this.id.replace('-link', '-section');
            document.querySelectorAll('section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(sectionId).classList.add('active');
        });
    });

    // Cargar datos iniciales
    loadDoctores();
    loadPacientes();
    loadMedicamentos();

    // Formulario de paciente
    document.getElementById('paciente-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const paciente = {
            nombre: document.getElementById('nombre').value,
            edad: document.getElementById('edad').value,
            contacto: document.getElementById('contacto').value
        };

        fetch(`${API_BASE_URL}pacientes.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paciente)
        })
            .then(handleResponse)
            .then(data => {
                if (data.error) {
                    showAlert(data.error, 'error');
                } else {
                    showAlert('Paciente registrado con éxito', 'success');
                    loadPacientes();
                    this.reset();
                }
            })
            .catch(error => showAlert(`Error: ${error.message}`, 'error'));
    });

    // Formulario de cita
    document.getElementById('cita-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const cita = {
            paciente_id: document.getElementById('paciente-id').value,
            doctor_id: document.getElementById('doctor-id').value,
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value
        };

        fetch(`${API_BASE_URL}citas.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cita)
        })
            .then(handleResponse)
            .then(data => {
                if (data.error) {
                    showAlert(data.error, 'error');
                } else {
                    showAlert('Cita agendada con éxito', 'success');
                    loadCitas(document.getElementById('paciente-id').value);
                    this.reset();
                }
            })
            .catch(error => showAlert(`Error: ${error.message}`, 'error'));
    });

    // Formulario de receta
    document.getElementById('receta-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const medicamentos = [];
        document.querySelectorAll('.medicamento-item').forEach(item => {
            medicamentos.push({
                id: item.querySelector('.medicamento-id').value,
                cantidad: item.querySelector('.cantidad').value,
                dosis: item.querySelector('.dosis').value
            });
        });

        const receta = {
            paciente_id: document.getElementById('receta-paciente-id').value,
            doctor_id: document.getElementById('receta-doctor-id').value,
            medicamentos: medicamentos,
            instrucciones: document.getElementById('instrucciones').value
        };

        fetch(`${API_BASE_URL}recetas.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(receta)
        })
            .then(handleResponse)
            .then(data => {
                if (data.error) {
                    showAlert(data.error, 'error');
                } else {
                    showAlert('Receta generada con éxito', 'success');
                    loadRecetas(document.getElementById('receta-paciente-id').value);
                    this.reset();
                }
            })
            .catch(error => showAlert(`Error: ${error.message}`, 'error'));
    });

    // Añadir más medicamentos
    document.getElementById('add-med').addEventListener('click', function () {
        const container = document.getElementById('medicamentos-container');
        const newItem = document.createElement('div');
        newItem.className = 'medicamento-item';
        newItem.innerHTML = `
            <select class="medicamento-id" required>
                <option value="">Seleccione medicamento</option>
            </select>
            <input type="number" class="cantidad" placeholder="Cantidad" required>
            <input type="text" class="dosis" placeholder="Dosis" required>
            <button type="button" class="remove-med">Eliminar</button>
        `;
        container.appendChild(newItem);

        const select = newItem.querySelector('.medicamento-id');
        loadMedicamentosIntoSelect(select);

        newItem.querySelector('.remove-med').addEventListener('click', function () {
            container.removeChild(newItem);
        });
    });

    // Funciones auxiliares
    function handleResponse(response) {
        const contentType = response.headers.get('content-type');

        if (!contentType || !contentType.includes('application/json')) {
            return response.text().then(text => {
                throw new Error(`Respuesta no JSON: ${text.substring(0, 100)}`);
            });
        }

        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Error en la solicitud');
            });
        }

        return response.json();
    }
    function showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        document.body.prepend(alert);
        setTimeout(() => alert.remove(), 3000);
    }

    // Funciones para cargar datos
    function loadPacientes() {
        fetch(`${API_BASE_URL}pacientes.php`)
            .then(handleResponse)
            .then(data => {
                const pacientesList = document.getElementById('pacientes-list');
                pacientesList.innerHTML = '';

                if (!data || data.length === 0) {
                    pacientesList.innerHTML = '<p class="no-data">No hay pacientes registrados</p>';
                    return;
                }

                data.forEach(paciente => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.innerHTML = `
                    <h3>${paciente.nombre}</h3>
                    <p>Edad: ${paciente.edad}</p>
                    <p>Contacto: ${paciente.contacto}</p>
                `;
                    pacientesList.appendChild(card);
                });

                updatePacienteSelects();
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Error al cargar pacientes', 'error');
            });
    }

    function loadDoctores() {
        fetch(`${API_BASE_URL}doctores.php`)
            .then(handleResponse)
            .then(data => {
                const doctorSelect = document.getElementById('doctor-id');
                const recetaDoctorSelect = document.getElementById('receta-doctor-id');

                doctorSelect.innerHTML = '<option value="">Seleccione doctor</option>';
                recetaDoctorSelect.innerHTML = '<option value="">Seleccione doctor</option>';

                data.forEach(doctor => {
                    const option = document.createElement('option');
                    option.value = doctor.id;
                    option.textContent = `${doctor.nombre} - ${doctor.especialidad}`;

                    doctorSelect.appendChild(option.cloneNode(true));
                    recetaDoctorSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Error al cargar doctores', 'error');
            });
    }

    function loadMedicamentos() {
        fetch(`${API_BASE_URL}medicamentos.php`)
            .then(handleResponse)
            .then(data => {
                const medicamentosList = document.getElementById('medicamentos-list');
                medicamentosList.innerHTML = '';

                if (!data || data.length === 0) {
                    medicamentosList.innerHTML = '<p class="no-data">No hay medicamentos registrados</p>';
                    return;
                }

                data.forEach(med => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.innerHTML = `
                    <h3>${med.nombre}</h3>
                    <p>Descripción: ${med.descripcion}</p>
                    <p>Stock: ${med.stock}</p>
                    <p>Precio: $${med.precio}</p>
                `;
                    medicamentosList.appendChild(card);
                });

                document.querySelectorAll('.medicamento-id').forEach(select => {
                    loadMedicamentosIntoSelect(select);
                });
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Error al cargar medicamentos', 'error');
            });
    }

    function loadMedicamentosIntoSelect(select) {
        fetch(`${API_BASE_URL}medicamentos.php`)
            .then(handleResponse)
            .then(data => {
                const currentValue = select.value;
                select.innerHTML = '<option value="">Seleccione medicamento</option>';

                data.forEach(med => {
                    const option = document.createElement('option');
                    option.value = med.id;
                    option.textContent = `${med.nombre} (Stock: ${med.stock})`;
                    select.appendChild(option);
                });

                if (currentValue) {
                    select.value = currentValue;
                }
            })
            .catch(error => console.error('Error:', error));
    }

 async function loadCitas(pacienteId) {
    if (!pacienteId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}citas.php?paciente_id=${pacienteId}`);
        const contentType = response.headers.get('content-type');
        
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Respuesta no JSON: ${text.substring(0, 100)}`);
        }
        
        const data = await response.json();
        const citasList = document.getElementById('citas-list');
        citasList.innerHTML = '';
        
        if (!data || data.length === 0) {
            citasList.innerHTML = '<p class="no-data">No hay citas agendadas</p>';
            return;
        }
        
        data.forEach(cita => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>Cita con ${cita.doctor_nombre}</h3>
                <p>Especialidad: ${cita.doctor_especialidad}</p>
                <p>Fecha: ${new Date(cita.fecha).toLocaleDateString()} a las ${cita.hora}</p>
                <p>Estado: ${cita.estado}</p>
            `;
            citasList.appendChild(card);
        });
    } catch (error) {
        console.error('Error al cargar citas:', error);
        showAlert('Error al cargar citas: ' + error.message, 'error');
    }
}

async function loadRecetas(pacienteId) {
    if (!pacienteId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}recetas.php?paciente_id=${pacienteId}`);
        const contentType = response.headers.get('content-type');
        
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Respuesta no JSON: ${text.substring(0, 100)}`);
        }
        
        const data = await response.json();
        const recetasList = document.getElementById('recetas-list');
        recetasList.innerHTML = '';
        
        if (!data || data.length === 0) {
            recetasList.innerHTML = '<p class="no-data">No hay recetas registradas</p>';
            return;
        }
        
        data.forEach(receta => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>Receta del ${new Date(receta.fecha).toLocaleString()}</h3>
                <p>Doctor: ${receta.doctor_nombre} (${receta.doctor_especialidad})</p>
                <h4>Medicamentos:</h4>
                <ul>
                    ${receta.medicamentos.map(med => 
                        `<li>${med.nombre} - Cantidad: ${med.cantidad}, Dosis: ${med.dosis}</li>`
                    ).join('')}
                </ul>
                <h4>Instrucciones:</h4>
                <p>${receta.instrucciones}</p>
            `;
            recetasList.appendChild(card);
        });
    } catch (error) {
        console.error('Error al cargar recetas:', error);
        showAlert('Error al cargar recetas: ' + error.message, 'error');
    }
}

    function updatePacienteSelects() {
        fetch(`${API_BASE_URL}pacientes.php`)
            .then(handleResponse)
            .then(data => {
                const pacienteSelect = document.getElementById('paciente-id');
                const recetaPacienteSelect = document.getElementById('receta-paciente-id');

                pacienteSelect.innerHTML = '<option value="">Seleccione paciente</option>';
                recetaPacienteSelect.innerHTML = '<option value="">Seleccione paciente</option>';

                data.forEach(paciente => {
                    const option = document.createElement('option');
                    option.value = paciente.id;
                    option.textContent = `${paciente.nombre} (${paciente.contacto})`;

                    pacienteSelect.appendChild(option.cloneNode(true));
                    recetaPacienteSelect.appendChild(option);
                });

                if (data.length > 0) {
                    const firstPacienteId = data[0].id;
                    loadCitas(firstPacienteId);
                    loadRecetas(firstPacienteId);

                    pacienteSelect.addEventListener('change', function () {
                        loadCitas(this.value);
                    });

                    recetaPacienteSelect.addEventListener('change', function () {
                        loadRecetas(this.value);
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Error al cargar pacientes', 'error');
            });
    }
});