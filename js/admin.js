/* =====================================================================
   ADMINISTRACIÓN · el instructor edita todo el contenido del curso
   desde la plataforma. Se trabaja sobre un borrador y se guarda con
   «Guardar cambios».
   ===================================================================== */
(function () {
  const U = window.UI;
  const { icon, esc, $, $$, toast, confirmDialog, modal } = U;
  const B = window.Backend, TM = window.TIPOS_MATERIAL;
  let draft = null, dirty = false, editing = false;

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const get = (o, path) => path.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  const set = (o, path, val) => { const ks = path.split("."); const last = ks.pop(); const t = ks.reduce((a, k) => (a[k] == null ? (a[k] = /^\d+$/.test(k) ? [] : {}) : a[k]), o); t[last] = val; };
  const ensure = () => { if (!draft) { draft = clone(B.course); draft.raps.forEach((r) => { if (!r.actividades) r.actividades = []; if (!r.evidencia) r.evidencia = {}; if (r.evidencia.formulario == null) r.evidencia.formulario = ""; if (r.evidencia.respuestas == null) r.evidencia.respuestas = ""; }); if (!draft.info.actividadesActivas) draft.info.actividadesActivas = "no"; if (!draft.info.registroAbierto) draft.info.registroAbierto = "no"; if (!draft.info.intensidad) draft.info.intensidad = "suave"; draft.info.colores = Object.assign({ sesion: "#3B82F6", material: "#22C55E", videos: "#A855F7", enlaces: "#14B8A6", evidencia: "#F59E0B" }, draft.info.colores || {}); if (!Array.isArray(draft.info.admins)) draft.info.admins = []; draft.raps.forEach((r) => { if (r.sesion && r.sesion.datos == null) r.sesion.datos = ""; }); } };
  const markDirty = () => { dirty = true; const st = $("#savest"); if (st) st.textContent = "Cambios sin guardar"; };

  /* ---------- constructores de formulario ---------- */
  const f = (label, path, opts = {}) => {
    const v = get(draft, path); const id = "f_" + path.replace(/\W/g, "_");
    const inp = opts.type === "textarea" ? `<textarea class="input" id="${id}" data-path="${path}" rows="${opts.rows || 3}" placeholder="${esc(opts.ph || "")}">${esc(v == null ? "" : v)}</textarea>`
      : opts.type === "select" ? `<select class="input" id="${id}" data-path="${path}">${opts.options.map(([k, l]) => `<option value="${k}" ${String(v) === String(k) ? "selected" : ""}>${l}</option>`).join("")}</select>`
      : `<input class="input" id="${id}" data-path="${path}" type="${opts.type || "text"}" value="${esc(v == null ? "" : v)}" placeholder="${esc(opts.ph || "")}" ${opts.num ? 'data-num="1"' : ""}>`;
    return `<div class="field"><label for="${id}">${label}</label>${inp}${opts.hint ? `<span class="hint">${opts.hint}</span>` : ""}</div>`;
  };
  const bindInputs = (scope) => $$("[data-path]", scope).forEach((i) => i.addEventListener("input", () => { set(draft, i.dataset.path, i.dataset.num ? Number(i.value) : i.value); markDirty(); }));
  /* lista editable: base = ruta del arreglo; cols = [{key,label,type,options,ph,w}] */
  function list(base, cols, opts = {}) {
    const arr = get(draft, base) || [];
    const widths = cols.map((c) => c.w || "1fr").join(" ");
    return `<div class="admin-list" data-list="${base}">${arr.map((_, i) => `<div class="admin-row"><div class="r" style="--cols:${widths}">${cols.map((c) => {
      const p = c.key === "" ? `${base}.${i}` : `${base}.${i}.${c.key}`; const v = get(draft, p);
      return `<div class="field"><label>${c.label}</label>${c.type === "select" ? `<select class="input" data-path="${p}">${c.options.map(([k, l]) => `<option value="${k}" ${String(v) === String(k) ? "selected" : ""}>${l}</option>`).join("")}</select>` : `<input class="input" data-path="${p}" type="${c.type || "text"}" value="${esc(v == null ? "" : v)}" placeholder="${esc(c.ph || "")}" ${c.num ? 'data-num="1"' : ""}>`}</div>`;
    }).join("")}</div><div class="acts"><button class="btn btn-icon" data-mv="${base}|${i}|-1" title="Subir">${icon("up")}</button><button class="btn btn-icon" data-mv="${base}|${i}|1" title="Bajar">${icon("down")}</button><button class="btn btn-icon" data-rm="${base}|${i}" title="Quitar" style="color:var(--bad)">${icon("trash")}</button></div></div>`).join("") || `<p class="muted small">${opts.empty || "Sin elementos."}</p>`}
      <div><button class="btn btn-sm" data-add="${base}" data-tpl='${esc(JSON.stringify(opts.tpl || {}))}'>${icon("plus")} ${opts.addLabel || "Agregar"}</button></div></div>`;
  }
  function bindLists(scope, rerender) {
    $$("[data-add]", scope).forEach((b) => b.addEventListener("click", () => { const arr = get(draft, b.dataset.add) || []; arr.push(JSON.parse(b.dataset.tpl)); set(draft, b.dataset.add, arr); markDirty(); rerender(); }));
    $$("[data-rm]", scope).forEach((b) => b.addEventListener("click", () => { const [base, i] = b.dataset.rm.split("|"); get(draft, base).splice(Number(i), 1); markDirty(); rerender(); }));
    $$("[data-mv]", scope).forEach((b) => b.addEventListener("click", () => { const [base, i, d] = b.dataset.mv.split("|"); const a = get(draft, base), from = Number(i), to = from + Number(d); if (to < 0 || to >= a.length) return; [a[from], a[to]] = [a[to], a[from]]; markDirty(); rerender(); }));
  }

  /* ---------- pestañas ---------- */
  const TABS = [["curso", "Curso"], ["raps", "RAP"], ["biblioteca", "Biblioteca y videos"], ["cronograma", "Cronograma"], ["entregas", "Evidencias"], ["actividades", "Resultados"], ["calificaciones", "Calificaciones"], ["ayuda", "Ayuda"], ["respaldo", "Respaldo"]];

  const accessCard = () => {
    const url = location.origin + location.pathname.replace(/index\.html$/, ""); const adm = [...(window.APP_CONFIG.instructores || []), ...(draft.info.admins || [])].filter(Boolean);
    const ab = String(draft.info.registroAbierto || "no") === "si";
    const rows = [["Dirección de la plataforma", url], ["Administrador · ingreso", "Primera vez: «Crear cuenta» (/#/registro) con uno de estos correos: " + (adm.join(", ") || "—") + ". Contraseña: la que elija."], ["Aprendiz · ingreso", "Su correo (usuario) y su número de documento (contraseña inicial), sin registrarse. Se cargan desde Aprendices → Importar aprendices."], ["Registro libre", ab ? "Abierto: cualquiera con el código «" + (draft.info.codigoInscripcion || "(sin código)") + "» puede crear cuenta." : "Cerrado: solo ingresan los aprendices importados."]];
    return `<div class="card"><h3>Datos de acceso</h3><table class="acc-tbl" style="width:100%"><tbody>${rows.map(([a, b]) => `<tr><th style="width:36%;overflow-wrap:normal;word-break:normal">${a}</th><td>${esc(b)}</td></tr>`).join("")}</tbody></table>
      <div class="flex wrap mt"><button class="btn btn-sm" id="copyAcc" data-text="${esc("Plataforma: " + url + "\nPara ingresar: tu correo de inscripción como usuario y tu número de documento como contraseña (sin puntos ni espacios). Luego puedes cambiarla en Mi perfil.")}">${icon("copy")} Copiar mensaje para los aprendices</button></div>
      <h4 class="mt">Administradores adicionales</h4><p class="small muted">Correos que, al registrarse, entran como administradores (además del de config.js).</p>${list("info.admins", [{ key: "", label: "Correo" }], { tpl: "", addLabel: "Agregar administrador" })}</div>`;
  };
  const appearanceCard = () => `<div class="card"><h3>Apariencia</h3>${f("Intensidad de los colores de fondo", "info.intensidad", { type: "select", options: [["ninguno", "Sin color (blanco)"], ["suave", "Suave"], ["medio", "Medio"]] })}
    <div class="row3">${[["sesion", "Sesión en vivo"], ["material", "Material"], ["videos", "Videos"], ["enlaces", "Enlaces"], ["evidencia", "Evidencia"]].map(([k, l]) => `<div class="field"><label>${l}</label><input type="color" data-path="info.colores.${k}" value="${esc(draft.info.colores[k])}" style="width:100%;height:38px;padding:2px"></div>`).join("")}</div>
    <p class="xs muted mb0">Cada RAP tiene además su propio color en la pestaña RAP.</p></div>`;
  const P = {
    curso: () => `<div class="grid split"><div class="card"><h3>Datos del curso</h3>
        ${f("Nombre corto (marca)", "info.marca")}${f("Nombre completo del programa", "info.nombre", { type: "textarea", rows: 2 })}${f("Descripción (portada)", "info.descripcion", { type: "textarea", rows: 3 })}
        <div class="row3">${f("Código del programa", "info.codigo")}${f("Horas", "info.horas", { type: "number", num: true })}${f("Zona horaria (UTC)", "info.utc", { ph: "-05:00" })}</div>
        ${f("Competencia", "info.competencia", { type: "textarea", rows: 2 })}
        ${f("Presentación del programa (área de trabajo)", "info.presentacion", { type: "textarea", rows: 5 })}
        ${f("Requisitos", "info.requisitos", { type: "textarea", rows: 2 })}
        <div class="row2">${f("Fecha de inicio", "info.inicio", { type: "date" })}${f("Fecha de fin", "info.fin", { type: "date" })}</div>
        <div class="row2"><div class="field"><label>Color principal</label><div class="flex"><input type="color" data-path="info.colorPrincipal" value="${esc(draft.info.colorPrincipal || "#2F6FED")}" style="width:48px;height:38px;border:1px solid var(--line-2);border-radius:8px;padding:2px;background:var(--surface)"><span class="hint">Menú, botones y encabezado.</span></div></div>${f("Nota mínima para aprobar", "info.notaMinima", { type: "number", num: true, hint: "Se usa al cargar calificaciones numéricas." })}</div></div>
      <div class="stack">${accessCard()}${appearanceCard()}<div class="card"><h3>Instructor y acceso</h3>${f("Nombre del instructor", "info.instructor")}${f("Cargo", "info.rolInstructor")}${f("Código de inscripción", "info.codigoInscripcion", { hint: "Solo se usa si el registro libre está abierto. Vacío = sin código." })}${f("Registro libre de aprendices", "info.registroAbierto", { type: "select", options: [["no", "Cerrado: solo ingresan los importados"], ["si", "Abierto: muestra «Crear cuenta»"]], hint: "Déjalo cerrado cuando importes a los aprendices." })}</div>
        <div class="card"><h3>Teams y evaluación</h3>${f("Enlace general del equipo de Teams", "info.teamsEquipo", { ph: "https://teams.microsoft.com/l/team/…", hint: "Se usa cuando una sesión o evidencia no tiene su propio enlace." })}${f("Mensaje sobre las entregas", "info.mensajeEntregas", { type: "textarea", rows: 2 })}${f("Actividades interactivas", "info.actividadesActivas", { type: "select", options: [["no", "Ocultas para los aprendices"], ["si", "Visibles para los aprendices"]], hint: "Puedes prepararlas en cada RAP y activarlas cuando quieras." })}${f("Nota sobre la calificación", "info.notaAprobacion", { type: "textarea", rows: 2 })}</div></div></div>`,
    raps: (sel) => {
      const raps = draft.raps; const i = Math.max(0, Math.min(raps.length - 1, Number(sel || 0)));
      const r = raps[i]; const base = `raps.${i}`;
      const tipos = Object.entries(TM).map(([k, v]) => [k, v.nombre]);
      return `<div class="flex wrap mb" style="gap:.35rem">${raps.map((x, k) => `<a class="chip chip-btn ${k === i ? "on" : ""}" href="#/admin/raps/${k}"><span class="dot" style="background:${x.color}"></span> RAP ${x.n}</a>`).join("")}<button class="chip chip-btn" id="addRap">${icon("plus")} Nuevo RAP</button>${raps.length > 1 ? `<button class="chip chip-btn" id="mvRapL" title="Mover a la izquierda">${icon("left")}</button><button class="chip chip-btn" id="mvRapR" title="Mover a la derecha">${icon("right")}</button><button class="chip chip-btn" id="delRap" style="color:var(--bad)">${icon("trash")} Quitar este RAP</button>` : ""}</div>
      ${!r ? "" : `<div class="grid split"><div class="stack">
        <div class="card"><h3>Identificación</h3><div class="row3">${f("Número", base + ".n", { type: "number", num: true })}${f("Nombre corto", base + ".corto")}<div class="field"><label>Color</label><div class="color-pick" data-color="${base}.color">${["#6C3CE1", "#0EA5A4", "#F2545B", "#F5A524", "#2563EB", "#DB2777", "#16A34A", "#EA580C"].map((c) => `<button type="button" data-c="${c}" class="${c === r.color ? "on" : ""}" style="background:${c}"></button>`).join("")}</div></div></div>
          ${f("Título del resultado de aprendizaje", base + ".titulo", { type: "textarea", rows: 2 })}${f("Descripción breve", base + ".descripcion", { type: "textarea", rows: 2 })}
          <h4 class="mt">Criterios de evaluación</h4>${list(base + ".criterios", [{ key: "", label: "Criterio" }], { tpl: "", addLabel: "Agregar criterio" })}</div>
        <div class="card"><h3>Material de estudio y guía</h3><p class="small muted">Pega el enlace de cada archivo (carpeta <span class="kbd">recursos/</span> del repositorio, Google Drive, OneDrive…).</p>
          ${list(base + ".materiales", [{ key: "tipo", label: "Tipo", type: "select", options: tipos, w: "150px" }, { key: "titulo", label: "Título", w: "1.4fr" }, { key: "url", label: "Enlace", ph: "recursos/… o https://…", w: "1.4fr" }, { key: "desc", label: "Nota (opcional)" }], { tpl: { tipo: "estudio", titulo: "", url: "", desc: "" }, addLabel: "Agregar material" })}</div>
        <div class="card"><h3>Videos del RAP</h3>${list(base + ".videos", [{ key: "titulo", label: "Título" }, { key: "url", label: "Enlace (YouTube u otro)", w: "1.3fr" }, { key: "desc", label: "Descripción" }], { tpl: { titulo: "", url: "", desc: "" }, addLabel: "Agregar video" })}</div>
        <div class="card"><h3>Recursos y enlaces</h3><p class="small muted">Apps de ejemplo, juegos, Kahoot, simuladores, formularios, lecturas… cualquier enlace.</p>${list(base + ".recursos", [{ key: "tipo", label: "Tipo", type: "select", options: Object.entries(window.TIPOS_RECURSO).map(([k, v]) => [k, v.nombre]), w: "150px" }, { key: "titulo", label: "Título" }, { key: "url", label: "Enlace", w: "1.3fr" }, { key: "desc", label: "Descripción" }], { tpl: { tipo: "enlace", titulo: "", url: "", desc: "" }, addLabel: "Agregar enlace" })}</div>${actsCard(i, r)}</div>
      <div class="stack">
        <div class="card"><h3>Sesión en vivo</h3><div class="row3">${f("Fecha", base + ".sesion.fecha", { type: "date" })}${f("Hora inicio", base + ".sesion.horaInicio", { type: "time" })}${f("Hora fin", base + ".sesion.horaFin", { type: "time" })}</div>${f("Datos adicionales de ingreso a Teams", base + ".sesion.datos", { type: "textarea", rows: 3, ph: "ID de reunión: …\nCódigo de acceso: …\nNotas", hint: "Se muestran en el RAP junto al botón de Teams." })}${f("Enlace de la reunión de Teams", base + ".sesion.enlace", { ph: "https://teams.microsoft.com/l/meetup-join/…" })}${f("Enlace de la grabación", base + ".sesion.grabacion", { ph: "YouTube, Stream o Drive" })}</div>
        <div class="card"><h3>Evidencia</h3>${f("Nombre", base + ".evidencia.nombre")}${f("Descripción (qué debe entregar)", base + ".evidencia.descripcion", { type: "textarea", rows: 4 })}<div class="row2">${f("Fecha límite", base + ".evidencia.fecha", { type: "date" })}${f("Hora", base + ".evidencia.hora", { type: "time" })}</div>${f("Formulario de Google para entregar la evidencia", base + ".evidencia.formulario", { ph: "https://docs.google.com/forms/d/e/…/viewform", hint: "Pega el enlace largo del formulario (no el corto forms.gle). Aparece dentro de la plataforma, con comentario y carga de archivo." })}${f("Enlace a las respuestas (opcional)", base + ".evidencia.respuestas", { ph: "Hoja de cálculo o carpeta de Drive con lo entregado", hint: "Solo lo ves tú: te sirve de acceso rápido desde la pestaña Evidencias." })}
          <h4 class="mt">Rúbrica</h4>${list(base + ".evidencia.rubrica", [{ key: "0", label: "Criterio", w: "2fr" }, { key: "1", label: "Puntos", type: "number", num: true, w: "90px" }], { tpl: ["", 0], addLabel: "Agregar criterio" })}<p class="xs muted">Total: <b id="rubTotal">${(r.evidencia.rubrica || []).reduce((a, x) => a + (Number(x[1]) || 0), 0)}</b> puntos</p></div></div></div>`}`;
    },
    biblioteca: () => `<div class="stack"><div class="card"><h3>Material general</h3><p class="small muted">Documentos que no pertenecen a un RAP (reglamento, presentación del curso, lecturas…). Los de cada RAP se editan en la pestaña RAP.</p>${list("biblioteca", [{ key: "tipo", label: "Tipo", type: "select", options: Object.entries(TM).map(([k, v]) => [k, v.nombre]), w: "150px" }, { key: "titulo", label: "Título", w: "1.4fr" }, { key: "url", label: "Enlace", w: "1.4fr" }, { key: "desc", label: "Nota" }], { tpl: { tipo: "lectura", titulo: "", url: "", desc: "" }, addLabel: "Agregar material" })}</div>
      <div class="card"><h3>Videos generales</h3>${list("videos", [{ key: "titulo", label: "Título" }, { key: "url", label: "Enlace", w: "1.3fr" }, { key: "desc", label: "Descripción" }], { tpl: { titulo: "", url: "", desc: "" }, addLabel: "Agregar video" })}</div></div>`,
    cronograma: () => `<div class="card"><h3>Hitos del cronograma</h3><p class="small muted">Las sesiones en vivo y las fechas de entrega salen automáticamente de cada RAP. Aquí agregas otras fechas: inicio, cierre, día de ajustes, encuentros extra…</p>${list("hitos", [{ key: "fecha", label: "Fecha", type: "date", w: "150px" }, { key: "hora", label: "Hora", type: "time", w: "110px" }, { key: "titulo", label: "Título" }, { key: "desc", label: "Descripción", w: "1.3fr" }, { key: "enlace", label: "Enlace (opcional)" }], { tpl: { fecha: "", hora: "08:00", titulo: "", desc: "", enlace: "" }, addLabel: "Agregar hito" })}</div>`,
    calificaciones: () => `<div id="gpanel"><div class="spinner"></div></div>`,
    ayuda: () => `<div class="grid split"><div class="card"><h3>Preguntas frecuentes</h3>${list("faq", [{ key: "0", label: "Pregunta" }, { key: "1", label: "Respuesta", w: "1.6fr" }], { tpl: ["", ""], addLabel: "Agregar pregunta" })}</div><div class="card"><h3>Normas de convivencia</h3>${list("normas", [{ key: "", label: "Norma" }], { tpl: "", addLabel: "Agregar norma" })}</div></div>`,
    respaldo: () => `<div class="grid split"><div class="card"><h3>Copia de seguridad</h3><p class="small muted">Descarga todo el contenido del curso en un archivo. Sirve para guardar una copia o para montar otro curso: importas el archivo, cambias los textos y listo.</p><div class="flex wrap"><button class="btn btn-primary" id="exp">${icon("download")} Exportar contenido (JSON)</button><label class="btn">${icon("upload")} Importar JSON <input type="file" id="imp" accept="application/json" hidden></label></div></div>
      <div class="card"><h3>Restablecer</h3><p class="small muted">Vuelve al contenido de ejemplo que trae la plataforma (js/data.js). Se pierden los cambios hechos desde aquí.</p><button class="btn btn-danger" id="rst">${icon("trash")} Restablecer al contenido de ejemplo</button>
      <div class="divider"></div><h4>Estado</h4><p class="small mb0">Modo: <b>${B.mode === "firebase" ? "En línea (Firebase)" : "Demostración (solo este navegador)"}</b>${B.firebaseError ? " · Hay datos de Firebase pero no se pudo conectar." : ""}</p></div></div>`
  };


  /* ---------- actividades interactivas: tarjeta en el RAP y editor ---------- */
  const AT = () => window.Activities;
  const actsCard = (i, r) => `<div class="card"><h3>Actividades interactivas</h3><p class="small muted">Se califican solas dentro de la plataforma y el resultado queda registrado por aprendiz.</p>
    ${(r.actividades || []).map((x, k) => `<div class="admin-row"><div class="r" style="--cols:1fr"><div><b>${esc(x.titulo)}</b><div class="xs muted">${(AT().TIPOS[x.tipo] || {}).nombre || x.tipo} · mínimo ${Number(x.minimo) || 70}%</div></div></div><div class="acts"><a class="btn btn-sm" href="#/admin/act/${i}-${k}">${icon("settings")} Editar</a><button class="btn btn-icon" data-mv="raps.${i}.actividades|${k}|-1" title="Subir">${icon("up")}</button><button class="btn btn-icon" data-mv="raps.${i}.actividades|${k}|1" title="Bajar">${icon("down")}</button><button class="btn btn-icon" data-rm="raps.${i}.actividades|${k}" title="Quitar" style="color:var(--bad)">${icon("trash")}</button></div></div>`).join("") || `<p class="muted small">Aún no hay actividades interactivas en este RAP.</p>`}
    <div class="flex wrap mt"><select class="input" id="newActType" style="max-width:240px">${Object.entries(AT().TIPOS).map(([k, v]) => `<option value="${k}">${v.icono} ${v.nombre}</option>`).join("")}</select><button class="btn btn-sm" data-newact="${i}">${icon("plus")} Crear actividad</button></div></div>`;
  P.act = (sub) => {
    const [i, j] = String(sub || "0-0").split("-").map(Number); const r = draft.raps[i], a = r && (r.actividades || [])[j];
    if (!a) return `<div class="empty">No encontramos esa actividad. <a href="#/admin/raps/${i || 0}">Volver al RAP</a></div>`;
    const base = `raps.${i}.actividades.${j}`, T = AT().TIPOS;
    const cols = {
      quiz: [[{ key: "q", label: "Pregunta", w: "1.5fr" }, { key: "opciones", label: "Opciones separadas por |", w: "1.7fr", ph: "A | B | C" }, { key: "correcta", label: "N.º correcta", type: "number", num: true, w: "95px" }, { key: "expl", label: "Explicación (opcional)" }], { q: "", opciones: "", correcta: 1, expl: "" }, "Agregar pregunta"],
      vf: [[{ key: "q", label: "Afirmación", w: "2fr" }, { key: "correcta", label: "Es", type: "select", options: [["v", "Verdadera"], ["f", "Falsa"]], w: "130px" }, { key: "expl", label: "Explicación (opcional)" }], { q: "", correcta: "v", expl: "" }, "Agregar afirmación"],
      completar: [[{ key: "texto", label: "Texto con [[respuesta]] o [[resp1|resp2]]", w: "2.4fr" }, { key: "expl", label: "Explicación (opcional)" }], { texto: "", expl: "" }, "Agregar frase"],
      parejas: [[{ key: "a", label: "Concepto" }, { key: "b", label: "Se relaciona con", w: "1.4fr" }], { a: "", b: "" }, "Agregar pareja"],
      orden: [[{ key: "t", label: "Paso (escríbelos en el orden correcto)", w: "1fr" }], { t: "" }, "Agregar paso"]
    };
    const body = a.tipo === "html"
      ? `<div class="card"><h3>Contenido HTML</h3>${f("Código HTML de la actividad", base + ".html", { type: "textarea", rows: 14, ph: "<!doctype html>…" })}${f("…o enlace para incrustar (si no usas código)", base + ".url", { ph: "https://…" })}
          ${f("¿Se marca completada con un botón?", base + ".manual", { type: "select", options: [["no", "No: la actividad envía su nota"], ["si", "Sí: el aprendiz la marca como completada (100%)"]] })}
          <div class="note">${icon("info")}<div class="small"><b>Para que se califique sola</b>, al terminar la actividad debe ejecutar:<br><code>parent.postMessage({ iapScore: 85 }, "*")</code> (nota de 0 a 100).<br>Pídeme: «Hazme una actividad HTML autocalificable para la plataforma, sobre …».</div></div></div>`
      : `<div class="card"><h3>${T[a.tipo].nombre}</h3><p class="small muted">${T[a.tipo].ayuda}</p>${list(base + ".items", cols[a.tipo][0], { tpl: cols[a.tipo][1], addLabel: cols[a.tipo][2] })}</div>`;
    return `<div class="flex between wrap mb"><a class="btn" href="#/admin/raps/${i}">${icon("left")} Volver al RAP ${r.n}</a><button class="btn btn-primary" id="actPrev">${icon("play")} Probar actividad</button></div>
      <div class="grid split"><div class="stack"><div class="card"><h3>Configuración</h3>${f("Título", base + ".titulo")}${f("Instrucciones / descripción", base + ".descripcion", { type: "textarea", rows: 2 })}
        <div class="field"><label for="actTipo">Tipo de actividad</label><select class="input" id="actTipo">${Object.entries(T).map(([k, v]) => `<option value="${k}" ${a.tipo === k ? "selected" : ""}>${v.icono} ${v.nombre}</option>`).join("")}</select><span class="hint">Cambiar el tipo reemplaza las preguntas.</span></div>
        <div class="row2">${f("Puntaje mínimo para aprobar (%)", base + ".minimo", { type: "number", num: true })}${f("Mezclar el orden de las preguntas", base + ".mezclar", { type: "select", options: [["no", "No"], ["si", "Sí"]] })}</div></div></div>
        <div class="stack">${body}</div></div>`;
  };
  P.entregas = () => `<div id="epanel"><div class="spinner"></div></div>`;
  P.actividades = () => `<div id="rpanel"><div class="spinner"></div></div>`;
  const dlFile = (name, text, type = "text/csv;charset=utf-8") => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); };
  const csv = (rows) => "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const fdt = (ts) => (ts ? new Date(ts).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "short", timeStyle: "short" }) : "");

  async function exportExcel() {
    try {
      const raps = draft.raps; const [gr, users] = await Promise.all([B.listGrades(), B.listUsers().catch(() => [])]);
      const all = { ...gr }; users.filter((u) => u.role !== "instructor").forEach((u) => { const k = gKey(u.email); if (!all[k]) all[k] = { email: k, name: u.name, ficha: u.ficha || "", raps: {}, obs: "" }; else { if (!all[k].name) all[k].name = u.name; if (!all[k].ficha) all[k].ficha = u.ficha || ""; } });
      const lab = { aprobado: "Aprobado", no_aprobado: "No aprobado", pendiente: "Pendiente" };
      const fin = (g) => { if (g.final) return lab[g.final] || g.final; const st = raps.map((r) => (g.raps[r.id] || {}).estado || "pendiente"); return st.every((s) => s === "aprobado") ? "Aprobado" : st.includes("pendiente") ? "Pendiente" : "No aprobado"; };
      const rows = [["Nombre", "Correo", "Ficha", ...raps.flatMap((r) => [`RAP ${r.n} · nota`, `RAP ${r.n} · estado`]), "Juicio final", "Observaciones"]];
      Object.values(all).sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email)).forEach((g) => rows.push([g.name || "", g.email, g.ficha || "", ...raps.flatMap((r) => { const x = g.raps[r.id] || {}; return [x.nota == null ? "" : x.nota, lab[x.estado] || "Pendiente"]; }), fin(g), g.obs || ""]));
      const name = `notas-${(draft.info.marca || "curso").toLowerCase().replace(/\W+/g, "-")}`;
      try { const X = await loadXLSX(); const wb = X.utils.book_new(); const ws = X.utils.aoa_to_sheet(rows); ws["!cols"] = rows[0].map((_, i) => ({ wch: i < 3 ? 26 : 14 })); X.utils.book_append_sheet(wb, ws, "Calificaciones"); X.writeFile(wb, name + ".xlsx"); toast("Excel descargado", "ok"); }
      catch (e) { dlFile(name + ".csv", csv(rows)); toast("No se pudo generar el Excel; se descargó un CSV que Excel también abre.", "bad"); }
    } catch (e) { toast(e.message, "bad"); }
  }
  async function subsPanel(ap, sel) {
    const el = $("#epanel", ap); if (!el) return; const raps = draft.raps; const ri = Math.max(0, Math.min(raps.length - 1, Number(sel || 0))); const r = raps[ri];
    let users, gr; try { [users, gr] = await Promise.all([B.listUsers(), B.listGrades()]); } catch (e) { el.innerHTML = `<div class="form-error">${esc(e.message)}</div>`; return; }
    users = users.filter((u) => u.role !== "instructor").sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const cur = (u) => ((gr[gKey(u.email)] || {}).raps || {})[r.id] || {};
    const nCal = users.filter((u) => cur(u).estado && cur(u).estado !== "pendiente").length;
    el.innerHTML = `<div class="flex wrap mb" style="gap:.35rem">${raps.map((x, k) => `<a class="chip chip-btn ${k === ri ? "on" : ""}" href="#/admin/entregas/${k}"><span class="dot" style="background:${x.color}"></span> RAP ${x.n}</a>`).join("")}</div>
      <div class="card"><div class="flex between wrap mb"><div><h3 class="mb0">${esc(r.evidencia.nombre)} · ${esc(r.corto)}</h3><span class="small muted">${nCal} de ${users.length} calificadas${r.evidencia.respuestas ? ` · <a href="${esc(r.evidencia.respuestas)}" target="_blank" rel="noopener">ver lo entregado</a>` : ""}${r.evidencia.formulario ? ` · <a href="${esc(r.evidencia.formulario)}" target="_blank" rel="noopener">abrir formulario</a>` : ""}</span></div>
        <div class="flex wrap"><button class="btn btn-sm" id="expx">${icon("download")} Descargar todas las notas (Excel)</button></div></div>
        <div class="table-wrap"><table class="table gtable"><thead><tr><th>Aprendiz</th><th>Nota</th><th>Estado</th><th>Retroalimentación</th><th></th></tr></thead><tbody>
        ${users.map((u) => { const rv = cur(u); return `<tr data-uid="${esc(u.uid)}"><td><b>${esc(u.name)}</b><div class="xs muted">Ficha ${esc(u.ficha || "—")}</div></td>
          <td><input class="input" data-f="nota" type="number" min="0" max="100" value="${esc(rv.nota == null ? "" : rv.nota)}" style="width:76px"></td>
          <td><select class="input" data-f="estado">${[["auto", "Automático"], ["aprobado", "Aprobado"], ["no_aprobado", "No aprobado"], ["pendiente", "Pendiente"]].map(([k, l]) => `<option value="${k}" ${(rv.manual ? rv.estado : "auto") === k ? "selected" : ""}>${l}</option>`).join("")}</select></td>
          <td><input class="input" data-f="feedback" value="${esc(rv.obs || "")}" placeholder="Comentario para el aprendiz"></td><td><button class="btn btn-sm btn-primary" data-save>Guardar</button></td></tr>`; }).join("") || `<tr><td colspan="5" class="muted">Aún no hay aprendices registrados.</td></tr>`}</tbody></table></div>
        <p class="xs muted mt mb0">Al guardar, la nota se actualiza al instante en todos los apartados del aprendiz: el RAP, el Área de trabajo y Mis calificaciones. «Automático» aprueba con ${nMin()} o más.</p></div>`;
    const read = (tr) => { const nota = tr.querySelector('[data-f="nota"]').value; let est = tr.querySelector('[data-f="estado"]').value; const manual = est !== "auto"; if (!manual) est = nota === "" ? "pendiente" : Number(nota) >= nMin() ? "aprobado" : "no_aprobado"; return { nota: nota === "" ? "" : Number(nota), estado: est, manual, obs: tr.querySelector('[data-f="feedback"]').value.trim() }; };
    $$("[data-save]", el).forEach((b) => b.addEventListener("click", async () => { const tr = b.closest("tr"), u = users.find((x) => x.uid === tr.dataset.uid); try { await B.setRapGrade(u, r.id, read(tr)); grades = null; toast("Nota guardada y publicada", "ok"); } catch (e) { toast(e.message, "bad"); } }));
    $("#expx", el).addEventListener("click", () => exportExcel());
  }

  async function resultsPanel(ap) {
    const el = $("#rpanel", ap); if (!el) return; let users, res; try { [users, res] = await Promise.all([B.listUsers(), B.listResults()]); } catch (e) { el.innerHTML = `<div class="form-error">${esc(e.message)}</div>`; return; }
    users = users.filter((u) => u.role !== "instructor").sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const acts = []; draft.raps.forEach((r) => (r.actividades || []).forEach((x) => acts.push({ r, x })));
    if (!acts.length) { el.innerHTML = `<div class="empty">Aún no hay actividades interactivas. Créalas en la pestaña RAP.</div>`; return; }
    const get1 = (u, x) => res.find((y) => y.uid === u.uid && y.actId === x.id);
    const avg = (u) => { const v = acts.map(({ x }) => (get1(u, x) || {}).best || 0); return Math.round(v.reduce((a, b) => a + b, 0) / v.length); };
    el.innerHTML = `<div class="card"><div class="flex between wrap mb"><div><h3 class="mb0">Resultados de actividades interactivas</h3><span class="small muted">Mejor resultado de cada aprendiz (0–100). Verde = aprobada.</span></div><button class="btn btn-sm" id="rcsv">${icon("download")} Descargar CSV</button></div>
      <div class="table-wrap"><table class="table gtable"><thead><tr><th>Aprendiz</th>${acts.map(({ r, x }) => `<th style="color:${r.color}" title="${esc(x.titulo)}">R${r.n} · ${esc(x.titulo.slice(0, 22))}</th>`).join("")}<th>Promedio</th></tr></thead><tbody>
      ${users.map((u) => `<tr><td><b>${esc(u.name)}</b><div class="xs muted">Ficha ${esc(u.ficha || "—")}</div></td>${acts.map(({ x }) => { const y = get1(u, x); return `<td>${y ? `<span class="state ${y.passed ? "ok" : "no"}">${y.best}%</span><div class="xs muted">${y.intentos} int.</div>` : '<span class="muted">—</span>'}</td>`; }).join("")}<td><b>${avg(u)}%</b></td></tr>`).join("") || `<tr><td colspan="${acts.length + 2}" class="muted">Aún no hay aprendices.</td></tr>`}</tbody></table></div></div>`;
    $("#rcsv", el).addEventListener("click", () => dlFile("resultados-actividades.csv", csv([["Nombre", "Correo", "Ficha", ...acts.map(({ r, x }) => `RAP ${r.n} · ${x.titulo}`), "Promedio"], ...users.map((u) => [u.name, u.email, u.ficha, ...acts.map(({ x }) => { const y = get1(u, x); return y ? y.best : ""; }), avg(u)])])));
  }

  /* ---------- CALIFICACIONES ---------- */
  let grades = null, gDirty = false;
  const gKey = (e) => String(e || "").trim().toLowerCase();
  const nMin = () => Number((draft || B.course).info.notaMinima) || 70;
  function estadoFromValue(val) {
    if (val == null || String(val).trim() === "") return { nota: "", estado: "pendiente" };
    const t = String(val).trim(); const n = Number(t.replace(",", "."));
    if (!isNaN(n) && t !== "") return { nota: n, estado: n >= nMin() ? "aprobado" : "no_aprobado" };
    const u = t.toUpperCase();
    if (/^(A|AP|APROBADO|APROBÓ|APROBO|SI|SÍ|OK)$/.test(u)) return { nota: t, estado: "aprobado" };
    if (/^(D|NA|NO APROBADO|NO APROBÓ|NO APROBO|REPROBADO|NO)$/.test(u)) return { nota: t, estado: "no_aprobado" };
    if (/^(P|PENDIENTE|POR EVALUAR|-)$/.test(u)) return { nota: "", estado: "pendiente" };
    return { nota: t, estado: "pendiente" };
  }
  async function loadXLSX() {
    if (window.XLSX) return window.XLSX;
    await new Promise((res, rej) => { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; sc.onload = res; sc.onerror = () => rej(new Error("No se pudo cargar el lector de Excel. Revisa la conexión o usa un archivo CSV.")); document.head.appendChild(sc); });
    return window.XLSX;
  }
  function parseCSV(text) {
    const sep = (text.match(/;/g) || []).length >= (text.match(/,/g) || []).length ? ";" : ",";
    return text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim()).map((l) => { const out = []; let cur = "", q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === sep && !q) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map((x) => x.trim()); });
  }
  async function readFile(file) {
    if (/\.csv$|\.txt$/i.test(file.name)) return parseCSV(await file.text());
    const X = await loadXLSX(); const wb = X.read(await file.arrayBuffer(), { type: "array" }); const ws = wb.Sheets[wb.SheetNames[0]];
    return X.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" }).map((r) => r.map((c) => String(c == null ? "" : c).trim()));
  }
  function importRows(rows) {
    const raps = draft.raps; const nrm = (x) => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const hi = rows.findIndex((r) => r.some((c) => /correo|email|e-mail/.test(nrm(c)))); if (hi < 0) throw new Error("No encontré una columna «Correo». Usa la plantilla.");
    const H = rows[hi].map(nrm);
    const col = (re) => H.findIndex((h) => re.test(h));
    const cEmail = col(/correo|email|e-mail/), cName = col(/nombre/), cFicha = col(/ficha/), cObs = H.findIndex((h) => /^observ/.test(h) && !/rap|ev/.test(h)), cFinal = col(/final|juicio/);
    const cRap = raps.map((r) => { let i = H.findIndex((h) => new RegExp(`^(rap|r|ev|evidencia)\\s*0*${r.n}\\b`).test(h)); if (i < 0) i = H.findIndex((h) => h.includes(nrm(r.corto))); return i; });
    const cRapObs = raps.map((r) => H.findIndex((h) => /obs/.test(h) && new RegExp(`(rap|ev)\\s*0*${r.n}\\b`).test(h)));
    let n = 0, skipped = 0;
    rows.slice(hi + 1).forEach((row) => {
      const email = gKey(row[cEmail]); if (!email || !email.includes("@")) { skipped++; return; }
      const g = grades[email] || { email, name: "", ficha: "", raps: {}, obs: "" };
      if (cName >= 0 && row[cName]) g.name = row[cName]; if (cFicha >= 0 && row[cFicha]) g.ficha = row[cFicha]; if (cObs >= 0) g.obs = row[cObs] || g.obs || "";
      if (cFinal >= 0 && row[cFinal]) g.final = estadoFromValue(row[cFinal]).estado;
      raps.forEach((r, k) => { if (cRap[k] >= 0) { const v = estadoFromValue(row[cRap[k]]); g.raps[r.id] = { ...v, obs: cRapObs[k] >= 0 ? row[cRapObs[k]] || "" : (g.raps[r.id] || {}).obs || "" }; } });
      grades[email] = g; n++;
    });
    return { n, skipped };
  }
  function templateRows() { const raps = draft.raps; return [["Correo", "Nombre", "Ficha", ...raps.map((r) => `RAP ${r.n}`), ...raps.map((r) => `Observación RAP ${r.n}`), "Juicio final", "Observaciones"], ["ejemplo@gmail.com", "Nombre Apellido", "1234567", ...raps.map(() => "85"), ...raps.map(() => ""), "A", ""]]; }
  async function gradesPanel(ap) {
    const el = $("#gpanel", ap); if (!el) return;
    try { if (!grades) grades = await B.listGrades(); } catch (e) { el.innerHTML = `<div class="form-error">${esc(e.message)}</div>`; return; }
    let users = []; try { users = (await B.listUsers()).filter((u) => u.role !== "instructor"); } catch (e) {}
    users.forEach((u) => { const k = gKey(u.email); if (!grades[k]) grades[k] = { email: k, name: u.name, ficha: u.ficha || "", raps: {}, obs: "" }; else { if (!grades[k].name) grades[k].name = u.name; if (!grades[k].ficha) grades[k].ficha = u.ficha || ""; } });
    const raps = draft.raps; let q = "";
    const draw = () => {
      const keys = Object.keys(grades).filter((k) => !q || (grades[k].name + " " + k + " " + grades[k].ficha).toLowerCase().includes(q.toLowerCase())).sort((a, b) => (grades[a].name || a).localeCompare(grades[b].name || b, "es"));
      const reg = new Set(users.map((u) => gKey(u.email)));
      el.innerHTML = `<div class="grid split mb"><div class="card"><h3>Cargar desde Excel o CSV</h3><p class="small muted">Una fila por aprendiz. Columnas: <b>Correo</b> (el del registro), Nombre, Ficha y una columna por RAP (<b>RAP 1</b>, <b>RAP 2</b>…) con la nota de 1 a 100 o la letra <b>A</b> (aprobado) / <b>D</b> (no aprobado). Opcionales: «Observación RAP n», «Juicio final» y «Observaciones». Las notas numéricas se comparan con la nota mínima (${nMin()}).</p>
          <div class="dropzone" id="dz">${icon("upload")} Arrastra aquí el archivo o <u>haz clic para elegirlo</u><input type="file" id="gfile" accept=".xlsx,.xls,.csv,.txt" hidden></div>
          <div class="flex wrap mt"><button class="btn btn-sm" id="tplx">${icon("download")} Plantilla Excel</button><button class="btn btn-sm" id="tplc">${icon("download")} Plantilla CSV</button><button class="btn btn-sm" id="expg">${icon("download")} Exportar calificaciones</button></div></div>
        <div class="card"><h3>Resumen</h3><div class="grid g2">${raps.map((r) => { const ok = keys.filter((k) => (grades[k].raps[r.id] || {}).estado === "aprobado").length, no = keys.filter((k) => (grades[k].raps[r.id] || {}).estado === "no_aprobado").length; return `<div><b style="color:${r.color}">RAP ${r.n}</b><div class="small">${ok} aprobados · ${no} no aprobados · ${keys.length - ok - no} pendientes</div></div>`; }).join("")}</div><p class="xs muted mt mb0">${keys.length} aprendices en la tabla · ${users.length} registrados en la plataforma.</p></div></div>
        <div class="card"><div class="flex wrap between mb"><h3 class="mb0">Tabla de calificaciones</h3><div class="flex"><input class="input" id="gq" placeholder="Buscar…" value="${esc(q)}" style="max-width:220px"><button class="btn btn-sm" id="gadd">${icon("plus")} Agregar fila</button></div></div>
          <div class="table-wrap"><table class="table gtable"><thead><tr><th>Aprendiz</th><th>Correo</th>${raps.map((r) => `<th style="color:${r.color}">RAP ${r.n}</th>`).join("")}<th>Juicio final</th><th>Observaciones</th><th></th></tr></thead><tbody>
          ${keys.map((k) => { const g = grades[k]; return `<tr><td><input class="input" data-g="${esc(k)}|name" value="${esc(g.name || "")}" placeholder="Nombre"><div class="xs muted">${g.ficha ? "Ficha " + esc(g.ficha) : ""}${reg.has(k) ? "" : ' · <span style="color:var(--warn)">sin cuenta en la plataforma</span>'}</div></td><td class="small">${esc(k)}</td>
            ${raps.map((r) => { const x = g.raps[r.id] || { nota: "", estado: "pendiente" }; return `<td><div class="flex" style="gap:.3rem"><input class="input" data-g="${esc(k)}|nota|${r.id}" value="${esc(x.nota == null ? "" : x.nota)}" placeholder="Nota" style="max-width:72px"><select class="input" data-g="${esc(k)}|estado|${r.id}"><option value="pendiente" ${x.estado === "pendiente" ? "selected" : ""}>Pend.</option><option value="aprobado" ${x.estado === "aprobado" ? "selected" : ""}>Aprobado</option><option value="no_aprobado" ${x.estado === "no_aprobado" ? "selected" : ""}>No aprob.</option></select></div></td>`; }).join("")}
            <td><select class="input" data-g="${esc(k)}|final"><option value="" ${!g.final ? "selected" : ""}>Automático</option><option value="aprobado" ${g.final === "aprobado" ? "selected" : ""}>Aprobado</option><option value="no_aprobado" ${g.final === "no_aprobado" ? "selected" : ""}>No aprobado</option><option value="pendiente" ${g.final === "pendiente" ? "selected" : ""}>Pendiente</option></select></td>
            <td><input class="input" data-g="${esc(k)}|obs" value="${esc(g.obs || "")}" placeholder="Opcional"></td><td><button class="btn btn-icon" data-gdel="${esc(k)}" style="color:var(--bad)">${icon("trash")}</button></td></tr>`; }).join("") || `<tr><td colspan="${raps.length + 5}"><div class="empty">Aún no hay calificaciones. Carga un archivo o agrega filas.</div></td></tr>`}</tbody></table></div>
          <p class="xs muted mt mb0">Cada aprendiz solo ve sus propias calificaciones. Guarda con el botón de abajo.</p></div>`;
      $("#gq", el).addEventListener("input", (e) => { q = e.target.value; const pos = e.target.selectionStart; draw(); const i = $("#gq", el); i.focus(); i.setSelectionRange(pos, pos); });
      $$("[data-g]", el).forEach((i) => i.addEventListener("input", () => { const [k, f, rid] = i.dataset.g.split("|"); const g = grades[k]; if (f === "name") g.name = i.value; else if (f === "obs") g.obs = i.value; else if (f === "final") g.final = i.value || null; else { g.raps[rid] = g.raps[rid] || { nota: "", estado: "pendiente" }; if (f === "nota") { const v = estadoFromValue(i.value); g.raps[rid].nota = i.value; if (i.value.trim() !== "") { g.raps[rid].estado = v.estado; const sel = $(`[data-g="${k}|estado|${rid}"]`, el); if (sel) sel.value = v.estado; } } else g.raps[rid].estado = i.value; } gDirty = true; markDirty(); }));
      $$("[data-gdel]", el).forEach((b) => b.addEventListener("click", async () => { if (await confirmDialog("Quitar fila", "Se quitan las calificaciones de este aprendiz.", "Quitar", true)) { delete grades[b.dataset.gdel]; gDirty = true; markDirty(); draw(); } }));
      $("#gadd", el).addEventListener("click", () => { modal({ title: "Agregar aprendiz", body: `<div class="field"><label>Correo (el del registro)</label><input class="input" id="ne" type="email"></div><div class="field"><label>Nombre</label><input class="input" id="nn"></div>`, foot: `<button class="btn" data-close>Cancelar</button><button class="btn btn-primary" data-ok>Agregar</button>`, onOpen: (m, close) => m.querySelector("[data-ok]").addEventListener("click", () => { const k = gKey(m.querySelector("#ne").value); if (!k.includes("@")) return toast("Escribe un correo válido", "bad"); grades[k] = grades[k] || { email: k, name: m.querySelector("#nn").value.trim(), ficha: "", raps: {}, obs: "" }; gDirty = true; markDirty(); close(); draw(); }) }); });
      const dz = $("#dz", el), fi = $("#gfile", el);
      const handle = async (file) => { try { const rows = await readFile(file); const { n, skipped } = importRows(rows); gDirty = true; markDirty(); draw(); toast(`${n} aprendices cargados${skipped ? ` · ${skipped} filas sin correo omitidas` : ""}. Revisa y guarda.`, "ok"); } catch (e) { toast(e.message, "bad"); } };
      dz.addEventListener("click", () => fi.click()); fi.addEventListener("change", () => { if (fi.files[0]) handle(fi.files[0]); });
      dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("over"); }); dz.addEventListener("dragleave", () => dz.classList.remove("over")); dz.addEventListener("drop", (e) => { e.preventDefault(); dz.classList.remove("over"); if (e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]); });
      const dl = (name, blob) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); };
      $("#tplc", el).addEventListener("click", () => dl("plantilla-calificaciones.csv", new Blob(["\uFEFF" + templateRows().map((r) => r.join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" })));
      $("#tplx", el).addEventListener("click", async () => { try { const X = await loadXLSX(); const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(templateRows()), "Calificaciones"); X.writeFile(wb, "plantilla-calificaciones.xlsx"); } catch (e) { toast(e.message, "bad"); } });
      $("#expg", el).addEventListener("click", () => exportExcel());
    };
    draw();
  }

  function view(v, tab, sub) {
    ensure(); editing = true;
    tab = TABS.find((t) => t[0] === tab) || tab === "act" ? tab : "curso";
    v.innerHTML = `<div class="page-head"><div><h1>Administrar curso</h1><p>Todo lo que cambies aquí lo ven los aprendices al guardar.</p></div><a class="btn" href="${location.pathname}?preview=aprendiz#/inicio" target="_blank" rel="noopener">${icon("eye")} Ver como aprendiz</a></div>
      <div class="tabs">${TABS.map(([k, l]) => `<a class="tab ${k === tab || (tab === "act" && k === "raps") ? "on" : ""}" href="#/admin/${k}">${l}</a>`).join("")}</div>
      <div id="ap"></div>
      <div class="savebar"><span class="st" id="savest">${dirty ? "Cambios sin guardar" : "Sin cambios pendientes"}</span><button class="btn" id="discard">Descartar</button><button class="btn btn-primary" id="save">${icon("check")} Guardar cambios</button></div>`;
    const draw = () => {
      const ap = $("#ap"); ap.innerHTML = `<div class="fade">${P[tab](sub)}</div>`;
      bindInputs(ap); bindLists(ap, draw);
      $$("[data-color]", ap).forEach((pk) => $$("button", pk).forEach((b) => b.addEventListener("click", () => { set(draft, pk.dataset.color, b.dataset.c); $$("button", pk).forEach((x) => x.classList.toggle("on", x === b)); markDirty(); })));
      ap.addEventListener("input", () => { const t = $("#rubTotal"); if (t && tab === "raps") { const r = draft.raps[Number(sub || 0)]; t.textContent = (r.evidencia.rubrica || []).reduce((a, x) => a + (Number(x[1]) || 0), 0); } });
      const add = $("#addRap"); if (add) add.addEventListener("click", () => { const n = draft.raps.length + 1; draft.raps.push({ id: "rap" + Date.now().toString(36), n, color: ["#6C3CE1", "#0EA5A4", "#F2545B", "#F5A524", "#2563EB", "#DB2777"][(n - 1) % 6], corto: "Nuevo RAP", titulo: "", descripcion: "", sesion: { fecha: "", horaInicio: "19:00", horaFin: "21:00", enlace: "", grabacion: "" }, materiales: [{ tipo: "estudio", titulo: `Material de estudio RAP ${n}`, url: "", desc: "" }, { tipo: "guia", titulo: `Guía de aprendizaje RAP ${n}`, url: "", desc: "" }], videos: [], recursos: [], actividades: [], evidencia: { formulario: "", respuestas: "", nombre: `EV${n}`, fecha: "", hora: "23:59", enlace: "", descripcion: "", rubrica: [] } }); markDirty(); location.hash = `#/admin/raps/${draft.raps.length - 1}`; });
      const mv = (d) => { const i = Number(sub || 0), j = i + d; if (j < 0 || j >= draft.raps.length) return; [draft.raps[i], draft.raps[j]] = [draft.raps[j], draft.raps[i]]; draft.raps.forEach((x, k) => (x.n = k + 1)); markDirty(); location.hash = `#/admin/raps/${j}`; };
      const ml = $("#mvRapL"); if (ml) ml.addEventListener("click", () => mv(-1)); const mr = $("#mvRapR"); if (mr) mr.addEventListener("click", () => mv(1));
      if (tab === "calificaciones") gradesPanel($("#ap"));
      if (tab === "entregas") subsPanel($("#ap"), sub);
      if (tab === "actividades") resultsPanel($("#ap"));
      $$("[data-newact]", ap).forEach((b) => b.addEventListener("click", () => { const i = Number(b.dataset.newact); const r = draft.raps[i]; r.actividades = r.actividades || []; r.actividades.push(AT().newActivity($("#newActType").value)); markDirty(); location.hash = `#/admin/act/${i}-${r.actividades.length - 1}`; }));
      const ca = $("#copyAcc"); if (ca) ca.addEventListener("click", () => { navigator.clipboard.writeText(ca.dataset.text).then(() => toast("Mensaje copiado", "ok")); });
      const at = $("#actTipo"); if (at) at.addEventListener("change", () => { const [i, j] = String(sub).split("-").map(Number); const x = draft.raps[i].actividades[j]; x.tipo = at.value; x.items = AT().TEMPLATES[x.tipo](); markDirty(); draw(); });
      const pv = $("#actPrev"); if (pv) pv.addEventListener("click", () => { const [i, j] = String(sub).split("-").map(Number); AT().open(draft.raps[i].actividades[j], draft.raps[i], { preview: true }); });
      const del = $("#delRap"); if (del) del.addEventListener("click", async () => { if (await confirmDialog("Quitar RAP", "Se quita este RAP del borrador con todo su contenido. ¿Continuar?", "Quitar", true)) { draft.raps.splice(Number(sub || 0), 1); markDirty(); location.hash = "#/admin/raps/0"; } });
      const exp = $("#exp"); if (exp) exp.addEventListener("click", () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" })); a.download = `curso-${(draft.info.marca || "curso").toLowerCase().replace(/\W+/g, "-")}.json`; a.click(); });
      const imp = $("#imp"); if (imp) imp.addEventListener("change", async (e) => { const file = e.target.files[0]; if (!file) return; try { const data = JSON.parse(await file.text()); if (!data.info || !Array.isArray(data.raps)) throw new Error("El archivo no tiene el formato esperado."); draft = data; markDirty(); toast("Contenido importado. Revisa y guarda.", "ok"); location.hash = "#/admin/curso"; } catch (err) { toast(err.message, "bad"); } });
      const rst = $("#rst"); if (rst) rst.addEventListener("click", async () => { if (await confirmDialog("Restablecer", "Se reemplaza todo el contenido por el de ejemplo. ¿Continuar?", "Restablecer", true)) { draft = B.defaults(); markDirty(); toast("Contenido restablecido en el borrador. Guarda para aplicarlo.", "ok"); location.hash = "#/admin/curso"; } });
    };
    draw();
    $("#save").addEventListener("click", async () => {
      const b = $("#save"); b.disabled = true;
      try { draft.raps.forEach((x, k) => { x.n = k + 1; if (!x.id) x.id = "rap" + (k + 1); }); if (gDirty && grades) { await B.saveGrades(grades); gDirty = false; } await B.saveCourse(draft); draft = null; dirty = false; editing = false; toast("Cambios guardados", "ok"); $("#savest").textContent = "Guardado"; window.App.remountShell(); window.App.route(); }
      catch (err) { toast("No se pudo guardar: " + err.message, "bad"); } b.disabled = false;
    });
    $("#discard").addEventListener("click", async () => { if (!dirty || await confirmDialog("Descartar cambios", "Se pierden los cambios sin guardar.", "Descartar", true)) { draft = null; ensure(); grades = null; gDirty = false; dirty = false; draw(); $("#savest").textContent = "Sin cambios pendientes"; } });
  }
  window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#/admin")) { if (!dirty) draft = null; editing = false; } });
  window.addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
  window.Admin = { view, editing: () => editing && dirty, readTable: readFile };
})();
