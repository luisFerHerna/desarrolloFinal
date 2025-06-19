document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.rol !== 'distribuidor') {
        window.location.href = 'login.html';
    }

    // Elementos del DOM
    const medicamentosList = document.getElementById('medicamentosList');
    const searchBtn = document.getElementById('searchBtn');
    const searchMed = document.getElementById('searchMed');
    const addMedBtn = document.getElementById('addMedBtn');
    const medModal = document.getElementById('medModal');
    const modalTitle = document.getElementById('modalTitle');
    const medForm = document.getElementById('medForm');
    const closeBtn = document.querySelector('.close');
    const logoutBtn = document.getElementById('logoutBtn');

    // Variables
    let medicamentos = [];
    let editingId = null;

    // Event listeners
    searchBtn.addEventListener('click', buscarMedicamentos);
    searchMed.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') buscarMedicamentos();
    });
    addMedBtn.addEventListener('click', abrirModalAgregar);
    closeBtn.addEventListener('click', cerrarModal);
    window.addEventListener('click', function(e) {
        if (e.target === medModal) cerrarModal();
    });
    medForm.addEventListener('submit', guardarMedicamento);
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('user');
        localStorage.removeItem('jwt');
        window.location.href = 'login.html';
    });

    // Cargar medicamentos al iniciar
    cargarMedicamentos();

    // Funciones
    function cargarMedicamentos() {
        // Es crucial enviar el JWT en la cabecera 'Authorization' para que tu API te dé los datos si está protegida.
        const jwt = localStorage.getItem('jwt'); 

        fetch('http://localhost:8000/backend/api/medicamentos.php', {
            headers: {
                'Authorization': `Bearer ${jwt}` // ¡Asegúrate de enviar el token!
            }
        })
        .then(response => {
            if (!response.ok) {
                // Si la respuesta no es OK (ej. 401, 403, 500), maneja el error.
                // Intentamos parsear el mensaje de error del backend si existe.
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Error al cargar medicamentos.');
                });
            }
            return response.json();
        })
        .then(data => {
            medicamentos = data;
            renderMedicamentos(data);
            verificarStockBajo();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar medicamentos: ' + error.message);
        });
    }

    function renderMedicamentos(meds) {
        medicamentosList.innerHTML = '';

        if (meds.length === 0) {
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

        meds.forEach(med => {
            const row = document.createElement('tr');
            
            // Determinar clase CSS según el stock
            let stockClass = '';
            if (med.cantidad <= 10) {
                stockClass = 'low-stock';
            } else if (med.cantidad <= 50) {
                stockClass = 'medium-stock';
            } else {
                stockClass = 'high-stock';
            }
            
            row.className = stockClass;
            
            // **** ESTA ES LA LÍNEA CLAVE PARA CORREGIR EL ERROR ****
            // Convertimos med.precio a un número flotante ANTES de llamar a toFixed().
            const precioFormateado = parseFloat(med.precio).toFixed(2);
            
            row.innerHTML = `
                <td>${med.nombre}</td>
                <td>${med.descripcion}</td>
                <td>${med.cantidad}</td>
                <td>$${precioFormateado}</td> <td>
                    <button class="edit-btn" data-id="${med.id}">Editar</button>
                    <button class="delete-btn" data-id="${med.id}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        medicamentosList.appendChild(table);

        // Agregar eventos a los botones
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                abrirModalEditar(this.dataset.id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                eliminarMedicamento(this.dataset.id);
            });
        });
    }

    function buscarMedicamentos() {
        const searchTerm = searchMed.value.toLowerCase();
        const filtered = medicamentos.filter(med => 
            med.nombre.toLowerCase().includes(searchTerm) || 
            med.descripcion.toLowerCase().includes(searchTerm)
        );
        renderMedicamentos(filtered);
    }

    function abrirModalAgregar() {
        editingId = null;
        modalTitle.textContent = 'Agregar Medicamento';
        medForm.reset();
        document.getElementById('medId').value = '';
        medModal.style.display = 'block';
    }

    function abrirModalEditar(id) {
        const med = medicamentos.find(m => m.id == id);
        if (!med) return;

        editingId = id;
        modalTitle.textContent = 'Editar Medicamento';
        document.getElementById('medId').value = med.id;
        document.getElementById('medNombre').value = med.nombre;
        document.getElementById('medDescripcion').value = med.descripcion;
        document.getElementById('medCantidad').value = med.cantidad;
        // Al cargar el precio en el input, también puedes asegurarte de que sea un número.
        document.getElementById('medPrecio').value = parseFloat(med.precio); 
        medModal.style.display = 'block';
    }

    function cerrarModal() {
        medModal.style.display = 'none';
    }

    function guardarMedicamento(e) {
        e.preventDefault();
        
        const medData = {
            nombre: document.getElementById('medNombre').value,
            descripcion: document.getElementById('medDescripcion').value,
            cantidad: parseInt(document.getElementById('medCantidad').value),
            // Aseguramos que el precio sea un float antes de enviarlo al backend
            precio: parseFloat(document.getElementById('medPrecio').value) 
        };

        const jwt = localStorage.getItem('jwt');
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? 
            `http://localhost:8000/backend/api/medicamentos.php?id=${editingId}` : 
            'http://localhost:8000/backend/api/medicamentos.php';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwt}`
            },
            body: JSON.stringify(medData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Error en la API al guardar.'); });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert(editingId ? 'Medicamento actualizado exitosamente' : 'Medicamento agregado exitosamente');
                cerrarModal();
                cargarMedicamentos();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al guardar medicamento: ' + error.message);
        });
    }

    function eliminarMedicamento(id) {
        if (!confirm('¿Está seguro de eliminar este medicamento?')) return;

        const jwt = localStorage.getItem('jwt');
        
        fetch(`http://localhost:8000/backend/api/medicamentos.php?id=${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${jwt}`
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Error en la API al eliminar.'); });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert('Medicamento eliminado exitosamente');
                cargarMedicamentos();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al eliminar medicamento: ' + error.message);
        });
    }

    function verificarStockBajo() {
        const bajosStock = medicamentos.filter(med => med.cantidad <= 10);
        const mediosStock = medicamentos.filter(med => med.cantidad > 10 && med.cantidad <= 50);
        
        if (bajosStock.length > 0) {
            const nombres = bajosStock.map(med => med.nombre).join(', ');
            alert(`¡ADVERTENCIA! Los siguientes medicamentos tienen stock bajo (≤10 unidades): ${nombres}`);
        }
        
        if (mediosStock.length > 0) {
            const nombres = mediosStock.map(med => med.nombre).join(', ');
            console.log(`Medicamentos con stock medio (11-50 unidades): ${nombres}`);
        }
    }
});