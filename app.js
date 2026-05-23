// ============================================================
// CREMERIA FC — ESTADÍSTICAS
// app.js — Toda la lógica de la aplicación
// ============================================================

// ============ BASE DE DATOS (localStorage) ============

let db = {
  jugadores: [],
  partidos: [],
  goles: [],
};

function cargarDB() {
  const saved = localStorage.getItem("cremeria_db");
  if (saved) db = JSON.parse(saved);
}

function guardarDB() {
  localStorage.setItem("cremeria_db", JSON.stringify(db));
}

// ============ HELPERS ============

function formatFecha(f) {
  if (!f) return "—";
  const [y, m, d] = f.split("-");
  return `${d}/${m}/${y}`;
}

// "Gino De Gasperi" → "De Gasperi, Gino"
function apellidoPrimero(nombre) {
  const partes = nombre.trim().split(" ");
  if (partes.length === 1) return nombre;
  const primerNombre = partes[0];
  const apellido = partes.slice(1).join(" ");
  return `${apellido}, ${primerNombre}`;
}

function getApellido(nombre) {
  return (
    nombre.trim().split(" ").slice(1).join(" ").toLowerCase() ||
    nombre.toLowerCase()
  );
}

// Porcentaje de victorias
function getPct() {
  if (db.partidos.length === 0) return "—";
  const v = db.partidos.filter((p) => p.resultado === "Victoria").length;
  return Math.round((v / db.partidos.length) * 100) + "%";
}

// ============ NOTIFICACIÓN ============

function mostrarNotif(msg, tipo = "ok") {
  const n = document.getElementById("notif");
  n.textContent = msg;
  n.style.background = tipo === "error" ? "var(--rojo)" : "var(--verde)";
  n.classList.add("show");
  setTimeout(() => n.classList.remove("show"), 2800);
}

// ============ MODAL DE CONFIRMACIÓN ============

function confirmar(mensaje, callback) {
  const modal = document.getElementById("modal");
  document.getElementById("modal-mensaje").textContent = mensaje;
  modal.classList.add("show");

  document.getElementById("modal-si").onclick = () => {
    modal.classList.remove("show");
    callback();
  };
  document.getElementById("modal-no").onclick = () => {
    modal.classList.remove("show");
  };
}

// ============ MODAL EDITAR JUGADOR ============

function abrirEditar(id) {
  const j = db.jugadores.find((j) => j.id === id);
  if (!j) return;

  document.getElementById("edit-id").value = j.id;
  document.getElementById("edit-nombre").value = j.nombre;
  document.getElementById("edit-posicion").value = j.posicion;
  document.getElementById("edit-numero").value =
    j.numero === "—" ? "" : j.numero;

  document.getElementById("modal-editar").classList.add("show");
}

function cerrarEditar() {
  document.getElementById("modal-editar").classList.remove("show");
}

function guardarEdicion() {
  const id = parseInt(document.getElementById("edit-id").value);
  const nombre = document.getElementById("edit-nombre").value.trim();
  const posicion = document.getElementById("edit-posicion").value;
  const numero = document.getElementById("edit-numero").value;

  if (!nombre) {
    mostrarNotif("⚠️ Ingresá el nombre", "error");
    return;
  }

  const idx = db.jugadores.findIndex((j) => j.id === id);
  if (idx === -1) return;

  db.jugadores[idx] = {
    ...db.jugadores[idx],
    nombre,
    posicion,
    numero: numero || "—",
  };
  guardarDB();
  cerrarEditar();
  actualizarTodo();
  mostrarNotif("✅ Jugador actualizado");
}

// ============ JUGADORES ============

function agregarJugador() {
  const nombre = document.getElementById("jugador-nombre").value.trim();
  const posicion = document.getElementById("jugador-posicion").value;
  const numero = document.getElementById("jugador-numero").value;

  if (!nombre) {
    mostrarNotif("⚠️ Ingresá el nombre del jugador", "error");
    return;
  }

  // Validar duplicado
  const existe = db.jugadores.some(
    (j) => j.nombre.toLowerCase() === nombre.toLowerCase(),
  );
  if (existe) {
    mostrarNotif("⚠️ Ya existe un jugador con ese nombre", "error");
    return;
  }

  const jugador = { id: Date.now(), nombre, posicion, numero: numero || "—" };
  db.jugadores.push(jugador);
  guardarDB();

  document.getElementById("jugador-nombre").value = "";
  document.getElementById("jugador-numero").value = "";

  actualizarTodo();
  mostrarNotif("✅ Jugador agregado");
}

