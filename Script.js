const URL_API = "https://api.jolpi.ca/ergast/f1/current/driverstandings.json";
const COLOR_POR_DEFECTO = "#E10600";

const COLORES = {
  red_bull: "#3671C6",
  ferrari: "#E8002D",
  mercedes: "#27F4D2",
  mclaren: "#FF8000",
  aston_martin: "#229971",
  alpine: "#FF87BC",
  williams: "#64C4FF",
  rb: "#6692FF",
  haas: "#B6BABD",
  sauber: "#52E252",
  audi: "#F50537",
  cadillac: "#C0C0C0"
};

let pilotos = [];
let equipos = new Map();   

function colorDeEquipo(id) {
  if (id && !COLORES[id]) console.log("Equipo sin color definido:", id);
  return COLORES[id] || COLOR_POR_DEFECTO;
}


async function cargarPilotos() {
  const estado = document.getElementById("estado");
  try {
    const respuesta = await fetch(URL_API);
    if (!respuesta.ok) throw new Error("Error HTTP " + respuesta.status);
    const datos = await respuesta.json();
    const tabla = datos.MRData.StandingsTable;
    pilotos = tabla.StandingsLists[0].DriverStandings;
    document.getElementById("temporada").textContent = "Temporada " + tabla.season;

    armarEquipos();
    estado.textContent = "";
    llenarFiltro();
    mostrarPrincipal();
  } catch (error) {
    estado.textContent = "No se pudieron cargar los datos. Revisa tu conexión y recarga la página.";
    console.error(error);
  }
}


function armarEquipos() {
  equipos = new Map();
  pilotos.forEach(p => {
    const c = p.Constructors[0];
    if (!equipos.has(c.constructorId)) {
      equipos.set(c.constructorId, { id: c.constructorId, nombre: c.name, puntos: 0, pilotos: [] });
    }
    const e = equipos.get(c.constructorId);
    e.puntos += Number(p.points);
    e.pilotos.push(p);
  });
}


function equiposPorPuntos() {
  return [...equipos.values()].sort((a, b) => b.puntos - a.puntos);
}


function crearBoton(texto, id) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "btn btn-outline-light";
  boton.textContent = texto;
  boton.dataset.id = id;
  boton.addEventListener("click", () => elegirEquipo(id));
  return boton;
}

function llenarFiltro() {
  const contenedor = document.getElementById("filtro");
  contenedor.innerHTML = "";
  contenedor.appendChild(crearBoton("Inicio", ""));
  [...equipos.values()]
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .forEach(e => contenedor.appendChild(crearBoton(e.nombre, e.id)));
  marcarActivo("");
}

function marcarActivo(id) {
  document.querySelectorAll("#filtro .btn").forEach(b => {
    b.classList.toggle("activo", b.dataset.id === id);
  });
}


function elegirEquipo(id) {
  cambiarFondo(id);
  marcarActivo(id);
  document.documentElement.style.setProperty("--acento", id ? colorDeEquipo(id) : COLOR_POR_DEFECTO);
  if (id) mostrarEscuderia(id);
  else mostrarPrincipal();
  window.scrollTo({ top: 0 });
}


function limpiarLista() {
  detenerAudio();
  const contenedor = document.getElementById("lista");
  contenedor.innerHTML = "";
  contenedor.style.animation = "none";
  contenedor.offsetHeight;
  contenedor.style.animation = "";
  return contenedor;
}


