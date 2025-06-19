document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('http://localhost:8000/backend/api/auth.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => {
        // Siempre loguea la respuesta cruda para depuración
        console.log("Respuesta FETCH completa:", response);
        if (!response.ok) {
            // Si la respuesta no es OK (ej. 401, 500), intenta leer el cuerpo como JSON
            return response.json().then(errorData => {
                console.error("Error en la respuesta del servidor:", errorData);
                // Propaga el error para que sea capturado por el .catch()
                throw new Error(errorData.message || 'Error desconocido del servidor');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log("Datos recibidos (JSON):", data); // Datos ya parseados a JSON
        
        if (data.error || data.message === "Credenciales inválidas") {
            document.getElementById('message').textContent = data.error || data.message;
            document.getElementById('message').className = 'message error';
        } else {
            localStorage.setItem('token', data.jwt);
            localStorage.setItem('user', JSON.stringify(data.user));

            const rol = data.user.rol;
            console.log("Rol recibido para redirección:", rol);

            switch (rol) {
                case 'doctor':
                    window.location.href = 'doctor.html';
                    break;
                case 'farmacia':
                    window.location.href = 'farmacia.html';
                    break;
                case 'recepcion':
                    window.location.href = 'recepcion.html';
                    break;
                case 'paciente':
                    window.location.href = 'paciente.html';
                    break;
                case 'admin':
                    window.location.href = 'admin.html';
                    break;
                default:
                    document.getElementById('message').textContent = 'Rol no reconocido';
                    document.getElementById('message').className = 'message error';
            }
        }
    })
    .catch(error => {
        console.error("Error en la solicitud o en el procesamiento:", error);
        document.getElementById('message').textContent = 'Error de conexión o en el proceso: ' + error.message;
        document.getElementById('message').className = 'message error';
    });
});