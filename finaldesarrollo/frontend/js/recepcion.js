document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('user'));
if (!user || (user.rol !== 'recepcionista' && user.rol !== 'recepcion')) {
                window.location.href = 'login.html';
    }

    // Variables globales
    let pacientes = [];
    let doctores = [];
    let farmaciaEncargados = [];
    let citas = [];
    let currentPriorityFilter = 'all';

    // Elementos del modal
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalFields = document.getElementById('modalFields');
    const modalForm = document.getElementById('modalForm');
    const modalId = document.getElementById('modalId');
    const closeBtn = document.querySelector('.close');

    // Manejo de tabs
    document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.tab-btn').forEach((b) =>
                b.classList.remove('active')
            );
            document.querySelectorAll('.tab-content').forEach((c) =>
                c.classList.remove('active')
            );

            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');

            // Cargar datos según la pestaña
            if (this.dataset.tab === 'pacientes') {
                cargarPacientes();
            } else if (this.dataset.tab === 'doctores') {
                cargarDoctores();
            } else if (this.dataset.tab === 'farmacia') {
                cargarFarmaciaEncargados();
            } else if (this.dataset.tab === 'citas') {
                cargarCitas();
            }
        });
    });

    // Filtros de prioridad
    document.querySelectorAll('.priority-filter').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.priority-filter').forEach(b => 
                b.classList.remove('active')
            );
            this.classList.add('active');
            currentPriorityFilter = this.dataset.priority;
            renderPacientes(pacientes);
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function () {
        localStorage.removeItem('user');
        localStorage.removeItem('jwt');
        window.location.href = 'login.html';
    });

    // Eventos de búsqueda
    document.getElementById('searchPacienteBtn').addEventListener('click', buscarPacientes);
    document.getElementById('searchDoctorBtn').addEventListener('click', buscarDoctores);
    document.getElementById('searchFarmaciaBtn').addEventListener('click', buscarFarmaciaEncargados);
    document.getElementById('searchCitaBtn').addEventListener('click', buscarCitasPorFecha);

    // Eventos para agregar nuevos
    document.getElementById('addPacienteBtn').addEventListener('click', () => mostrarModalPaciente());
    document.getElementById('addDoctorBtn').addEventListener('click', () => mostrarModalDoctor());
    document.getElementById('addFarmaciaBtn').addEventListener('click', () => mostrarModalFarmacia());
    document.getElementById('addCitaBtn').addEventListener('click', () => mostrarModalCita());

    // Cerrar modal
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Submit del modal
    modalForm.addEventListener('submit', function (e) {
        e.preventDefault();
        guardarDesdeModal();
    });

    // Cargar datos iniciales
    cargarPacientes();
    cargarDoctores();
    cargarFarmaciaEncargados();
    cargarCitas();
});

// Funciones para cargar datos
function cargarPacientes() {
    const jwt = localStorage.getItem('jwt');

    fetch('http://localhost:8000/backend/api/pacientes.php', {
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
    })
        .then((response) => {
            if (!response.ok) throw new Error('Error al cargar pacientes');
            return response.json();
        })
        .then((data) => {
            pacientes = data;
            renderPacientes(data);
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error al cargar pacientes');
        });
}

function cargarDoctores() {
    const jwt = localStorage.getItem('jwt');

    fetch('http://localhost:8000/backend/api/doctores.php', {
   headers: {
    'Authorization': `Bearer ${jwt}`,
    'Content-Type': 'application/json'
}
})
        .then((response) => {
            if (!response.ok) throw new Error('Error al cargar doctores');
            return response.json();
        })
        .then((data) => {
            doctores = data;
            renderDoctores(data);
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error al cargar doctores');
        });
}

function cargarFarmaciaEncargados() {
    const jwt = localStorage.getItem('jwt');

    fetch('http://localhost:8000/backend/api/farmacia.php', {
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
    })
        .then((response) => {
            if (!response.ok) throw new Error('Error al cargar encargados de farmacia');
            return response.json();
        })
        .then((data) => {
            farmaciaEncargados = data;
            renderFarmaciaEncargados(data);
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error al cargar encargados de farmacia');
        });
}

