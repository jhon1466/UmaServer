// Internationalization module for UmaPS Admin Panel
// Full Spanish (es) & English (en) support with automatic DOM translation

import { prefs, store } from "./core.js";

export const DICT_ES = {
  "Users": "Usuarios",
  "Raw save": "Partida / Datos",
  "Support cards": "Cartas de soporte",
  "Custom Support Cards": "Cartas personalizadas",
  "Custom support cards": "Cartas personalizadas",
  "Custom support studio": "Taller de soporte personalizado",
  "Umas": "Umas (Personajes)",
  "Veterans": "Veteranas",
  "Career": "Modo Carrera",
  "Tuning": "Ajustes de servidor",
  "Races": "Carreras",
  "Items": "Objetos",
  "More": "Más herramientas",
  "History": "Historial",
  "Errors": "Errores",
  "Race workshop": "Taller de carreras",
  "Maximize": "Maximizar",
  "Close (Esc)": "Cerrar (Esc)",
  "Pick something from the sidebar · Alt+1–9": "Selecciona una opción del menú lateral · Alt+1–9",
  "Connected": "Conectado al servidor",
  "Lost the admin panel server": "Conexión perdida con el servidor",
  "Default account": "Cuenta predeterminada",
  "Account to edit": "Cuenta a editar",
  "Search…": "Buscar…",
  "Search": "Buscar",
  "Cancel": "Cancelar",
  "OK": "Aceptar",
  "Save": "Guardar",
  "Delete": "Eliminar",
  "Create": "Crear",
  "Import": "Importar",
  "Export": "Exportar",
  "Copy": "Copiar",
  "Reload": "Recargar",
  "Discard": "Descartar",
  "Reset": "Restablecer",
  "Edit": "Editar",
  "All": "Todos",
  "Any": "Cualquiera",
  "None": "Ninguno",
  "Loading…": "Cargando…",
  "Sort": "Ordenar",
  "Clear": "Limpiar",
  "Clear all": "Limpiar todo",
  "Remove": "Quitar",
  "Remove all": "Quitar todo",
  "Unlock": "Desbloquear",
  "Unlock all": "Desbloquear todo",
  "Max all": "Maximizar todo",
  "Set all": "Establecer todo",
  "Set owned": "Establecer poseídos",
  "Fill field": "Llenar grupo",
  "Fill to max": "Llenar al máximo",
  "Give all": "Entregar todo",
  "Tick all": "Marcar todo",
  "Untick all": "Desmarcar todo",
  "Done": "Listo",
  "Close": "Cerrar",
  "Dismiss": "Descartar",
  "Try again": "Reintentar",
  "Review": "Revisar",
  "Resume": "Reanudar",
  "Drop": "Descartar",
  "Duplicate": "Duplicar",
  "Clone": "Clonar",
  "Undo": "Deshacer",
  "Roll": "Girar",
  "Go": "Ir",
  "Pick": "Elegir",
  "Lock": "Bloquear",
  "Lock all": "Bloquear todo",
  "Uncap": "Desbloquear nivel",
  "Active": "Activo",
  "Options": "Opciones",
  "Results": "Resultados",
  "Standings": "Clasificación",
  "Winner": "Ganadora",
  "Wins": "Victorias",
  "State": "Estado",
  "Time": "Tiempo",
  "Created": "Creado",
  "Description": "Descripción",
  "Danger zone": "Zona de peligro",
  "Deletion": "Eliminación",
  "Merge": "Combinar",
  "Last seen": "Última conexión",
  "Name": "Nombre",
  "Viewer id": "ID de jugador",
  "Carats": "Carats (Zanahorias)",
  "Save size": "Tamaño de partida",
  "New save…": "Nueva partida…",
  "Pick a user.": "Selecciona un usuario.",
  "No users.": "No hay usuarios.",
  "in career": "en carrera",
  "no login": "sin iniciar sesión",
  "never": "nunca",
  "just now": "ahora mismo",
  "min ago": "min atrás",
  "h ago": "h atrás",
  "d ago": "d atrás",
  "No keys.": "Sin claves.",
  "Filter keys": "Filtrar claves",
  "Name or viewer id": "Nombre o ID de jugador",
  "Free carats": "Carats gratuitos",
  "Paid carats": "Carats de pago",
  "Money": "Dinero (Mani)",
  "TP": "Puntos de Entrenamiento (TP)",
  "characters": "personajes",
  "Export save": "Exportar partida",
  "Exporting": "Exportando...",
  "Save profile": "Guardar perfil",
  "Saving profile": "Guardando perfil...",
  "Profile saved": "Perfil guardado con éxito",
  "Set password": "Establecer contraseña",
  "Setting password": "Estableciendo contraseña...",
  "Password set": "Contraseña establecida",
  "Reset password": "Restablecer contraseña",
  "Resetting password": "Restableciendo contraseña...",
  "Password reset: the next link login sets it": "Contraseña restablecida: se definirá en el próximo inicio de sesión",
  "Delete this account?": "¿Eliminar esta cuenta?",
  "Type the viewer id": "Escribe el ID de jugador",
  "to confirm.": "para confirmar.",
  "Account deleted": "Cuenta eliminada",
  "Deleting": "Eliminando...",
  "Copy another viewer's save onto this one": "Copiar la partida de otro usuario sobre esta",
  "Source viewer id": "ID del jugador de origen",
  "Save copied": "Partida copiada con éxito",
  "Copying save": "Copiando partida...",
  "Import save": "Importar partida",
  "Imported": "Importado con éxito",
  "Importing": "Importando...",
  "New Global save": "Nueva partida de Global",
  "New JP save": "Nueva partida de JP",
  "Creates an empty save; the server seeds the rest on that viewer's first login.": "Crea una partida vacía; el servidor inicializa los datos en el primer inicio de sesión.",
  "Save created": "Partida creada",
  "Creating save": "Creando partida...",
  "Trainer": "Entrenador",
  "Trainer name": "Nombre del entrenador",
  "Leader uma": "Uma líder",
  "Comment": "Comentario",
  "Honor": "Título de honor",
  "Honor / Title": "Título de honor",
  "Link password": "Contraseña de enlace",
  "New link password": "Nueva contraseña de enlace",
  "The next link login with any password sets the new one": "El próximo inicio de sesión con cualquier contraseña establecerá la nueva",
  "Clear unclaimed": "Limpiar no reclamados",
  "Clear the whole present box?": "¿Vaciar todo el buzón de regalos?",
  "Send a present": "Enviar un regalo",
  "Both 999,999,999": "Ambos 999,999,999",
  "Filter umas": "Filtrar Umas",
  "Filter Umas": "Filtrar Umas",
  "Add uma…": "Añadir Uma…",
  "Add Uma…": "Añadir Uma…",
  "Max all umas": "Maximizar todas las Umas",
  "Max all Umas": "Maximizar todas las Umas",
  "Unlock all umas": "Desbloquear todas las Umas",
  "Unlock all Umas": "Desbloquear todas las Umas",
  "Add the selected umas you don": "Añadir las umas seleccionadas que no tengas",
  "Change uma or outfit": "Cambiar uma o vestimenta",
  "Rarity": "Rareza",
  "Base rarity": "Rareza base",
  "Stars": "Estrellas",
  "Awakening": "Despertar",
  "Awakening:": "Despertar:",
  "Potential": "Potencial",
  "Potential (awakening)": "Potencial (Despertar)",
  "Talent level": "Nivel de talento",
  "Awaken level": "Nivel de despertar",
  "Pieces": "Piezas",
  "Piece": "Pieza",
  "Piece id": "ID de pieza",
  "Star pieces": "Piezas de estrellas",
  "Costumes": "Vestimentas",
  "Dress": "Traje",
  "Epithet": "Epíteto / Apodo",
  "Bond": "Vínculo",
  "Bond (love point)": "Puntos de afecto",
  "Aptitudes": "Aptitudes",
  "Fans": "Seguidores",
  "Fans:": "Seguidores:",
  "Rating": "Puntuación",
  "Rating score": "Puntuación de rango",
  "Rank": "Rango",
  "Rank from rating score": "Rango según puntuación",
  "Re-rank": "Recalcular rango",
  "Turf": "Césped",
  "Dirt": "Tierra",
  "Sprint": "Corta",
  "Mile": "Milla",
  "Medium": "Media",
  "Long": "Larga",
  "Front": "Líder (Nige)",
  "Pace": "Perseguidor (Senko)",
  "Late": "Desde atrás (Sashi)",
  "End": "Rematador (Oikomi)",
  "Awful": "Pésimo",
  "Bad": "Malo",
  "Normal": "Normal",
  "Good": "Bueno",
  "Great": "Excelente",
  "Speed": "Velocidad",
  "Stamina": "Resistencia",
  "Power": "Fuerza",
  "Guts": "Agallas",
  "Wit": "Inteligencia",
  "Friend": "Amigo",
  "Group": "Grupo",
  "Filter cards": "Filtrar cartas",
  "Add card…": "Añadir carta…",
  "Add a borrowable friend card": "Añadir carta de amigo prestable",
  "Max all cards": "Maximizar todas las cartas",
  "Unlock all cards": "Desbloquear todas las cartas",
  "Add the selected cards you don": "Añadir las cartas seleccionadas que no tengas",
  "Limit break": "Límite roto (MLB)",
  "Level": "Nivel",
  "EXP": "Experiencia",
  "Favorite": "Favorito",
  "Favourite": "Favorito",
  "Favourites": "Favoritos",
  "Card identity": "Identidad de la carta",
  "Card title": "Título de la carta",
  "Unique effect": "Efecto único",
  "Training type": "Tipo de entrenamiento",
  "Training bonuses": "Bonificaciones de entrenamiento",
  "Artwork": "Ilustración",
  "Collection icon": "Icono de colección",
  "Training thumbnail": "Miniatura de entrenamiento",
  "Copies": "Copias",
  "Spare copies": "Copias adicionales",
  "Your custom cards": "Tus cartas personalizadas",
  "New card": "Nueva carta",
  "Delete slot": "Eliminar ranura",
  "Abandon this career?": "¿Abandonar esta carrera actual?",
  "Complete this career?": "¿Completar esta carrera?",
  "Park this career": "Pausar esta carrera",
  "Park…": "Pausar…",
  "In career": "En carrera activa",
  "Not in career": "No está en carrera",
  "Turn": "Turno",
  "Scenario": "Escenario",
  "Career tuning": "Ajustes de carrera",
  "Stats": "Estadísticas",
  "Energy": "Energía",
  "Mood": "Ánimo",
  "Mood:": "Ánimo:",
  "Skill points": "Puntos de habilidad",
  "Skills": "Habilidades",
  "Active skills": "Habilidades activas",
  "Add skills": "Añadir habilidades",
  "Hint skills": "Habilidades con pista",
  "Hints": "Pistas",
  "Hint level": "Nivel de pista",
  "Stat hints": "Pistas de estadísticas",
  "Queue an event": "Poner evento en cola",
  "Events": "Eventos",
  "Choices": "Elecciones",
  "Set turn": "Establecer turno",
  "All 100": "Todos 100",
  "All 1200": "Todos 1200",
  "All 9999": "Todos 9999",
  "All A": "Todos A",
  "All S": "Todos S",
  "9999 stats, S aptitudes, max rank, every skill": "Estadísticas 9999, aptitudes S, rango máximo y todas las habilidades",
  "Add race": "Añadir carrera",
  "Delete race?": "¿Eliminar carrera?",
  "Course": "Circuito",
  "Course map": "Mapa del circuito",
  "Race name": "Nombre de la carrera",
  "Race phase": "Fase de la carrera",
  "Race setup": "Configuración de la carrera",
  "Race style": "Estilo de carrera",
  "Running style": "Estilo de carrera",
  "Preferred running style": "Estilo de carrera preferido",
  "Field": "Grupo de corredoras",
  "Field size": "Cantidad de corredoras",
  "Elevation": "Elevación",
  "Distance": "Distancia",
  "Surface": "Superficie",
  "Gate": "Puerta de salida",
  "Lane": "Carril",
  "Slope": "Pendiente",
  "Uphill": "Cuesta arriba",
  "Downhill": "Cuesta abajo",
  "Corner": "Curva",
  "Start delay": "Retraso de salida",
  "Spurt start": "Inicio de aceleración (Spurt)",
  "Top speed m/s": "Velocidad punta (m/s)",
  "HP left": "HP restante",
  "HP at finish": "HP en meta",
  "Margin": "Distancia",
  "Skills fired": "Habilidades activadas",
  "Skill call-outs on the map": "Indicadores de habilidad en mapa",
  "Show where each skill can activate": "Mostrar zonas de activación de habilidades",
  "Click a runner to analyse it": "Haz clic en una corredora para analizarla",
  "Next runner": "Siguiente corredora",
  "Previous runner": "Corredora anterior",
  "Selected runner only": "Solo la corredora seleccionada",
  "Import racer": "Importar corredora",
  "Import veteran": "Importar veterana",
  "Re-simulate": "Resimular",
  "Play / pause (Space)": "Reproducir / pausar (Espacio)",
  "Restart (Home)": "Reiniciar (Inicio)",
  "Practice race slot": "Ranura de carrera de práctica",
  "Send to game": "Enviar al juego",
  "Next practice race": "Siguiente carrera de práctica",
  "No races yet": "Aún no hay carreras guardadas",
  "No runners yet": "Aún no hay corredoras",
  "Winner reaches the goal": "La ganadora cruza la meta",
  "Item name or id": "Nombre o ID del objeto",
  "Amount": "Cantidad",
  "Gacha tickets": "Boletos de Gacha",
  "Consumables": "Consumibles",
  "Grant all titles": "Desbloquear todos los títulos",
  "Unlock every released song": "Desbloquear todas las canciones publicadas",
  "Raise every item shown in this group to at least this many": "Aumentar cada objeto mostrado a mínimo esta cantidad",
  "Set every owned item in this group to this many": "Establecer cada objeto poseído en esta cantidad",
  "Discard unsaved edits?": "¿Descartar cambios no guardados?",
  "Load it into the editor anyway": "Cargar en el editor de todos modos",
  "New state key": "Nueva clave de estado",
  "Apply JSON": "Aplicar JSON",
  "Use this JSON": "Usar este JSON",
  "All settings (JSON)": "Todas las configuraciones (JSON)",
  "Advanced runner data (JSON)": "Datos avanzados de corredora (JSON)",
  "Undo over later changes?": "¿Deshacer sobre cambios posteriores?",
  "Operations": "Operaciones",
  "No history": "Sin historial",
  "Server knobs": "Parámetros del servidor",
  "Failure rate": "Tasa de fallos",
  "Training gain": "Ganancia de entrenamiento"
};

