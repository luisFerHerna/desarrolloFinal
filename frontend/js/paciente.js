document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('user'));
    // Mensaje de bienvenida (asume que existe un elemento con ID 'bienvenidaUsuario' en tu HTML)
    // Agregamos una verificación para evitar el error "Cannot set properties of null"
    const bienvenidaUsuarioElem = document.getElementById('bienvenidaUsuario');
    if (bienvenidaUsuarioElem && user) {
        bienvenidaUsuarioElem.textContent = `Bienvenido, ${user.nombre} (${user.rol})`;
    }

    if (!user || user.rol !== 'paciente') {
        window.location.href = 'login.html';
        return; // Detener la ejecución si el usuario no es válido
    }

    // Variables globales
    let doctores = [];
    let citasPaciente = [];

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
            if (this.dataset.tab === 'mis-citas') {
                cargarCitasPaciente();
            } else if (this.dataset.tab === 'agendar-cita') {
                // Asegurarse de que los doctores estén cargados cuando se va a agendar cita
                if (doctores.length === 0) {
                    cargarDoctores();
                }
            }
        });
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) { // Verificar si el botón existe antes de añadir el listener
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('user');
            localStorage.removeItem('jwt');
            window.location.href = 'login.html';
        });
    }


    // Configurar fecha mínima (hoy) para la cita
    const fechaCitaInput = document.getElementById('fechaCita');
    if (fechaCitaInput) { // Verificar si el input existe
        fechaCitaInput.min = new Date().toISOString().split('T')[0];
    }

    // Búsqueda de citas
    const searchCitasBtn = document.getElementById('searchCitasBtn');
    const searchCitasInput = document.getElementById('searchCitas');
    if (searchCitasBtn) {
        searchCitasBtn.addEventListener('click', buscarCitas);
    }
    if (searchCitasInput) {
        searchCitasInput.addEventListener('keyup', function (e) {
            if (e.key === 'Enter') buscarCitas();
        });
    }


    // Formulario de cita
    const citaForm = document.getElementById('citaForm');
    if (citaForm) { // Verificar si el formulario existe
        citaForm.addEventListener('submit', function (e) {
            e.preventDefault();
            agendarCita();
        });
    }


    // Cargar datos iniciales
    cargarDoctores(); // Cargar doctores al inicio para tenerlos disponibles
    cargarCitasPaciente(); // Cargar las citas del paciente al inicio

    // Funciones
    function cargarDoctores() {
        const jwt = localStorage.getItem('jwt');

        fetch('http://localhost:8000/backend/api/doctores.php', {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
        })
            .then((response) => {
                if (!response.ok) {
                    // Manejo de errores más específico
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Error al cargar doctores desde el servidor.');
                    });
                }
                return response.json();
            })
            .then((data) => {
                doctores = data;
                renderDoctores(data);
            })
            .catch((error) => {
                console.error('Error al cargar doctores:', error);
                alert('Error al cargar doctores: ' + error.message);
            });
    }

    // Función para renderizar doctores en el select
    function renderDoctores(doctores) {
        const select = document.getElementById('doctorSelect');
        if (!select) { // ¡Importante! Si el select no existe, salimos.
            console.error("El elemento con ID 'doctorSelect' no se encontró en el DOM.");
            return;
        }
        select.innerHTML = '<option value="">Seleccione un doctor</option>';

        doctores.forEach((doctor) => {
            const option = document.createElement('option');
            option.value = doctor.id;
            option.textContent = `${doctor.nombre} (${doctor.especialidad})`;
            select.appendChild(option);
        });
    }

    // Función para cargar citas del paciente
    function cargarCitasPaciente() {
        const jwt = localStorage.getItem('jwt');
        const user = JSON.parse(localStorage.getItem('user'));
        const pacienteId = user.id; // Asumiendo que el ID del paciente es el mismo que el ID de usuario

        fetch(`http://localhost:8000/backend/api/citas.php?paciente_id=${pacienteId}`, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Error al cargar citas del servidor.');
                    });
                }
                return response.json();
            })
            .then((data) => {
                citasPaciente = data;
                renderCitasPaciente(data);
            })
            .catch((error) => {
                console.error('Error al cargar citas:', error);
                alert('Error al cargar citas: ' + error.message);
            });
    }

    // Función para renderizar citas del paciente
    function renderCitasPaciente(citas) {
        const citasList = document.getElementById('citasList');
        if (!citasList) { // Verificar si el contenedor existe
            console.error("El elemento con ID 'citasList' no se encontró en el DOM.");
            return;
        }
        citasList.innerHTML = '';

        if (citas.length === 0) {
            citasList.innerHTML = '<p>No tienes citas programadas</p>';
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
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');

        citas.forEach((cita) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cita.doctor_nombre || 'Desconocido'}</td>
                <td>${new Date(cita.fecha).toLocaleDateString('es-ES')}</td>
                <td>${cita.hora ? cita.hora.substring(0, 5) : 'N/A'}</td>
                <td>${cita.estado || 'Desconocido'}</td>
                <td>
                    <button class="cancel-btn" data-id="${cita.id}" ${cita.estado !== 'pendiente' ? 'disabled' : ''}>
                        Cancelar
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        citasList.appendChild(table);

        // Eventos para botones de cancelar
        document.querySelectorAll('.cancel-btn').forEach((btn) => {
            btn.addEventListener('click', function () {
                cancelarCita(this.dataset.id);
            });
        });
    }

    // Función para buscar citas
    function buscarCitas() {
        const searchTerm = document.getElementById('searchCitas').value.toLowerCase();
        const filtered = citasPaciente.filter(
            (cita) =>
                (cita.doctor_nombre && cita.doctor_nombre.toLowerCase().includes(searchTerm)) ||
                (cita.fecha && cita.fecha.toLowerCase().includes(searchTerm)) ||
                (cita.estado && cita.estado.toLowerCase().includes(searchTerm))
        );
        renderCitasPaciente(filtered);
    }

    // Función para agendar cita
    function agendarCita() {
        const jwt = localStorage.getItem('jwt');
        const user = JSON.parse(localStorage.getItem('user'));
        const pacienteId = user.id;

        const doctorId = document.getElementById('doctorSelect').value;
        const fecha = document.getElementById('fechaCita').value;
        const hora = document.getElementById('horaCita').value;
        const urgencia = 'media'; // Por defecto para citas de paciente

        // Validación básica antes de enviar
        if (!doctorId || !fecha || !hora) {
            alert('Por favor, complete todos los campos obligatorios para la cita (doctor, fecha, hora).');
            return;
        }

        const citaData = {
            paciente_id: pacienteId,
            doctor_id: doctorId,
            fecha: fecha,
            hora: hora,
            urgencia: urgencia, // Se envía siempre como 'normal'
        };

        fetch('http://localhost:8000/backend/api/citas.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${jwt}`,
            },
            body: JSON.stringify(citaData),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Error al agendar cita desde el servidor.');
                    });
                }
                return response.json();
            })
            .then((data) => {
                alert('Cita agendada exitosamente');
                document.getElementById('citaForm').reset();
                cargarCitasPaciente();
                // Cambiar a pestaña de citas (asegúrate de que exista un botón con este data-tab)
                const misCitasTabBtn = document.querySelector('.tab-btn[data-tab="mis-citas"]');
                if (misCitasTabBtn) {
                    misCitasTabBtn.click();
                }
            })
            .catch((error) => {
                console.error('Error al agendar cita:', error);
                alert('Error al agendar cita: ' + error.message);
            });
    }

    // Función para cancelar cita
    function cancelarCita(citaId) {
        const jwt = localStorage.getItem('jwt');
        
        if (!confirm('¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.')) {
            return;
        }

        fetch(`http://localhost:8000/backend/api/citas.php?id=${citaId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Error al cancelar cita desde el servidor.');
                    });
                }
                return response.json();
            })
            .then((data) => {
                alert('Cita cancelada exitosamente');
                cargarCitasPaciente();
            })
            .catch((error) => {
                console.error('Error al cancelar cita:', error);
                alert('Error al cancelar cita: ' + error.message);
            });
    }
});