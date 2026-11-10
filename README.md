# UmaServer

Servidor privado de Umamusume: Pretty Derby para Windows, con administración de cuentas, personajes, cartas, carreras y partidas desde UmaPS Admin.

## Requisitos

- Windows 10 u 11 y Umamusume: Pretty Derby instalado en Steam y ejecutado al menos una vez.
- Python 3.11 o superior y conexión a Internet. La aplicación prepara las dependencias y los motores que necesita.

## Inicio

1. Descarga **UmaPS.exe** desde Releases y ábrelo.
2. En **Servidor y juego**, selecciona la región y pulsa **Instalar y arrancar**. La primera ejecución descarga el servidor, instala sus dependencias y configura el acceso al juego.
3. Abre **Panel de administración** para gestionar tu cuenta. Las ventanas se pueden abrir, mover y maximizar desde el menú lateral.
4. Inicia el juego desde Steam o mediante el botón **Jugar Umamusume** de la aplicación.

El servidor Global usa el puerto HTTPS 8443 y el JP el 8444. La aplicación guarda los archivos del servidor y su configuración en la carpeta local de UmaServer.

## Compilar la aplicación

En la carpeta `umaps-app`, ejecuta `npm ci` y después `npm run tauri:build`. El ejecutable se genera en `src-tauri/target/release/umaps-app.exe`.