export function getLang() {
  return prefs.get("uiLang", "es");
}

export function setLang(lang) {
  prefs.set("uiLang", lang);
  location.reload();
}

export function t(text) {
  if (!text || typeof text !== "string") return text;
  if (getLang() !== "es") return text;
  const trimmed = text.trim();
  if (DICT_ES[trimmed]) {
    return text.replace(trimmed, DICT_ES[trimmed]);
  }
  return text;
}

function translateNode(node) {
  if (!node) return;
  if (node.nodeType === Node.TEXT_NODE) {
    const val = node.nodeValue;
    if (val && val.trim().length > 0) {
      const trimmed = val.trim();
      if (DICT_ES[trimmed]) {
        node.nodeValue = val.replace(trimmed, DICT_ES[trimmed]);
      } else {
        // Handle common dynamic patterns like "X of Y · Region"
        let mod = val;
        mod = mod.replace(/\bof\b/g, "de")
                 .replace(/\bkeys\b/g, "claves")
                 .replace(/\bcharacters\b/g, "personajes")
                 .replace(/\bin career\b/g, "en carrera")
                 .replace(/\bno login\b/g, "sin inicio de sesión")
                 .replace(/\bnever\b/g, "nunca")
                 .replace(/\bjust now\b/g, "ahora mismo")
                 .replace(/\bmin ago\b/g, "min atrás")
                 .replace(/\bh ago\b/g, "h atrás")
                 .replace(/\bd ago\b/g, "d atrás")
                 .replace(/\bLast seen\b/g, "Última conexión")
                 .replace(/\bViewer id\b/g, "ID jugador")
                 .replace(/\bSave size\b/g, "Tamaño partida");
        if (mod !== val) node.nodeValue = mod;
      }
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const tag = node.tagName.toUpperCase();
    if (tag === "SCRIPT" || tag === "STYLE") return;

    for (const attr of ["placeholder", "title", "aria-label"]) {
      const val = node.getAttribute(attr);
      if (val) {
        const trimmed = val.trim();
        if (DICT_ES[trimmed]) {
          node.setAttribute(attr, val.replace(trimmed, DICT_ES[trimmed]));
        }
      }
    }

    for (const child of node.childNodes) {
      translateNode(child);
    }
  }
}

export function initI18n() {
  if (getLang() !== "es") return;

  // Translate existing document
  translateNode(document.body);

  // Watch for dynamic DOM changes and translate them automatically
  let scheduled = false;
  const pendingNodes = new Set();

  function flush() {
    scheduled = false;
    for (const node of pendingNodes) {
      if (node.isConnected) translateNode(node);
    }
    pendingNodes.clear();
  }

  const observer = new MutationObserver((mutations) => {
    if (getLang() !== "es") return;
    for (const m of mutations) {
      if (m.type === "childList") {
        for (const added of m.addedNodes) {
          pendingNodes.add(added);
        }
      } else if (m.type === "characterData") {
        pendingNodes.add(m.target);
      } else if (m.type === "attributes") {
        pendingNodes.add(m.target);
      }
    }
    if (!scheduled && pendingNodes.size > 0) {
      scheduled = true;
      requestAnimationFrame(flush);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["placeholder", "title", "aria-label"]
  });
}