function cargarCitas() {
    const jwt = localStorage.getItem('jwt');

    fetch('http://localhost:8000/backend/api/citas.php', {
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
    })
        .then((response) => {
            if (!response.ok) throw new Error('Error al cargar citas');
            return response.json();
        })
        .then((data) => {
            citas = data;
            renderCitas(data);
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error al cargar citas');
        });
}

// Funciones de búsqueda
function buscarPacientes() {
    const searchTerm = document.getElementById('searchPaciente').value.toLowerCase();
    const filtered = pacientes.filter(
        (paciente) =>
            paciente.nombre.toLowerCase().includes(searchTerm) ||
            paciente.email.toLowerCase().includes(searchTerm) ||
            paciente.telefono.toLowerCase().includes(searchTerm)
    );
    renderPacientes(filtered);
}

function buscarDoctores() {
    const searchTerm = document.getElementById('searchDoctor').value.toLowerCase();
    const filtered = doctores.filter(
        (doctor) =>
            doctor.nombre.toLowerCase().includes(searchTerm) ||
            doctor.email.toLowerCase().includes(searchTerm) ||
            doctor.especialidad.toLowerCase().includes(searchTerm)
    );
    renderDoctores(filtered);
}

function buscarFarmaciaEncargados() {
    const searchTerm = document.getElementById('searchFarmacia').value.toLowerCase();
    const filtered = farmaciaEncargados.filter(
        (encargado) =>
            encargado.nombre.toLowerCase().includes(searchTerm) ||
            encargado.email.toLowerCase().includes(searchTerm)
    );
    renderFarmaciaEncargados(filtered);
}

function buscarCitasPorFecha() {
    const fecha = document.getElementById('searchCitaFecha').value;
    if (!fecha) {
        renderCitas(citas);
        return;
    }

    const filtered = citas.filter(cita => cita.fecha === fecha);
    renderCitas(filtered);
}

// Funciones para renderizar
function renderPacientes(pacientes) {
    const container = document.getElementById('pacientesList');
    container.innerHTML = '';

    // Filtrar por prioridad
    let filteredPacientes = pacientes;
    if (currentPriorityFilter !== 'all') {
        filteredPacientes = pacientes.filter(p => p.prioridad === currentPriorityFilter);
    }

    if (filteredPacientes.length === 0) {
        container.innerHTML = '<p>No se encontraron pacientes</p>';
        return;
    }

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Prioridad</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    filteredPacientes.forEach((paciente) => {
        const row = document.createElement('tr');
        row.className = `priority-${paciente.prioridad}`;
        row.innerHTML = `
            <td>${paciente.id}</td>
            <td>${paciente.nombre}</td>
            <td>${paciente.email}</td>
            <td>${paciente.telefono}</td>
            <td>${paciente.direccion || 'N/A'}</td>
            <td>${getPriorityText(paciente.prioridad)}</td>
            <td>
                <button class="edit-btn" data-id="${paciente.id}" data-type="paciente">Editar</button>
                <button class="delete-btn" data-id="${paciente.id}" data-type="paciente">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    container.appendChild(table);

    // Asignar eventos a los botones
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const type = this.dataset.type;
            mostrarModalEditar(id, type);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const type = this.dataset.type;
            eliminarRegistro(id, type);
        });
    });
}

function getPriorityText(priority) {
    switch(priority) {
        case 'alta': return 'Alta';
        case 'media': return 'Media';
        case 'baja': return 'Baja';
        default: return priority;
    }
}

function renderDoctores(doctores) {
    const container = document.getElementById('doctoresList');
    container.innerHTML = '';

    if (doctores.length === 0) {
        container.innerHTML = '<p>No se encontraron doctores</p>';
        return;
    }

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Especialidad</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    doctores.forEach((doctor) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${doctor.id}</td>
            <td>${doctor.nombre}</td>
            <td>${doctor.email}</td>
            <td>${doctor.especialidad}</td>
            <td>
                <button class="edit-btn" data-id="${doctor.id}" data-type="doctor">Editar</button>
                <button class="delete-btn" data-id="${doctor.id}" data-type="doctor">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    container.appendChild(table);

    // Asignar eventos a los botones
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const type = this.dataset.type;
            mostrarModalEditar(id, type);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const type = this.dataset.type;
            eliminarRegistro(id, type);
        });
    });
}

function renderFarmaciaEncargados(encargados) {
    const container = document.getElementById('farmaciaList');
    container.innerHTML = '';

    if (encargados.length === 0) {
        container.innerHTML = '<p>No se encontraron encargados</p>';
        return;
    }

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Turno</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    encargados.forEach((encargado) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${encargado.id}</td>
            <td>${encargado.nombre}</td>
            <td>${encargado.email}</td>
            <td>${encargado.turno || 'N/A'}</td>
            <td>
                <button class="edit-btn" data-id="${encargado.id}" data-type="farmacia">Editar</button>
                <button class="delete-btn" data-id="${encargado.id}" data-type="farmacia">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    container.appendChild(table);

    // Asignar eventos a los botones
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const type = this.dataset.type;
            mostrarModalEditar(id, type);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const type = this.dataset.type;
            eliminarRegistro(id, type);
        });
    });
}

function renderCitas(citas) {
    const container = document.getElementById('citasList');
    container.innerHTML = '';

    if (citas.length === 0) {
        container.innerHTML = '<p>No se encontraron citas</p>';
        return;
    }

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Paciente</th>
                <th>Doctor</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Prioridad</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    citas.forEach((cita) => {
        const row = document.createElement('tr');
        row.className = `priority-${cita.prioridad}`;
        row.innerHTML = `
            <td>${cita.id}</td>
            <td>${cita.paciente_nombre}</td>
            <td>${cita.doctor_nombre}</td>
            <td>${cita.fecha}</td>
            <td>${cita.hora}</td>
            <td>${getPriorityText(cita.prioridad)}</td>
            <td>
                <button class="edit-btn" data-id="${cita.id}" data-type="cita">Editar</button>
                <button class="delete-btn" data-id="${cita.id}" data-type="cita">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    container.appendChild(table);

    // Asignar eventos a los botones
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const type = this.dataset.type;
            mostrarModalEditar(id, type);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const type = this.dataset.type;
            eliminarRegistro(id, type);
        });
    });
}

