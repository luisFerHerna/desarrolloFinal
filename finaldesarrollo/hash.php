<?php
// Contraseña que quieres hashear.
// ¡CAMBIA 'password' por la contraseña real que quieres usar para tu usuario de farmacia!
$contrasena_a_hashear = 'password'; 

// Genera el hash de la contraseña.
// PASSWORD_DEFAULT usa el algoritmo de hash más fuerte disponible (actualmente bcrypt)
// y se actualizará automáticamente en futuras versiones de PHP si hay un algoritmo mejor.
$hash_generado = password_hash($contrasena_a_hashear, PASSWORD_DEFAULT);

echo "El hash para la contraseña '{$contrasena_a_hashear}' es: <br>";
echo "<strong>" . $hash_generado . "</strong>";
echo "<br><br>Copia este hash completo y pégalo en el campo 'password' de tu tabla 'usuarios' para el usuario de farmacia.";
?>