function mostrarPrincipal() {
  const cont = limpiarLista();
  const orden = [1, 0, 2];
  const top3 = orden.map(i => pilotos[i]).filter(Boolean);

  const podio = top3.map(p => `
    <div class="puesto p${p.position}" style="--acento:${colorDeEquipo(p.Constructors[0].constructorId)}">
      <div class="num">${p.position}</div>
      <p class="nombre">${p.Driver.givenName} <strong>${p.Driver.familyName}</strong></p>
      <p class="equipo">${p.Constructors[0].name}</p>
      <p class="pts">${p.points} pts</p>
    </div>`).join("");

  const tarjetasEquipo = equiposPorPuntos().map((e, i) => `
    <button type="button" class="equipo-card" data-id="${e.id}" style="--acento:${colorDeEquipo(e.id)}">
      <strong>${e.nombre}</strong>
      <span>${i + 1}.º · ${e.puntos} pts</span>
    </button>`).join("");

  const filas = pilotos.map(p => `
    <tr>
      <td>${p.position}</td>
      <td>${p.Driver.givenName} ${p.Driver.familyName}</td>
      <td>${p.Constructors[0].name}</td>
      <td class="text-end">${p.points}</td>
    </tr>`).join("");

  cont.innerHTML = `
    <h2 class="titulo">Podio del campeonato</h2>
    <div class="podio">${podio}</div>

    <h2 class="titulo">Escuderías</h2>
    <div class="equipos">${tarjetasEquipo}</div>

    <details>
      <summary>Clasificación completa</summary>
      <table class="table table-dark table-sm tabla">
        <thead><tr><th>#</th><th>Piloto</th><th>Equipo</th><th class="text-end">Pts</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </details>`;

  cont.querySelectorAll(".equipo-card").forEach(b =>
    b.addEventListener("click", () => elegirEquipo(b.dataset.id)));
}


function mostrarEscuderia(id) {
  const cont = limpiarLista();
  const e = equipos.get(id);
  const lugar = equiposPorPuntos().findIndex(x => x.id === id) + 1;

  cont.innerHTML = `
    <div class="cabecera-equipo">
      <h2>${e.nombre}</h2>
      <p>${lugar}.º en constructores · ${e.puntos} puntos</p>
    </div>
    <div class="pilotos"></div>`;

  const caja = cont.querySelector(".pilotos");
  e.pilotos.forEach(p => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "piloto";
    tarjeta.innerHTML = `
      <span class="pos">${p.position}</span>
      <h3>${p.Driver.givenName} ${p.Driver.familyName}</h3>
      <p>${p.points} pts · ${p.wins} victorias</p>
      <p>${p.Driver.nationality}</p>
      <button class="radio" type="button">Radio check</button>`;
    const boton = tarjeta.querySelector(".radio");
    boton.addEventListener("click", () => alternarAudio(p.Driver.code, boton));
    caja.appendChild(tarjeta);
  });
}


const CARPETA_AUDIO = "audio/";
const AUDIO_RESPALDO = CARPETA_AUDIO + "radio-check.mp3";   

let audioActual = null;
let botonActual = null;

function alternarAudio(codigo, boton) {
  if (audioActual && botonActual === boton) {
    detenerAudio();
    return;
  }
  detenerAudio();
  reproducir(CARPETA_AUDIO + codigo + ".mp3", boton, true);
}

function reproducir(ruta, boton, permitirRespaldo) {
  const audio = new Audio(ruta);
  audioActual = audio;
  botonActual = boton;
  boton.textContent = "Detener";
  boton.classList.add("sonando");

  audio.addEventListener("ended", detenerAudio);
  audio.addEventListener("error", () => {
    if (audioActual !== audio) return;
    if (permitirRespaldo) {
      reproducir(AUDIO_RESPALDO, boton, false);
    } else {
      detenerAudio();
      boton.textContent = "Sin audio";
    }
  });
  audio.play().catch(error => console.warn("No se pudo reproducir:", error.message));
}

function detenerAudio() {
  if (audioActual) audioActual.pause();
  if (botonActual) {
    botonActual.textContent = "Radio check";
    botonActual.classList.remove("sonando");
  }
  audioActual = null;
  botonActual = null;
}


const capas = [document.getElementById("fondoA"), document.getElementById("fondoB")];
let capaActiva = -1;   

function cambiarFondo(id) {
  const ruta = "Fondos/" + (id || "main") + ".jpg";
  const img = new Image();
  img.onload = () => {
    const entrante = capas[capaActiva === 0 ? 1 : 0];
    const saliente = capas[capaActiva];          
    entrante.style.backgroundImage = `url("${ruta}")`;
    entrante.classList.add("activa");
    if (saliente) saliente.classList.remove("activa");
    capaActiva = capaActiva === 0 ? 1 : 0;
  };
  img.onerror = () => console.warn("No se encontró", ruta);
  img.src = ruta;   
}

cambiarFondo("");
cargarPilotos();