function eliminarJugador(id) {
  const j = db.jugadores.find((j) => j.id === id);
  confirmar(
    `¿Eliminar a ${apellidoPrimero(j.nombre)}? También se borrarán sus goles.`,
    () => {
      db.jugadores = db.jugadores.filter((j) => j.id !== id);
      db.goles = db.goles.filter(
        (g) => g.goleadorId !== id && g.asistenciaId !== id,
      );
      guardarDB();
      actualizarTodo();
      mostrarNotif("🗑️ Jugador eliminado");
    },
  );
}

// ============ PARTIDOS ============

function cargarPartido() {
  const rival = document.getElementById("partido-rival").value.trim();
  const fecha = document.getElementById("partido-fecha").value;
  const golesLocal =
    parseInt(document.getElementById("partido-goles-local").value) || 0;
  const golesRival =
    parseInt(document.getElementById("partido-goles-rival").value) || 0;
  const competencia = document.getElementById("partido-competencia").value;

  if (!rival) {
    mostrarNotif("⚠️ Ingresá el nombre del rival", "error");
    return;
  }
  if (!fecha) {
    mostrarNotif("⚠️ Ingresá la fecha", "error");
    return;
  }

  let resultado;
  if (golesLocal > golesRival) resultado = "Victoria";
  else if (golesLocal < golesRival) resultado = "Derrota";
  else resultado = "Empate";

  const partido = {
    id: Date.now(),
    rival,
    fecha,
    golesLocal,
    golesRival,
    resultado,
    competencia,
  };
  db.partidos.push(partido);
  db.partidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  guardarDB();

  document.getElementById("partido-rival").value = "";
  document.getElementById("partido-goles-local").value = "0";
  document.getElementById("partido-goles-rival").value = "0";

  actualizarTodo();
  mostrarNotif(`✅ vs ${rival} — ${resultado}`);
}

function eliminarPartido(id) {
  const p = db.partidos.find((p) => p.id === id);
  confirmar(
    `¿Eliminar el partido vs ${p.rival}? También se borrarán los goles de ese partido.`,
    () => {
      db.partidos = db.partidos.filter((p) => p.id !== id);
      db.goles = db.goles.filter((g) => g.partidoId !== id);
      guardarDB();
      actualizarTodo();
      mostrarNotif("🗑️ Partido eliminado");
    },
  );
}

// ============ FILTRO DE PARTIDOS ============

let filtroCompetencia = "Todos";

function toggleFiltroDropdown() {
  const menu = document.getElementById("filtro-menu");
  const arrow = document.getElementById("filtro-arrow");
  const abierto = menu.classList.toggle("open");
  arrow.textContent = abierto ? "▲" : "▼";
}

function setFiltro(comp) {
  filtroCompetencia = comp;
  // Cerrar dropdown
  const menu = document.getElementById("filtro-menu");
  const arrow = document.getElementById("filtro-arrow");
  if (menu) {
    menu.classList.remove("open");
    arrow.textContent = "▼";
  }
  actualizarPartidos();
}

// Cerrar dropdown al hacer click afuera
document.addEventListener("click", (e) => {
  if (!e.target.closest("#filtro-dropdown")) {
    const menu = document.getElementById("filtro-menu");
    const arrow = document.getElementById("filtro-arrow");
    if (menu) {
      menu.classList.remove("open");
      arrow.textContent = "▼";
    }
  }
});

// ============ GOLES ============

