document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.rol !== 'doctor') {
        window.location.href = 'login.html';
    }

    // Variables globales
    let pacientes = [];
    let medicamentos = [];
    let currentPacienteHistorialId = null; // Para almacenar el ID del paciente cuyo historial se está viendo

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
            } else if (this.dataset.tab === 'recetas') {
                cargarPacientesParaReceta();
                cargarMedicamentos();
            } else if (this.dataset.tab === 'historial') {
                // Si ya hay un paciente seleccionado, recargar su historial
                if (currentPacienteHistorialId) {
                    verHistorial(currentPacienteHistorialId);
                } else {
                    // Si no hay paciente seleccionado, limpiar el historial y mostrar un mensaje
                    document.getElementById('historial-container').innerHTML = '';
                    document.getElementById('mensajeHistorial').textContent = 'Seleccione un paciente para ver su historial.';
                }
            }
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function () {
        localStorage.removeItem('user');
        localStorage.removeItem('jwt');
        window.location.href = 'login.html';
    });

    // Búsqueda de pacientes
    document
        .getElementById('searchBtn')
        .addEventListener('click', buscarPacientes);
    document
        .getElementById('searchPaciente')
        .addEventListener('keyup', function (e) {
            if (e.key === 'Enter') buscarPacientes();
        });

    // Búsqueda de historial (solo filtra lo que está cargado)
    document
        .getElementById('searchHistorialBtn')
        .addEventListener('click', buscarHistorial);
    document
        .getElementById('searchHistorial')
        .addEventListener('keyup', function (e) {
            if (e.key === 'Enter') buscarHistorial();
        });

    // Añadir medicamento a receta
    document
        .getElementById('addMedicamentoBtn')
        .addEventListener('click', agregarMedicamento);

    // Formulario de receta
    document
        .getElementById('recetaForm')
        .addEventListener('submit', function (e) {
            e.preventDefault();
            generarReceta();
        });

    // Cargar datos iniciales
    cargarPacientes();
    cargarMedicamentos();
});

// Función para cargar pacientes
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

// Función para buscar pacientes
function buscarPacientes() {
    const searchTerm = document
        .getElementById('searchPaciente')
        .value.toLowerCase();
    const filtered = pacientes.filter(
        (paciente) =>
            paciente.nombre.toLowerCase().includes(searchTerm) ||
            paciente.email.toLowerCase().includes(searchTerm)
    );
    renderPacientes(filtered);
}