// Funciones para mostrar modales
function mostrarModalPaciente() {
    modalTitle.textContent = 'Agregar Nuevo Paciente';
    modalId.value = '';
    modalFields.innerHTML = `
        <div class="form-group">
            <label for="nombre">Nombre:</label>
            <input type="text" id="nombre" required>
        </div>
        <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" required>
        </div>
        <div class="form-group">
            <label for="telefono">Teléfono:</label>
            <input type="text" id="telefono" required>
        </div>
        <div class="form-group">
            <label for="direccion">Dirección:</label>
            <input type="text" id="direccion">
        </div>
        <div class="form-group">
            <label for="prioridad">Prioridad:</label>
            <select id="prioridad" required>
                <option value="alta">Alta</option>
                <option value="media" selected>Media</option>
                <option value="baja">Baja</option>
            </select>
        </div>
    `;
    modal.style.display = 'block';
}

function mostrarModalDoctor() {
    modalTitle.textContent = 'Agregar Nuevo Doctor';
    modalId.value = '';
    modalFields.innerHTML = `
        <div class="form-group">
            <label for="nombre">Nombre:</label>
            <input type="text" id="nombre" required>
        </div>
        <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" required>
        </div>
        <div class="form-group">
            <label for="especialidad">Especialidad:</label>
            <input type="text" id="especialidad" required>
        </div>
    `;
    modal.style.display = 'block';
}

function mostrarModalFarmacia() {
    modalTitle.textContent = 'Agregar Encargado de Farmacia';
    modalId.value = '';
    modalFields.innerHTML = `
        <div class="form-group">
            <label for="nombre">Nombre:</label>
            <input type="text" id="nombre" required>
        </div>
        <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" required>
        </div>
        <div class="form-group">
            <label for="turno">Turno:</label>
            <select id="turno" required>
                <option value="matutino">Matutino</option>
                <option value="vespertino">Vespertino</option>
                <option value="nocturno">Nocturno</option>
            </select>
        </div>
    `;
    modal.style.display = 'block';
}