function registrarGol() {
  const partidoId =
    parseInt(document.getElementById("evento-partido").value) || null;
  const goleadorId =
    parseInt(document.getElementById("evento-goleador").value) || null;
  const asistenciaId =
    parseInt(document.getElementById("evento-asistencia").value) || null;
  const minuto =
    parseInt(document.getElementById("evento-minuto").value) || null;

  if (!partidoId) {
    mostrarNotif("⚠️ Seleccioná un partido", "error");
    return;
  }
  if (!goleadorId) {
    mostrarNotif("⚠️ Seleccioná el goleador", "error");
    return;
  }
  if (goleadorId === asistenciaId) {
    mostrarNotif(
      "⚠️ El goleador y el asistidor no pueden ser el mismo",
      "error",
    );
    return;
  }

  const gol = { id: Date.now(), partidoId, goleadorId, asistenciaId, minuto };
  db.goles.push(gol);
  guardarDB();

  document.getElementById("evento-minuto").value = "";
  actualizarTodo();

  const goleador = db.jugadores.find((j) => j.id === goleadorId);
  mostrarNotif(`⚽ Gol de ${apellidoPrimero(goleador?.nombre || "jugador")}!`);
}

// ============ ACTUALIZAR TODA LA UI ============

function actualizarTodo() {
  actualizarStatsBar();
  actualizarSelects();
  actualizarPlantel();
  actualizarPartidos();
  actualizarGoleadores();
}

function actualizarStatsBar() {
  const victorias = db.partidos.filter(
    (p) => p.resultado === "Victoria",
  ).length;
  const empates = db.partidos.filter((p) => p.resultado === "Empate").length;
  const derrotas = db.partidos.filter((p) => p.resultado === "Derrota").length;
  const goles = db.partidos.reduce((acc, p) => acc + p.golesLocal, 0);

  document.getElementById("total-partidos").textContent = db.partidos.length;
  document.getElementById("total-victorias").textContent = victorias;
  document.getElementById("total-empates").textContent = empates;
  document.getElementById("total-derrotas").textContent = derrotas;
  document.getElementById("total-goles").textContent = goles;
  document.getElementById("total-jugadores").textContent = db.jugadores.length;
  document.getElementById("total-pct").textContent = getPct();
}

function actualizarSelects() {
  const selPartido = document.getElementById("evento-partido");
  const selGoleador = document.getElementById("evento-goleador");
  const selAsistencia = document.getElementById("evento-asistencia");

  selPartido.innerHTML = '<option value="">— Seleccioná un partido —</option>';
  db.partidos.forEach((p) => {
    selPartido.innerHTML += `<option value="${p.id}">vs ${p.rival} (${formatFecha(p.fecha)})</option>`;
  });

  [selGoleador, selAsistencia].forEach((sel, i) => {
    sel.innerHTML = `<option value="">${i === 1 ? "— Sin asistencia —" : "— Jugador —"}</option>`;
    db.jugadores.forEach((j) => {
      sel.innerHTML += `<option value="${j.id}">${apellidoPrimero(j.nombre)}</option>`;
    });
  });
}

