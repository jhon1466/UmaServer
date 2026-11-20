<div align="center">

<img src="server/admin_ui/static/icon.png" alt="UmaServer" width="140" />

# UmaServer

**Servidor privado de Umamusume: Pretty Derby con panel de administración UmaPS**

[![Release](https://img.shields.io/github/v/release/jhon1466/UmaServer?style=plastic&color=ec4899&label=release)](https://github.com/jhon1466/UmaServer/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/jhon1466/UmaServer/total?style=plastic&color=f59e0b)](https://github.com/jhon1466/UmaServer/releases)
[![Last commit](https://img.shields.io/github/last-commit/jhon1466/UmaServer?style=plastic&color=f59e0b)](https://github.com/jhon1466/UmaServer/commits)

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=plastic&logo=python&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?style=plastic&logo=tauri&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-10%20%7C%2011-0078D4?style=plastic)
![Steam](https://img.shields.io/badge/Steam-Global%20%7C%20JP-1b2838?style=plastic&logo=steam&logoColor=white)

<a href="https://github.com/jhon1466/UmaServer/releases/latest"><img src="https://img.shields.io/badge/Descargar%20UmaPS-ec4899?style=plastic&logo=github&logoColor=white" alt="Descargar UmaPS" /></a>

Servidor Global (8443) · Servidor JP (8444)

</div>

---

Servidor privado de Umamusume: Pretty Derby para Windows, con administración de cuentas, personajes, cartas, carreras y partidas desde UmaPS Admin.

---

## Requisitos

- Windows 10 u 11 y Umamusume: Pretty Derby instalado en Steam y ejecutado al menos una vez.
- Python 3.11 o superior y conexión a Internet. La aplicación prepara las dependencias y los motores que necesita.

---

## Inicio

1. Descarga **UmaPS.exe** desde Releases y ábrelo.
2. En **Servidor y juego**, selecciona la región y pulsa **Instalar y arrancar**. La primera ejecución descarga el servidor, instala sus dependencias y configura el acceso al juego.
3. Abre **Panel de administración** para gestionar tu cuenta. Las ventanas se pueden abrir, mover y maximizar desde el menú lateral.
4. Inicia el juego desde Steam o mediante el botón **Jugar Umamusume** de la aplicación.

El servidor Global usa el puerto HTTPS 8443 y el JP el 8444. La aplicación guarda los archivos del servidor y su configuración en la carpeta local de UmaServer.

---

## Compilar la aplicación

En la carpeta `umaps-app`, ejecuta `npm ci` y después `npm run tauri:build`. El ejecutable se genera en `src-tauri/target/release/umaps-app.exe`.
