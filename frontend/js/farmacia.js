document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.rol !== 'farmacia') {
        window.location.href = 'login.html';
    }

    // Variables globales
    let medicamentos = [];
    let editando = false;

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

            if (this.dataset.tab === 'medicamentos') {
                cargarMedicamentos();
            }
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function () {
        localStorage.removeItem('user');
        localStorage.removeItem('jwt');
        window.location.href = 'login.html';
    });

    // Búsqueda de medicamentos
    document.getElementById('searchBtn').addEventListener('click', buscarMedicamentos);
    document.getElementById('searchMedicamento').addEventListener('keyup', function (e) {
        if (e.key === 'Enter') buscarMedicamentos();
    });

    // Formulario de medicamento
    document.getElementById('medicamentoForm').addEventListener('submit', function (e) {
        e.preventDefault();
        if (editando) {
            actualizarMedicamento();
        } else {
            agregarMedicamento();
        }
    });

    // Botón cancelar edición
    document.getElementById('cancelBtn').addEventListener('click', function () {
        resetForm();
    });

    // Cargar datos iniciales
    cargarMedicamentos();

    // Función para cargar medicamentos
    function cargarMedicamentos() {
        const jwt = localStorage.getItem('jwt');

        fetch('http://localhost:8000/backend/api/medicamentos.php', {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
        })
            .then((response) => {
                if (!response.ok) throw new Error('Error al cargar medicamentos');
                return response.json();
            })
            .then((data) => {
                medicamentos = data;
                renderMedicamentos(data);
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Error al cargar medicamentos');
            });
    }

    // Función para buscar medicamentos
    function buscarMedicamentos() {
        const searchTerm = document.getElementById('searchMedicamento').value.toLowerCase();
        const filtered = medicamentos.filter(
            (med) =>
                med.nombre.toLowerCase().includes(searchTerm) ||
                med.descripcion.toLowerCase().includes(searchTerm)
        );
        renderMedicamentos(filtered);
    }

    // Función para renderizar medicamentos
    function renderMedicamentos(medicamentos) {
        const medicamentosList = document.getElementById('medicamentosList');
        medicamentosList.innerHTML = '';

        if (medicamentos.length === 0) {
            medicamentosList.innerHTML = '<p>No se encontraron medicamentos</p>';
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');

        medicamentos.forEach((med) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${med.nombre}</td>
                <td>${med.descripcion}</td>
                <td>${med.cantidad}</td>
                <td>$${med.precio}</td>
                <td>
                    <button class="edit-btn" data-id="${med.id}">Editar</button>
                    <button class="delete-btn" data-id="${med.id}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        medicamentosList.appendChild(table);

        // Eventos para botones de editar
        document.querySelectorAll('.edit-btn').forEach((btn) => {
            btn.addEventListener('click', function () {
                editarMedicamento(this.dataset.id);
            });
        });

        // Eventos para botones de eliminar
        document.querySelectorAll('.delete-btn').forEach((btn) => {
            btn.addEventListener('click', function () {
                eliminarMedicamento(this.dataset.id);
            });
        });
    }

    // Función para agregar medicamento
    function agregarMedicamento() {
        const jwt = localStorage.getItem('jwt');
        const medicamentoData = {
            nombre: document.getElementById('nombre').value,
            descripcion: document.getElementById('descripcion').value,
            cantidad: document.getElementById('cantidad').value,
            precio: document.getElementById('precio').value
        };

        fetch('http://localhost:8000/backend/api/medicamentos.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${jwt}`,
            },
            body: JSON.stringify(medicamentoData),
        })
            .then((response) => {
                if (!response.ok) throw new Error('Error al agregar medicamento');
                return response.json();
            })
            .then((data) => {
                alert('Medicamento agregado exitosamente');
                resetForm();
                cargarMedicamentos();
                document.querySelector('.tab-btn[data-tab="medicamentos"]').click();
            })
            .catch((error) => {
                console.error('Error:', error);
                alert(error.message);
            });
    }

    // Función para editar medicamento
    function editarMedicamento(id) {
        const medicamento = medicamentos.find(m => m.id == id);
        if (!medicamento) return;

        editando = true;
        document.getElementById('medicamentoId').value = medicamento.id;
        document.getElementById('nombre').value = medicamento.nombre;
        document.getElementById('descripcion').value = medicamento.descripcion;
        document.getElementById('cantidad').value = medicamento.cantidad;
        document.getElementById('precio').value = medicamento.precio;
        
        document.getElementById('formTitle').textContent = 'Editar Medicamento';
        document.getElementById('submitBtn').textContent = 'Actualizar';
        document.getElementById('cancelBtn').style.display = 'inline-block';
        
        document.querySelector('.tab-btn[data-tab="agregar"]').click();
    }

    // Función para actualizar medicamento
    function actualizarMedicamento() {
        const jwt = localStorage.getItem('jwt');
        const id = document.getElementById('medicamentoId').value;
        const medicamentoData = {
            nombre: document.getElementById('nombre').value,
            descripcion: document.getElementById('descripcion').value,
            cantidad: document.getElementById('cantidad').value,
            precio: document.getElementById('precio').value
        };

        fetch(`http://localhost:8000/backend/api/medicamentos.php?id=${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${jwt}`,
            },
            body: JSON.stringify(medicamentoData),
        })
            .then((response) => {
                if (!response.ok) throw new Error('Error al actualizar medicamento');
                return response.json();
            })
            .then((data) => {
                alert('Medicamento actualizado exitosamente');
                resetForm();
                cargarMedicamentos();
                document.querySelector('.tab-btn[data-tab="medicamentos"]').click();
            })
            .catch((error) => {
                console.error('Error:', error);
                alert(error.message);
            });
    }

    // Función para eliminar medicamento
    function eliminarMedicamento(id) {
    if (!confirm('¿Está seguro que desea eliminar este medicamento?')) return;

    const jwt = localStorage.getItem('jwt');

    fetch(`http://localhost:8000/backend/api/medicamentos.php?id=${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                alert(data.error);
            } else {
                alert('Medicamento eliminado exitosamente');
                cargarMedicamentos();
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error al eliminar medicamento');
        });
}

    // Función para resetear el formulario
    function resetForm() {
        editando = false;
        document.getElementById('medicamentoForm').reset();
        document.getElementById('medicamentoId').value = '';
        document.getElementById('formTitle').textContent = 'Agregar Nuevo Medicamento';
        document.getElementById('submitBtn').textContent = 'Agregar';
        document.getElementById('cancelBtn').style.display = 'none';
    }
});