// Función para renderizar pacientes
function renderPacientes(pacientes) {
    const pacientesList = document.getElementById('pacientesList');
    pacientesList.innerHTML = '';

    if (pacientes.length === 0) {
        pacientesList.innerHTML = '<p>No se encontraron pacientes</p>';
        return;
    }

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    pacientes.forEach((paciente) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${paciente.nombre}</td>
            <td>${paciente.email}</td>
            <td>${paciente.telefono}</td>
            <td>
                <button class="view-btn" data-id="${paciente.id}">Ver Historial</button>
                <button class="receta-btn" data-id="${paciente.id}">Generar Receta</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    pacientesList.appendChild(table);

    // Eventos para botones
    document.querySelectorAll('.view-btn').forEach((btn) => {
        btn.addEventListener('click', function () {
            // Guarda el ID del paciente actual antes de cambiar de pestaña
            window.currentPacienteHistorialId = this.dataset.id;
            verHistorial(this.dataset.id);
        });
    });

    document.querySelectorAll('.receta-btn').forEach((btn) => {
        btn.addEventListener('click', function () {
            generarRecetaParaPaciente(this.dataset.id);
        });
    });
}

// Función para cargar pacientes en el select de recetas
function cargarPacientesParaReceta() {
    const select = document.getElementById('pacienteSelect');
    select.innerHTML = '<option value="">Seleccione un paciente</option>';

    pacientes.forEach((paciente) => {
        const option = document.createElement('option');
        option.value = paciente.id;
        option.textContent = `${paciente.nombre} (${paciente.email})`;
        select.appendChild(option);
    });
}

// Función para cargar medicamentos
function cargarMedicamentos() {
    fetch('http://localhost:8000/backend/api/medicamentos.php')
        .then((response) => response.json())
        .then((data) => {
            medicamentos = data;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

// Función para agregar medicamento a receta
function agregarMedicamento() {
    const container = document.getElementById('medicamentosContainer');
    const div = document.createElement('div');
    div.className = 'medicamento-item';
    div.innerHTML = `
        <select class="medicamento-select" required>
            <option value="">Seleccione medicamento</option>
            ${medicamentos
                .map(
                    (m) =>
                        `<option value="${m.id}">${m.nombre} (${m.cantidad} disponibles)</option>`
                )
                .join('')}
        </select>
        <input type="number" class="medicamento-cantidad" min="1" value="1" required />
        <textarea class="medicamento-instrucciones" placeholder="Instrucciones específicas"></textarea>
        <button type="button" class="remove-medicamento-btn">Eliminar</button>
    `;
    container.appendChild(div);

    div.querySelector('.remove-medicamento-btn').addEventListener('click', function () {
        container.removeChild(div);
    });
}

// Función para generar receta
function generarReceta() {
    const jwt = localStorage.getItem('jwt');
    const pacienteId = document.getElementById('pacienteSelect').value;
    const diagnostico = document.getElementById('diagnostico').value;
    const instrucciones = document.getElementById('instrucciones').value;

    const medicamentosData = [];
    document.querySelectorAll('.medicamento-item').forEach((item) => {
        medicamentosData.push({
            medicamento_id: item.querySelector('.medicamento-select').value,
            cantidad: item.querySelector('.medicamento-cantidad').value,
            instrucciones: item.querySelector('.medicamento-instrucciones').value,
        });
    });

    const recetaData = {
        paciente_id: pacienteId,
        doctor_id: JSON.parse(localStorage.getItem('user')).id,
        diagnostico: diagnostico,
        instrucciones: instrucciones,
        medicamentos: medicamentosData,
    };

    fetch('http://localhost:8000/backend/api/recetas.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(recetaData),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                alert(data.error);
            } else {
                alert('Receta generada exitosamente');
                document.getElementById('recetaForm').reset();
                document.getElementById('medicamentosContainer').innerHTML = '';
                // Una vez generada la receta, si estábamos viendo el historial de ese paciente, lo actualizamos.
                if (window.currentPacienteHistorialId == pacienteId) {
                    verHistorial(pacienteId);
                }
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error al generar receta');
        });
}

// Función para cargar historial médico (ahora solo se llama desde verHistorial)
// Mantengo la función original, pero su uso directo ha cambiado.
// Se ha refactorizado la lógica de display a 'mostrarHistorialEnPagina'
function cargarHistorialMedico(pacienteId) {
    // Esta función ya no se llama directamente desde el cambio de pestaña.
    // Su lógica ha sido absorbida por 'verHistorial' para asegurar que siempre se tenga un pacienteId.
    console.warn("cargarHistorialMedico() debería llamarse a través de verHistorial(pacienteId) para asegurar un ID.");
}


// Función para buscar en historial (filtra el historial actualmente mostrado)
function buscarHistorial() {
    const searchTerm = document.getElementById('searchHistorial').value.toLowerCase();
    const historialContainer = document.getElementById('historial-container');
    const recetas = historialContainer.querySelectorAll('.receta-card');

    if (!recetas.length) {
        // No hay historial cargado o no se ha seleccionado un paciente
        document.getElementById('mensajeHistorial').textContent = 'No hay historial cargado para filtrar. Seleccione un paciente primero.';
        return;
    }

    let found = false;
    recetas.forEach(recetaCard => {
        const textContent = recetaCard.textContent.toLowerCase();
        if (textContent.includes(searchTerm)) {
            recetaCard.style.display = ''; // Mostrar
            found = true;
        } else {
            recetaCard.style.display = 'none'; // Ocultar
        }
    });

    if (!found) {
        document.getElementById('mensajeHistorial').textContent = 'No se encontraron registros que coincidan con su búsqueda.';
    } else {
        // Restaurar el mensaje original si se encontró algo y se había mostrado un mensaje de "no encontrados"
        if (window.currentPacienteHistorialId) {
            const paciente = pacientes.find(p => p.id == window.currentPacienteHistorialId);
            const nombrePaciente = paciente ? paciente.nombre : 'Paciente ID '+window.currentPacienteHistorialId;
            document.getElementById('mensajeHistorial').textContent = `Historial médico de ${nombrePaciente}`;
        }
    }
}

// Función para generar receta para paciente específico
function generarRecetaParaPaciente(pacienteId) {
    // Cambiar a pestaña de recetas
    document.querySelector('.tab-btn[data-tab="recetas"]').click();

    // Seleccionar paciente
    const select = document.getElementById('pacienteSelect');
    select.value = pacienteId;

    // Enfocar en diagnóstico
    document.getElementById('diagnostico').focus();
}

// Función para ver historial y mostrar mensaje en la página
function verHistorial(pacienteId) {
    const jwt = localStorage.getItem('jwt');
    const mensajeDiv = document.getElementById('mensajeHistorial');
    const historialContainer = document.getElementById('historial-container');

    // Almacena el ID del paciente cuyo historial estamos viendo
    window.currentPacienteHistorialId = pacienteId;

    // Mostrar mensaje de carga
    mensajeDiv.textContent = 'Cargando historial...';
    historialContainer.innerHTML = ''; // Limpiar historial anterior

    fetch(`http://localhost:8000/backend/api/recetas.php?paciente_id=${pacienteId}`, {
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al cargar historial');
        return response.json();
    })
    .then(data => {
        console.log("Datos recibidos del servidor:", data);
        
        // Cambiar a pestaña de historial
        document.querySelector('.tab-btn[data-tab="historial"]').click();
        
        // Mostrar el historial en la página
        mostrarHistorialEnPagina(data, pacienteId); // Pasamos pacienteId para el mensaje
        
        // Actualizar mensaje
        const paciente = pacientes.find(p => p.id == pacienteId);
        const nombrePaciente = paciente ? paciente.nombre : 'Paciente ID '+pacienteId;
        const numRecetas = data.length;
        mensajeDiv.textContent = `Historial médico de ${nombrePaciente} (${numRecetas} receta(s))`;
    })
    .catch(error => {
        console.error('Error al cargar historial:', error);
        mensajeDiv.textContent = 'No se pudo cargar el historial del paciente.';
        historialContainer.innerHTML = '<p>Error al cargar el historial. Por favor, intente nuevamente.</p>';
    });
}

function mostrarHistorialEnPagina(historial, pacienteId) {
    const historialContainer = document.getElementById('historial-container');
    historialContainer.innerHTML = '';

    if (!historial || historial.length === 0) {
        historialContainer.innerHTML = '<p>No se encontraron recetas para este paciente.</p>';
        return;
    }

    // Ordenar recetas por ID (mayor primero)
    historial.sort((a, b) => b.id - a.id);

    historial.forEach(receta => {
        const recetaCard = document.createElement('div');
        recetaCard.className = 'receta-card';
        
        // Formatear fecha (usando created_at si existe, sino fecha actual)
        const fecha = receta.created_at ? new Date(receta.created_at) : new Date();
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric', 
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Construir el contenido HTML
        let contenidoHTML = `
            <div class="receta-header">
                <h3>Receta #${receta.id}</h3>
                <span class="receta-fecha">${fechaFormateada}</span>
            </div>
            <div class="receta-content">
        `;

        // Mostrar diagnóstico (usando el campo que corresponda)
        // Se prefiere 'diagnostico' y si no existe se usa 'notas'
        if (receta.diagnostico || receta.notas) {
            contenidoHTML += `
                <div class="receta-section">
                    <h4>Diagnóstico/Notas</h4>
                    <p>${receta.diagnostico || receta.notas || 'No especificado'}</p>
                </div>
            `;
        }

        // Mostrar instrucciones si existen
        if (receta.instrucciones) {
            contenidoHTML += `
                <div class="receta-section">
                    <h4>Instrucciones</h4>
                    <p>${receta.instrucciones}</p>
                </div>
            `;
        }

        // Mostrar medicamentos asociados a la receta
        if (receta.medicamentos && receta.medicamentos.length > 0) {
            contenidoHTML += `
                <div class="receta-section">
                    <h4>Medicamentos</h4>
                    <ul>
            `;
            receta.medicamentos.forEach(med => {
                const medicamentoNombre = medicamentos.find(m => m.id == med.medicamento_id)?.nombre || `Medicamento ID: ${med.medicamento_id}`;
                contenidoHTML += `
                    <li>
                        <strong>${medicamentoNombre}</strong> - Cantidad: ${med.cantidad}
                        ${med.instrucciones ? `<br><em>Instrucciones: ${med.instrucciones}</em>` : ''}
                    </li>
                `;
            });
            contenidoHTML += `
                    </ul>
                </div>
            `;
        } else {
             contenidoHTML += `
                <div class="receta-section">
                    <h4>Medicamentos</h4>
                    <p>No hay medicamentos registrados para esta receta.</p>
                </div>
            `;
        }

        // Cerrar el contenido
        contenidoHTML += `</div>`;
        recetaCard.innerHTML = contenidoHTML;
        historialContainer.appendChild(recetaCard);
    });
}