function mostrarModalCita() {
    modalTitle.textContent = 'Agregar Nueva Cita';
    modalId.value = '';
    modalFields.innerHTML = `
        <div class="form-group">
            <label for="paciente_id">Paciente:</label>
            <select id="paciente_id" required>
                <option value="">Seleccione un paciente</option>
                ${pacientes.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label for="doctor_id">Doctor:</label>
            <select id="doctor_id" required>
                <option value="">Seleccione un doctor</option>
                ${doctores.map(d => `<option value="${d.id}">${d.nombre} - ${d.especialidad}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label for="fecha">Fecha:</label>
            <input type="date" id="fecha" required>
        </div>
        <div class="form-group">
            <label for="hora">Hora:</label>
            <input type="time" id="hora" required>
        </div>
        <div class="form-group">
            <label for="prioridad">Prioridad:</label>
            <select id="prioridad" required>
                <option value="alta">Alta</option>
                <option value="media" selected>Media</option>
                <option value="baja">Baja</option>
            </select>
        </div>
        <div class="form-group">
            <label for="motivo">Motivo:</label>
            <textarea id="motivo" required></textarea>
        </div>
    `;
    modal.style.display = 'block';
}

function mostrarModalEditar(id, type) {
    let registro;
    let endpoint;
    let title;
    
    switch(type) {
        case 'paciente':
            registro = pacientes.find(p => p.id == id);
            endpoint = 'pacientes.php';
            title = 'Editar Paciente';
            break;
        case 'doctor':
            registro = doctores.find(d => d.id == id);
            endpoint = 'doctores.php';
            title = 'Editar Doctor';
            break;
        case 'farmacia':
            registro = farmaciaEncargados.find(f => f.id == id);
            endpoint = 'farmacia.php';
            title = 'Editar Encargado de Farmacia';
            break;
        case 'cita':
            registro = citas.find(c => c.id == id);
            endpoint = 'citas.php';
            title = 'Editar Cita';
            break;
        default:
            return;
    }

    modalTitle.textContent = title;
    modalId.value = id;

    if (type === 'paciente') {
        modalFields.innerHTML = `
            <div class="form-group">
                <label for="nombre">Nombre:</label>
                <input type="text" id="nombre" value="${registro.nombre}" required>
            </div>
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" value="${registro.email}" required>
            </div>
            <div class="form-group">
                <label for="telefono">Teléfono:</label>
                <input type="text" id="telefono" value="${registro.telefono}" required>
            </div>
            <div class="form-group">
                <label for="direccion">Dirección:</label>
                <input type="text" id="direccion" value="${registro.direccion || ''}">
            </div>
            <div class="form-group">
                <label for="prioridad">Prioridad:</label>
                <select id="prioridad" required>
                    <option value="alta" ${registro.prioridad === 'alta' ? 'selected' : ''}>Alta</option>
                    <option value="media" ${registro.prioridad === 'media' ? 'selected' : ''}>Media</option>
                    <option value="baja" ${registro.prioridad === 'baja' ? 'selected' : ''}>Baja</option>
                </select>
            </div>
        `;
    } else if (type === 'doctor') {
        modalFields.innerHTML = `
            <div class="form-group">
                <label for="nombre">Nombre:</label>
                <input type="text" id="nombre" value="${registro.nombre}" required>
            </div>
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" value="${registro.email}" required>
            </div>
            <div class="form-group">
                <label for="especialidad">Especialidad:</label>
                <input type="text" id="especialidad" value="${registro.especialidad}" required>
            </div>
        `;
    } else if (type === 'farmacia') {
        modalFields.innerHTML = `
            <div class="form-group">
                <label for="nombre">Nombre:</label>
                <input type="text" id="nombre" value="${registro.nombre}" required>
            </div>
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" value="${registro.email}" required>
            </div>
            <div class="form-group">
                <label for="turno">Turno:</label>
                <select id="turno" required>
                    <option value="matutino" ${registro.turno === 'matutino' ? 'selected' : ''}>Matutino</option>
                    <option value="vespertino" ${registro.turno === 'vespertino' ? 'selected' : ''}>Vespertino</option>
                    <option value="nocturno" ${registro.turno === 'nocturno' ? 'selected' : ''}>Nocturno</option>
                </select>
            </div>
        `;
    } else if (type === 'cita') {
        modalFields.innerHTML = `
            <div class="form-group">
                <label for="paciente_id">Paciente:</label>
                <select id="paciente_id" required>
                    <option value="">Seleccione un paciente</option>
                    ${pacientes.map(p => `<option value="${p.id}" ${p.id == registro.paciente_id ? 'selected' : ''}>${p.nombre}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="doctor_id">Doctor:</label>
                <select id="doctor_id" required>
                    <option value="">Seleccione un doctor</option>
                    ${doctores.map(d => `<option value="${d.id}" ${d.id == registro.doctor_id ? 'selected' : ''}>${d.nombre} - ${d.especialidad}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="fecha">Fecha:</label>
                <input type="date" id="fecha" value="${registro.fecha}" required>
            </div>
            <div class="form-group">
                <label for="hora">Hora:</label>
                <input type="time" id="hora" value="${registro.hora}" required>
            </div>
            <div class="form-group">
                <label for="prioridad">Prioridad:</label>
                <select id="prioridad" required>
                    <option value="alta" ${registro.prioridad === 'alta' ? 'selected' : ''}>Alta</option>
                    <option value="media" ${registro.prioridad === 'media' ? 'selected' : ''}>Media</option>
                    <option value="baja" ${registro.prioridad === 'baja' ? 'selected' : ''}>Baja</option>
                </select>
            </div>
            <div class="form-group">
                <label for="motivo">Motivo:</label>
                <textarea id="motivo" required>${registro.motivo}</textarea>
            </div>
        `;
    }

    modal.style.display = 'block';
}

// Función para guardar desde el modal
function guardarDesdeModal() {
    const id = modalId.value;
    const type = modalForm.querySelector('input, select, textarea').id.split('_')[0];
    let endpoint;
    let method;
    let data = {};

    if (type === 'paciente') {
        endpoint = 'pacientes.php';
        data = {
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value,
            direccion: document.getElementById('direccion').value,
            prioridad: document.getElementById('prioridad').value
        };
    } else if (type === 'doctor') {
        endpoint = 'doctores.php';
        data = {
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            especialidad: document.getElementById('especialidad').value
        };
    } else if (type === 'farmacia') {
        endpoint = 'farmacia.php';
        data = {
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            turno: document.getElementById('turno').value
        };
    } else if (type === 'cita') {
        endpoint = 'citas.php';
        data = {
            paciente_id: document.getElementById('paciente_id').value,
            doctor_id: document.getElementById('doctor_id').value,
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value,
            prioridad: document.getElementById('prioridad').value,
            motivo: document.getElementById('motivo').value
        };
    }

    if (id) {
        method = 'PUT';
        data.id = id;
    } else {
        method = 'POST';
    }

    enviarDatos(endpoint, method, data, type);
}

function enviarDatos(endpoint, method, data, type) {
    const jwt = localStorage.getItem('jwt');
    const url = `http://localhost:8000/backend/api/${endpoint}${method === 'PUT' ? `?id=${data.id}` : ''}`;

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al guardar los datos');
        return response.json();
    })
    .then(result => {
        alert(result.message || 'Datos guardados exitosamente');
        modal.style.display = 'none';
        
        // Recargar los datos según el tipo
        switch(type) {
            case 'paciente':
                cargarPacientes();
                break;
            case 'doctor':
                cargarDoctores();
                break;
            case 'farmacia':
                cargarFarmaciaEncargados();
                break;
            case 'cita':
                cargarCitas();
                break;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al guardar los datos: ' + error.message);
    });
}

function eliminarRegistro(id, type) {
    if (!confirm(`¿Está seguro que desea eliminar este ${type}?`)) {
        return;
    }

    const jwt = localStorage.getItem('jwt');
    let endpoint;
    
    switch(type) {
        case 'paciente':
            endpoint = 'pacientes.php';
            break;
        case 'doctor':
            endpoint = 'doctores.php';
            break;
        case 'farmacia':
            endpoint = 'farmacia.php';
            break;
        case 'cita':
            endpoint = 'citas.php';
            break;
        default:
            return;
    }

    fetch(`http://localhost:8000/backend/api/${endpoint}?id=${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${jwt}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al eliminar el registro');
        return response.json();
    })
    .then(result => {
        alert(result.message || 'Registro eliminado exitosamente');
        
        // Recargar los datos según el tipo
        switch(type) {
            case 'paciente':
                cargarPacientes();
                break;
            case 'doctor':
                cargarDoctores();
                break;
            case 'farmacia':
                cargarFarmaciaEncargados();
                break;
            case 'cita':
                cargarCitas();
                break;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al eliminar el registro: ' + error.message);
    });
}