function actualizarPlantel() {
  const container = document.getElementById("tabla-plantel-container");

  if (db.jugadores.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><span>👤</span>Aún no hay jugadores registrados</div>';
    return;
  }

  const golesXJugador = {};
  const asistXJugador = {};
  db.goles.forEach((g) => {
    const gid = String(g.goleadorId);
    golesXJugador[gid] = (golesXJugador[gid] || 0) + 1;
    if (g.asistenciaId) {
      const aid = String(g.asistenciaId);
      asistXJugador[aid] = (asistXJugador[aid] || 0) + 1;
    }
  });

  const ordenPosicion = {
    Portero: 1,
    Defensa: 2,
    Mediocampista: 3,
    Delantero: 4,
  };

  const jugadoresOrdenados = [...db.jugadores].sort((a, b) => {
    const porPosicion =
      (ordenPosicion[a.posicion] || 9) - (ordenPosicion[b.posicion] || 9);
    if (porPosicion !== 0) return porPosicion;
    return getApellido(a.nombre).localeCompare(getApellido(b.nombre), "es");
  });

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Jugador</th>
          <th>Posición</th>
          <th>Goles</th>
          <th>Asistencias</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${jugadoresOrdenados
          .map(
            (j) => `
          <tr>
            <td style="color:var(--gris-medio);font-weight:700">${j.numero}</td>
            <td style="font-weight:600">${apellidoPrimero(j.nombre)}</td>
            <td style="color:var(--gris-medio)">${j.posicion}</td>
            <td><span style="color:var(--verde-claro);font-weight:700">${golesXJugador[String(j.id)] || 0}</span></td>
            <td><span style="color:var(--amarillo);font-weight:700">${asistXJugador[String(j.id)] || 0}</span></td>
            <td style="display:flex;gap:6px">
              <button class="btn btn-sm" onclick="abrirEditar(${j.id})">Editar</button>
              <button class="btn btn-danger btn-sm" onclick="eliminarJugador(${j.id})">Eliminar</button>
            </td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>`;
}

function actualizarPartidos() {
  const container = document.getElementById("tabla-partidos-container");

  const partidos =
    filtroCompetencia === "Todos"
      ? db.partidos
      : db.partidos.filter((p) => p.competencia === filtroCompetencia);

  // Dropdown de filtro
  const competencias = [
    "Todos",
    ...new Set(db.partidos.map((p) => p.competencia)),
  ];
  document.getElementById("filtros-competencia").innerHTML = `
    <div class="filtro-dropdown" id="filtro-dropdown">
      <button class="filtro-main-btn" onclick="toggleFiltroDropdown()">
        ${filtroCompetencia} <span class="filtro-arrow" id="filtro-arrow">▼</span>
      </button>
      <div class="filtro-menu" id="filtro-menu">
        ${competencias
          .map(
            (c) => `
          <button class="filtro-opcion ${filtroCompetencia === c ? "active" : ""}" onclick="setFiltro('${c}')">
            ${c}
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `;

  if (partidos.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><span>📋</span>No hay partidos para mostrar</div>';
    return;
  }

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Rival</th>
          <th>Resultado</th>
          <th>Competencia</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${partidos
          .map((p) => {
            const badgeClass =
              p.resultado === "Victoria"
                ? "badge-win"
                : p.resultado === "Derrota"
                  ? "badge-loss"
                  : "badge-draw";
            const emoji =
              p.resultado === "Victoria"
                ? "🏆"
                : p.resultado === "Derrota"
                  ? "😞"
                  : "🤝";
            return `
          <tr>
            <td style="color:var(--gris-medio)">${formatFecha(p.fecha)}</td>
            <td style="font-weight:600">vs ${p.rival}</td>
            <td style="font-family:'Bebas Neue',cursive;font-size:18px;letter-spacing:1px">
              ${p.golesLocal} — ${p.golesRival}
            </td>
            <td style="color:var(--gris-medio);font-size:13px">${p.competencia}</td>
            <td><span class="badge ${badgeClass}">${emoji} ${p.resultado}</span></td>
            <td><button class="btn btn-danger btn-sm" onclick="eliminarPartido(${p.id})">Eliminar</button></td>
          </tr>`;
          })
          .join("")}
      </tbody>
    </table>`;
}

function actualizarGoleadores() {
  const container = document.getElementById("tabla-goleadores");

  const golesXJugador = {};
  const asistXJugador = {};
  db.goles.forEach((g) => {
    const gid = String(g.goleadorId);
    golesXJugador[gid] = (golesXJugador[gid] || 0) + 1;
    if (g.asistenciaId) {
      const aid = String(g.asistenciaId);
      asistXJugador[aid] = (asistXJugador[aid] || 0) + 1;
    }
  });

  const ranking = db.jugadores
    .map((j) => ({
      ...j,
      goles: golesXJugador[String(j.id)] || 0,
      asistencias: asistXJugador[String(j.id)] || 0,
    }))
    .filter((j) => j.goles > 0)
    .sort((a, b) => b.goles - a.goles);

  if (ranking.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><span>⚽</span>Aún no hay goles registrados</div>';
    return;
  }

  container.innerHTML = ranking
    .map(
      (j, i) => `
    <div class="goleador-row">
      <div class="goleador-rank ${i === 0 ? "top" : ""}">${i + 1}</div>
      <div class="goleador-info">
        <div class="goleador-nombre">${apellidoPrimero(j.nombre)}</div>
        <div class="goleador-sub">${j.posicion} · ${j.asistencias} asist.</div>
      </div>
      <div class="goleador-goles">${j.goles}</div>
    </div>
  `,
    )
    .join("");
}

// ============ INICIO ============

cargarDB();
document.getElementById("partido-fecha").valueAsDate = new Date();
actualizarTodo();
