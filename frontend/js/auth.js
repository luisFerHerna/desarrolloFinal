document.addEventListener('DOMContentLoaded', function() {
    // Manejo de tabs
    document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach((b) => 
                b.classList.remove('active')
            );
            document.querySelectorAll('.tab-content').forEach((c) => 
                c.classList.remove('active')
            );

            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');
        });
    });

    // Formulario de login
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });

    // Formulario de registro
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        register();
    });
});

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const message = document.getElementById('loginMessage');

    fetch('http://localhost:8000/backend/api/auth.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error || data.message === "Credenciales inválidas") {
            message.textContent = data.error || data.message;
            message.className = 'message error';
        } else {
            localStorage.setItem('token', data.jwt);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirección según rol
            switch(data.user.rol.toLowerCase()) {
                case 'doctor': window.location.href = 'doctor.html'; break;
                case 'farmacia': window.location.href = 'farmacia.html'; break;
                case 'recepcion': window.location.href = 'recepcion.html'; break;
                case 'paciente': window.location.href = 'paciente.html'; break;
                case 'distribuidor': window.location.href = 'distribuidor.html'; break;
                default: 
                    message.textContent = 'Rol no reconocido';
                    message.className = 'message error';
            }
        }
    })
    .catch(error => {
        message.textContent = 'Error de conexión';
        message.className = 'message error';
    });
}

function register() {
    const nombre = document.getElementById('regNombre').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const telefono = document.getElementById('regTelefono').value;
    const direccion = document.getElementById('regDireccion').value;
    const fecha_nacimiento = document.getElementById('regFechaNacimiento').value;
    const genero = document.getElementById('regGenero').value;
    const message = document.getElementById('registerMessage');

    const pacienteData = {
        registro: true,
        nombre,
        email,
        password,
        telefono,
        direccion,
        fecha_nacimiento,
        genero
    };

    fetch('http://localhost:8000/backend/api/auth.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(pacienteData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            message.textContent = data.error;
            message.className = 'message error';
        } else {
            message.textContent = data.message || 'Registro exitoso. Ahora puedes iniciar sesión.';
            message.className = 'message success';
            // Cambiar a pestaña de login
            document.querySelector('.tab-btn[data-tab="login"]').click();
        }
    })
    .catch(error => {
        message.textContent = 'Error de conexión';
        message.className = 'message error';
    });
}