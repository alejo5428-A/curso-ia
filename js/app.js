/* =====================================================================
   APLICACIÓN · rutas y páginas
   ===================================================================== */
(function () {
  const U = window.UI;
  const { icon, esc, linkify, $, $$, avatar, firstName, fDate, fShort, fTime, fDay, fMon, fWeekday, cap, ago, toast, modal, confirmDialog, rapOf } = U;
  const B = window.Backend, TM = window.TIPOS_MATERIAL;
  const root = document.getElementById("app");
  let cleanups = [], shellOn = false, anns = [], annUnsub = null, dmThreads = [], dmUnsub = null;

  const C = () => B.course;
  const user = () => B.user;
  const now = () => Date.now();
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const onCleanup = (fn) => cleanups.push(fn);
  const runCleanups = () => { cleanups.forEach((f) => { try { f(); } catch (e) {} }); cleanups = []; };
  const dt = (fecha, hora) => new Date(`${fecha}T${hora || "00:00"}:00${C().info.utc || "-05:00"}`).getTime();
  const sesStart = (r) => dt(r.sesion.fecha, r.sesion.horaInicio);
  const sesEnd = (r) => dt(r.sesion.fecha, r.sesion.horaFin || r.sesion.horaInicio);
  const evDue = (r) => dt(r.evidencia.fecha, r.evidencia.hora || "23:59");
  const nextSession = () => [...C().raps].filter((r) => r.sesion.fecha).sort((a, b) => sesStart(a) - sesStart(b)).find((r) => sesEnd(r) > now());
  const isLive = (r) => r && now() >= sesStart(r) - 15 * 6e4 && now() <= sesEnd(r);
  const extOf = (url) => (String(url).split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
  const TR = window.TIPOS_RECURSO;
  function applyBrand() {
    const hex = (C().info.colorPrincipal || "#2F6FED").replace("#", ""); if (!/^[0-9a-f]{6}$/i.test(hex)) return;
    const n = parseInt(hex, 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const mix = (c, t, k) => Math.round(c + (t - c) * k), toHex = (r2, g2, b2) => "#" + [r2, g2, b2].map((x) => x.toString(16).padStart(2, "0")).join("");
    const st = document.documentElement.style;
    st.setProperty("--brand", "#" + hex); st.setProperty("--brand-ink", toHex(mix(r, 0, .18), mix(g, 0, .18), mix(b, 0, .18)));
    const col = C().info.colores || {}, D = { sesion: "#3B82F6", material: "#22C55E", videos: "#A855F7", enlaces: "#14B8A6", evidencia: "#F59E0B" };
    Object.keys(D).forEach((k) => st.setProperty("--c-" + k, /^#[0-9a-f]{6}$/i.test(col[k] || "") ? col[k] : D[k]));
    st.setProperty("--tint", { ninguno: 0, suave: 10, medio: 18 }[C().info.intensidad || "suave"] ?? 10);
    st.setProperty("--brand-soft", document.documentElement.dataset.theme === "dark" ? toHex(mix(r, 20, .72), mix(g, 26, .72), mix(b, 40, .72)) : toHex(mix(r, 255, .88), mix(g, 255, .88), mix(b, 255, .88)));
  }
  const estadoOf = (g) => { if (!g || g.estado === "pendiente" || (!g.estado && (g.nota == null || g.nota === ""))) return ["pend", "Pendiente"]; return g.estado === "aprobado" ? ["ok", "Aprobado"] : ["no", "No aprobado"]; };

  /* ---------- Eventos del cronograma ---------- */
  function allEvents() {
    const L = [];
    (C().hitos || []).forEach((h) => { if (h.fecha) L.push({ kind: "hito", title: h.titulo, start: dt(h.fecha, h.hora), end: dt(h.fecha, h.hora) + 36e5, desc: h.desc, color: "#64748B", icon: "🚩", link: h.enlace }); });
    C().raps.forEach((r) => {
      if (r.sesion.fecha) L.push({ kind: "sesion", rap: r, title: `Sesión en vivo · RAP ${r.n}: ${r.corto}`, start: sesStart(r), end: sesEnd(r), desc: `Clase por Microsoft Teams · ${U.fTime(sesStart(r))} a ${U.fTime(sesEnd(r))}`, color: r.color, icon: "🎥", link: r.sesion.enlace });
      if (r.evidencia.fecha) L.push({ kind: "evidencia", rap: r, title: "Entrega " + r.evidencia.nombre, start: evDue(r) - 36e5, end: evDue(r), when: evDue(r), desc: "Se entrega en la plataforma (Drive).", color: r.color, icon: "📤", link: r.evidencia.enlace });
    });
    return L.map((e) => ({ ...e, when: e.when || e.start })).sort((a, b) => a.when - b.when);
  }

  /* ---------- Materiales y videos ---------- */
  function openMaterial(m) {
    if (!m.url) { toast("El instructor aún no ha publicado este archivo."); return; }
    const ext = extOf(m.url);
    if (ext === "pdf" && !/drive\.google|docs\.google/.test(m.url)) {
      modal({ title: esc(m.titulo), wide: true, body: `<iframe class="pdf-frame" src="${esc(m.url)}#view=FitH" title="${esc(m.titulo)}"></iframe>`, foot: `<a class="btn" href="${esc(m.url)}" target="_blank" rel="noopener">${icon("external")} Abrir en otra pestaña</a><a class="btn btn-primary" href="${esc(m.url)}" download>${icon("download")} Descargar</a>` });
    } else window.open(m.url, "_blank", "noopener");
  }
  const matRow = (m, r) => {
    const T = TM[m.tipo] || TM.otro; const ext = extOf(m.url).toUpperCase();
    return `<div class="mat ${m.url ? "" : "pending"}">
      <div class="fi">${T.icono}</div>
      <div class="body"><h4>${esc(m.titulo)}</h4><p>${T.nombre}${ext && ext.length <= 4 ? " · " + ext : ""}${r ? ` · <span style="color:${r.color};font-weight:600">RAP ${r.n}</span>` : ""}${m.desc ? " · " + esc(m.desc) : ""}${m.url ? "" : " · <i>Próximamente</i>"}</p></div>
      <button class="btn btn-sm ${m.url ? "btn-soft" : ""}" data-mat="${esc(m.url)}" data-title="${esc(m.titulo)}" ${m.url ? "" : "disabled"}>${icon(m.url && extOf(m.url) === "pdf" ? "eye" : "external")} Abrir</button></div>`;
  };
  const actRow = (m, kind, r) => {
    const T = kind === "recurso" ? (TR[m.tipo] || TR.enlace) : (TM[m.tipo] || TM.otro); const ext = extOf(m.url).toUpperCase();
    return `<div class="act ${m.url ? "" : "pending"}" title="${esc(m.desc || "")}"><div class="ai">${T.icono}</div><div class="ab"><b>${esc(m.titulo)}</b><span>${T.nombre}${ext && ext.length <= 4 && kind !== "recurso" ? " · " + ext : ""}${r ? ` · RAP ${r.n}` : ""}${m.url ? "" : " · Próximamente"}</span></div>
      <button class="btn btn-sm ${m.url ? "btn-soft" : ""}" data-mat="${esc(m.url)}" data-title="${esc(m.titulo)}" ${m.url ? "" : "disabled"}>${icon(m.url && extOf(m.url) === "pdf" ? "eye" : "external")} Abrir</button></div>`;
  };
  const bindMats = (scope) => $$("[data-mat]", scope).forEach((b) => b.addEventListener("click", () => openMaterial({ url: b.dataset.mat, titulo: b.dataset.title })));
  const vidCard = (v, color) => {
    const id = U.ytId(v.url);
    return `<div class="card vid card-hover"><div class="vid-thumb" style="--c:${color || "#334155"}" data-vid="${esc(v.url)}" data-title="${esc(v.titulo)}">${id ? `<img loading="lazy" alt="" src="https://i.ytimg.com/vi/${id}/hqdefault.jpg">` : ""}<span class="play">${icon(v.url ? "play" : "clock")}</span></div>
      <div class="body"><h4 class="mb0">${esc(v.titulo)}</h4><p>${esc(v.desc || "")}${v.url ? "" : "<i>Próximamente</i>"}</p></div></div>`;
  };
  const bindVids = (scope) => $$("[data-vid]", scope).forEach((el) => el.addEventListener("click", () => {
    const url = el.dataset.vid, id = U.ytId(url);
    if (!url) return toast("Este video aún no está publicado.");
    if (id) modal({ title: esc(el.dataset.title), wide: true, body: `<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="${esc(el.dataset.title)}"></iframe></div>` });
    else window.open(url, "_blank", "noopener");
  }));

  /* ================================ PÚBLICO ================================ */
  const logo = (sub = true) => `<a class="logo" href="#/"><span class="logo-mark">${icon("book")}</span><span>${esc(C().info.marca)}${sub ? `<small>${esc(C().info.horas)} horas</small>` : ""}</span></a>`;
  const themeBtn = () => `<button class="btn-icon btn" data-theme-toggle aria-label="Cambiar tema">${icon(document.documentElement.dataset.theme === "dark" ? "sun" : "moon")}</button>`;
  function bindTheme(scope) { $$("[data-theme-toggle]", scope).forEach((b) => b.addEventListener("click", () => { const nt = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = nt; try { localStorage.setItem("iap_theme", nt); } catch (e) {} applyBrand(); $$("[data-theme-toggle]").forEach((x) => (x.innerHTML = icon(nt === "dark" ? "sun" : "moon"))); })); }

  const regOpen = () => String(C().info.registroAbierto || "no").toLowerCase() === "si";
  function viewLanding() {
    const I = C().info, s = nextSession();
    root.innerHTML = `<header class="pub-nav"><div class="in">${logo()}<div class="flex" style="margin-left:auto">${themeBtn()}<a class="btn btn-sm hide-sm" href="#/ingresar">Ingresar</a>${regOpen() ? `<a class="btn btn-primary btn-sm" href="#/registro">Crear cuenta</a>` : ""}</div></div></header>
      <section class="hero"><div class="container in">
        <div><span class="kicker">Formación complementaria virtual</span><h1>${esc(I.nombre)}</h1><p class="lead">${esc(I.descripcion)}</p>
          <div class="flex wrap"><a class="btn btn-primary btn-lg" href="#/ingresar">Ingresar al curso</a>${regOpen() ? `<a class="btn btn-lg" href="#/registro">Crear mi cuenta</a>` : ""}</div></div>
        <div class="hero-side"><div class="row">${icon("user")}<div><b>${esc(I.instructor)}</b><div class="xs muted">${esc(I.rolInstructor)}</div></div></div>
          <div class="row">${icon("calendar")}<span>${fDate(dt(I.inicio, "12:00"))} al ${fDate(dt(I.fin, "12:00"))}</span></div>
          <div class="row">${icon("clock")}<span>${esc(I.horas)} horas · ${C().raps.length} resultados de aprendizaje</span></div>
          ${s ? `<div class="row">${icon("video")}<span>Próxima sesión en vivo: ${cap(fDate(sesStart(s)))}, ${fTime(sesStart(s))}</span></div>` : ""}</div>
      </div></section>
      <section class="section"><div class="container"><span class="kicker">Ruta de aprendizaje</span><h2>Resultados de aprendizaje</h2>
        <div class="grid g4">${C().raps.map((r) => `<div class="rap-card" style="--c:${r.color}"><span class="num">RAP ${r.n}</span><h3>${esc(r.corto)}</h3></div>`).join("")}</div></div></section>
      <footer class="pub-footer"><div class="container">${esc(I.marca)} · ${esc(I.nombre)} · ${esc(I.instructor)}</div></footer>`;
    bindTheme(root);
  }
  function authLayout(inner) {
    root.innerHTML = `<div class="auth"><div class="auth-box fade"><div class="flex between mb">${logo(false)}${themeBtn()}</div>${inner}</div></div>`;
    bindTheme(root);
    $$(".pass-wrap button", root).forEach((b) => b.addEventListener("click", () => { const i = b.previousElementSibling; i.type = i.type === "password" ? "text" : "password"; b.innerHTML = icon(i.type === "password" ? "eye" : "eyeoff"); }));
  }
  const passField = (id, label, ac) => `<div class="field"><label for="${id}">${label}</label><div class="pass-wrap"><input class="input" id="${id}" type="password" autocomplete="${ac}" required minlength="8"><button type="button" aria-label="Mostrar contraseña">${icon("eye")}</button></div></div>`;
  const busy = (btn, on, label) => { btn.disabled = on; btn.innerHTML = on ? "Un momento…" : label; };

  function viewLogin() {
    authLayout(`<div class="card"><h2>Ingresar</h2><p class="muted small">${esc(C().info.nombre)}</p><form id="f" novalidate><div id="err"></div>
      <div class="field"><label for="em">Correo (tu usuario)</label><input class="input" id="em" type="email" autocomplete="email" required></div>${passField("pw", "Contraseña (tu número de documento)", "current-password")}
      <div class="flex between mb"><span></span><a href="#/recuperar" class="small">¿Olvidaste tu contraseña?</a></div><button class="btn btn-primary btn-block btn-lg" id="go">Ingresar</button></form></div>
      ${regOpen() ? `<p class="auth-switch">¿Aún no tienes cuenta? <a href="#/registro">Regístrate</a></p>` : `<p class="auth-switch">Usa el correo con el que te inscribiste. Tu contraseña inicial es tu número de documento, sin puntos ni espacios.</p>`}`);
    $("#f").addEventListener("submit", async (e) => { e.preventDefault(); const go = $("#go"); busy(go, true); try { await B.login($("#em").value, $("#pw").value.trim()); } catch (err) { $("#err").innerHTML = `<div class="form-error">${esc(err.message)}</div>`; busy(go, false, "Ingresar"); } });
  }
  function viewRegister() {
    const code = !!C().info.codigoInscripcion;
    authLayout(`<div class="card"><h2>Crear cuenta</h2><p class="muted small">Usa tu correo personal.</p><form id="f" novalidate><div id="err"></div>
      <div class="field"><label for="nm">Nombre completo</label><input class="input" id="nm" autocomplete="name" required></div>
      <div class="row2"><div class="field"><label for="fi">Número de ficha</label><input class="input" id="fi" inputmode="numeric" required></div><div class="field"><label for="mu">Municipio <span class="muted">(opcional)</span></label><input class="input" id="mu"></div></div>
      <div class="field"><label for="em">Correo</label><input class="input" id="em" type="email" autocomplete="email" required></div>
      ${passField("pw", "Contraseña (mínimo 8 caracteres)", "new-password")}
      <div class="field"><label for="pw2">Confirma la contraseña</label><input class="input" id="pw2" type="password" autocomplete="new-password" required></div>
      ${code ? `<div class="field"><label for="cd">Código del curso</label><input class="input" id="cd" required autocomplete="off"><span class="hint">Te lo entrega el instructor.</span></div>` : ""}
      <label class="check"><input type="checkbox" id="c1"> <span>Acepto las normas de convivencia y autorizo el <a href="#" data-datos>tratamiento de mis datos</a> para la gestión del curso.</span></label>
      <label class="check"><input type="checkbox" id="c2"> <span>Si soy menor de edad, cuento con la autorización de mi representante o acudiente.</span></label>
      <button class="btn btn-primary btn-block btn-lg mt" id="go">Crear mi cuenta</button></form></div>
      <p class="auth-switch">¿Ya tienes cuenta? <a href="#/ingresar">Ingresa</a></p>`);
    $("[data-datos]").addEventListener("click", (e) => { e.preventDefault(); showDatos(); });
    $("#f").addEventListener("submit", async (e) => {
      e.preventDefault(); const go = $("#go"); const err = (m) => { $("#err").innerHTML = `<div class="form-error">${m}</div>`; };
      const nm = $("#nm").value.trim().replace(/\s+/g, " "), fi = $("#fi").value.trim(), em = $("#em").value.trim(), pw = $("#pw").value;
      if (nm.split(" ").length < 2) return err("Escribe tu nombre completo.");
      if (!fi) return err("Escribe tu número de ficha.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) return err("El correo no es válido.");
      if (pw.length < 8) return err("La contraseña debe tener al menos 8 caracteres.");
      if (pw !== $("#pw2").value) return err("Las contraseñas no coinciden.");
      if (code && norm($("#cd").value.trim()) !== norm(C().info.codigoInscripcion)) return err("El código del curso no es correcto.");
      if (!$("#c1").checked || !$("#c2").checked) return err("Debes marcar las dos casillas para continuar.");
      busy(go, true);
      try { await B.register({ name: nm, email: em, password: pw, ficha: fi, municipio: $("#mu").value }); } catch (ex) { err(esc(ex.message)); busy(go, false, "Crear mi cuenta"); }
    });
  }
  function viewRecover() {
    authLayout(`<div class="card"><h2>Recuperar contraseña</h2><p class="muted small">Te enviaremos un enlace al correo registrado.</p><form id="f" novalidate><div id="err"></div><div class="field"><label for="em">Correo</label><input class="input" id="em" type="email" required></div><button class="btn btn-primary btn-block" id="go">Enviar enlace</button></form></div><p class="auth-switch"><a href="#/ingresar">← Volver</a></p>`);
    $("#f").addEventListener("submit", async (e) => { e.preventDefault(); const go = $("#go"); busy(go, true); try { await B.resetPassword($("#em").value); $("#err").innerHTML = `<div class="note">${icon("check")}<div>Revisa tu correo (también la carpeta de spam).</div></div>`; } catch (ex) { $("#err").innerHTML = `<div class="form-error">${esc(ex.message)}</div>`; } busy(go, false, "Enviar enlace"); });
  }
  function showDatos() { modal({ title: "Tratamiento de datos personales", body: `<p>Al crear tu cuenta, el instructor recoge tu nombre, correo, número de ficha, municipio (opcional) y los mensajes que publiques, únicamente para la gestión del curso. No se comparten con terceros.</p><p>Puedes conocer, actualizar, rectificar o pedir la eliminación de tus datos escribiéndole al instructor (Ley 1581 de 2012).</p><p class="mb0 muted small">No compartas documentos de identidad, direcciones, teléfonos ni contraseñas en la plataforma.</p>` }); }

  /* ================================ ESTRUCTURA ================================ */
  const NAV = () => {
    const inst = B.isInstructor();
    const g = [
      ["Curso", [["inicio", "Área de trabajo", "home"], ...C().raps.map((r) => [`rap/${r.n}`, `RAP ${r.n} · ${r.corto}`, null, r.color]), ["biblioteca", "Biblioteca", "folder"], ["videos", "Videos", "video"], ["cronograma", "Cronograma", "calendar"], [inst ? "admin/calificaciones" : "calificaciones", inst ? "Calificaciones" : "Mis calificaciones", "star"]]],
      ["Comunidad", [["chat", "Chat general", "chat"], ["mensajes", inst ? "Mensajes privados" : "Mensajes al instructor", "mail", null, "dm"], ["anuncios", "Anuncios", "megaphone", null, "ann"], ["participantes", "Participantes", "users"]]],
      ["Más", [["ayuda", "Ayuda", "help"], ["perfil", "Mi perfil", "user"]]]
    ];
    if (inst) g.push(["Administración", [["admin", "Administrar curso", "settings"], ["aprendices", "Aprendices", "users"], ["moderacion", "Moderación", "flag"]]]);
    return g;
  };
  const unreadAnn = () => { const seen = Number(localStorage.getItem("iap_annseen_" + user().uid) || 0); return anns.filter((a) => a.ts > seen).length; };
  const unreadDM = () => B.isInstructor() ? dmThreads.filter((t) => t.lastFrom === "aprendiz" && (t.lastTs || 0) > (t.readInst || 0)).length : dmThreads.filter((t) => t.uid === user().uid && t.lastFrom === "instructor" && (t.lastTs || 0) > (t.readUser || 0)).length;
  function updateBadges() { const set = (k, n) => $$(`[data-badge="${k}"]`).forEach((b) => { b.textContent = n; b.classList.toggle("hide", !n); }); set("ann", unreadAnn()); set("dm", unreadDM()); }

  function mountShell() {
    const u = user();
    root.innerHTML = `<div class="shell">
      <aside class="sidebar" id="sidebar">${logo()}${NAV().map(([g, items]) => `<div class="nav-group"><span>${g}</span>${items.map(([h, l, ic, col, badge]) => `<a class="nav-link" href="#/${h}" data-nav="${h}">${ic ? icon(ic) : `<span class="dot" style="background:${col};margin:0 .2rem"></span>`}<span>${esc(l)}</span>${badge ? `<span class="badge hide" data-badge="${badge}">0</span>` : ""}</a>`).join("")}</div>`).join("")}</aside>
      <div class="backdrop" id="backdrop"></div>
      <div class="main">${B.preview ? `<div class="banner" id="pvbanner">${icon("eye")}<span><b>Vista de aprendiz (muestra):</b> así ven la plataforma los participantes.</span><button class="btn btn-sm" id="pvclose">Cerrar vista</button></div>` : ""}
        <header class="topbar"><button class="btn-icon btn menu-btn" id="menuBtn" aria-label="Menú">${icon("menu")}</button><span class="title" id="ttl"></span>
          <div class="top-actions">            <a class="btn btn-teams btn-sm hide-sm" href="${esc(U.teamsLink())}" target="_blank" rel="noopener">${icon("teams")} Teams</a>${themeBtn()}
            <a class="btn-icon btn" href="#/anuncios" aria-label="Anuncios" style="position:relative">${icon("bell")}<span class="badge hide" data-badge="ann" style="position:absolute;top:2px;right:0;min-width:16px;height:16px;font-size:.6rem">0</span></a>
            <div style="position:relative"><button class="user-btn" id="userBtn">${avatar(u, "sm")}<span class="nm">${esc(firstName(u.name))}</span></button></div></div></header>
        <main class="view" id="view"></main></div></div>`;
    shellOn = true;
    $("#menuBtn").addEventListener("click", () => document.body.classList.toggle("nav-open"));
    $("#backdrop").addEventListener("click", () => document.body.classList.remove("nav-open"));
    $("#userBtn").addEventListener("click", (e) => { e.stopPropagation(); userMenu(); });
    bindTheme(root);
    if (annUnsub) annUnsub(); annUnsub = B.subscribeAnnouncements((l) => { anns = l; updateBadges(); const live = $("[data-ann-live]"); if (live) { live.innerHTML = annList(Number(live.dataset.annLive) || 50); bindAnnDel(); } });
    if (dmUnsub) dmUnsub(); dmUnsub = B.subscribeDMThreads((l) => { dmThreads = l; updateBadges(); const side = $("[data-dm-threads]"); if (side) renderThreads(side); });
    const pvc = $("#pvclose"); if (pvc) pvc.addEventListener("click", () => { sessionStorage.removeItem("iap_preview"); window.close(); setTimeout(() => { location.href = location.pathname + "#/admin"; }, 150); });
  }
  function userMenu() {
    const host = $("#userBtn").parentElement; const old = $(".dropdown", host); if (old) return old.remove();
    const u = user(); const d = document.createElement("div"); d.className = "dropdown";
    d.innerHTML = `<div class="head"><div class="flex">${avatar(u)}<div style="min-width:0"><b style="display:block">${esc(u.name)}</b><span class="xs muted">${B.isInstructor() ? "Instructor · administrador" : "Ficha " + esc(u.ficha || "—")}</span></div></div></div><a href="#/perfil">${icon("user")} Mi perfil</a>${B.isInstructor() ? `<a href="#/admin">${icon("settings")} Administrar curso</a>` : ""}<a href="#/ayuda">${icon("help")} Ayuda</a><button data-logout>${icon("logout")} Cerrar sesión</button>`;
    host.appendChild(d);
    d.querySelector("[data-logout]").addEventListener("click", async () => { await B.logout(); location.hash = "#/"; });
    const off = (e) => { if (!d.contains(e.target)) { d.remove(); document.removeEventListener("click", off); } }; setTimeout(() => document.addEventListener("click", off), 0);
    d.addEventListener("click", (e) => { if (e.target.closest("a")) d.remove(); });
  }
  const setActive = (path) => { const exact = $$("[data-nav]").some((a) => a.dataset.nav === path); $$("[data-nav]").forEach((a) => a.classList.toggle("on", path === a.dataset.nav || (!exact && a.dataset.nav !== "inicio" && path.startsWith(a.dataset.nav + "/")))); };
  const head = (title, sub = "", right = "") => `<div class="page-head fade"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div>${right ? `<div class="flex wrap">${right}</div>` : ""}</div>`;

  /* ================================ INICIO ================================ */
  function annList(n) {
    if (!anns.length) return `<div class="empty small"><span class="big">📭</span>Aún no hay anuncios.</div>`;
    return anns.slice(0, n).map((a) => `<div class="list-row" style="align-items:flex-start"><span class="avatar sm" style="background:var(--brand)">${icon("megaphone")}</span><div style="flex:1;min-width:0"><b>${esc(a.title)}</b><div class="small" style="white-space:pre-wrap">${linkify(a.body)}</div><span class="xs muted">${esc(a.author || "")} · ${ago(a.ts)}</span></div>${B.isInstructor() && n > 3 ? `<button class="btn btn-icon" data-del-ann="${esc(a.id)}" aria-label="Borrar">${icon("trash")}</button>` : ""}</div>`).join("");
  }
  const bindAnnDel = () => $$("[data-del-ann]").forEach((b) => b.addEventListener("click", async () => { if (await confirmDialog("Borrar anuncio", "¿Borrar este anuncio?", "Borrar", true)) { await B.deleteAnnouncement(b.dataset.delAnn); toast("Anuncio borrado", "ok"); } }));


  /* ---------- entregas (Drive) y actividades interactivas ---------- */
  const driveOf = (r) => (r.evidencia.enlaceDrive || C().info.carpetaDrive || "").trim();
  const ACT = () => window.Activities;
  const actsOfRap = (r) => (C().info.actividadesActivas === "si" ? (r.actividades || []).filter((x) => x && x.id) : []);
  const actRows = (r) => actsOfRap(r).map((x) => { const T = ACT().TIPOS[x.tipo] || ACT().TIPOS.quiz; return `<div class="act"><div class="ai">${T.icono}</div><div class="ab"><b>${esc(x.titulo)}</b><span>${T.nombre}</span></div><span class="state pend" data-actstat="${esc(x.id)}">Sin intentar</span><button class="btn btn-sm btn-soft" data-act="${esc(r.id)}|${esc(x.id)}">${icon("play")} Iniciar</button></div>`; }).join("");
  async function paintActStats(scope) {
    if (!$$("[data-actstat]", scope).length) return;
    let res = {}; try { res = await B.myResults(); } catch (e) { return; }
    $$("[data-actstat]", scope).forEach((el) => { const x = res[el.dataset.actstat]; if (!x) return; el.className = "state " + (x.passed ? "ok" : "no"); el.textContent = `${x.passed ? "Aprobada" : "No aprobada"} · mejor ${x.best}%`; });
  }
  function bindActs(scope) {
    $$("[data-act]", scope).forEach((b) => b.addEventListener("click", () => { const [rid, aid] = b.dataset.act.split("|"); const r = C().raps.find((x) => x.id === rid); const act = r && actsOfRap(r).find((x) => x.id === aid); if (act) ACT().open(act, r, { onSaved: () => paintActStats(scope) }); }));
    paintActStats(scope);
  }
  const subState = (r, sub) => { const rev = sub && sub.rev; if (rev && rev.estado) return rev.estado === "aprobado" ? ["ok", `Aprobada${rev.nota !== "" && rev.nota != null ? " · " + rev.nota : ""}`] : rev.estado === "no_aprobado" ? ["no", `No aprobada${rev.nota !== "" && rev.nota != null ? " · " + rev.nota : ""}`] : ["pend", "En revisión"]; return ["pend", "Sin calificar"]; };
  function evidenceBox(r, scope) {
    const box = $("#evbox-" + r.n, scope); if (!box) return;
    B.myGrades().then((g) => {
      const x = g && g.raps ? g.raps[r.id] || g.raps["rap" + r.n] : null; const st = estadoOf(x);
      box.innerHTML = `<div class="flex between wrap"><b class="small">Tu calificación${x && x.nota !== "" && x.nota != null ? " · " + esc(x.nota) : ""}</b><span class="state ${st[0]}">${st[1]}</span></div>${x && x.obs ? `<p class="small mb0 mt">${esc(x.obs)}</p>` : ""}`;
    }).catch(() => { box.innerHTML = ""; });
  }
  const formEmbed = (url) => { url = String(url || "").trim(); if (!/^https:\/\/docs\.google\.com\/forms\//.test(url)) return ""; return url + (url.includes("?") ? "&" : "?") + "embedded=true"; };

  function viewInicio(v) {
    const u = user(), s = nextSession(), I = C().info;
    const evs = allEvents().filter((x) => x.end > now()).slice(0, 5);
    const open = localStorage.getItem("iap_open_rap") || (s ? String(s.n) : String((C().raps[0] || {}).n));
    const actsOf = (r) => {
      const vids = (r.sesion.grabacion ? [{ titulo: "Grabación de la sesión en vivo", url: r.sesion.grabacion, desc: "" }] : []).concat(r.videos || []);
      return `<div class="acts-h">Sesión en vivo</div>
        <div class="act"><div class="ai">🎥</div><div class="ab"><b>${r.sesion.fecha ? cap(fDate(sesStart(r))) + " · " + fTime(sesStart(r)) + " a " + fTime(sesEnd(r)) : "Fecha por confirmar"}</b><span>Microsoft Teams</span></div><a class="btn btn-teams btn-sm" href="${esc(U.teamsLink(r.sesion.enlace))}" target="_blank" rel="noopener">${icon("teams")} ${isLive(r) ? "Unirme" : "Enlace"}</a></div>
        ${(r.materiales || []).length ? `<div class="acts-h">Material de formación</div>${r.materiales.map((m) => actRow(m)).join("")}` : ""}
        ${vids.length ? `<div class="acts-h">Videos</div>${vids.map((x) => `<div class="act ${x.url ? "" : "pending"}"><div class="ai">▶️</div><div class="ab"><b>${esc(x.titulo)}</b><span>${esc(x.desc || "Video")}${x.url ? "" : " · Próximamente"}</span></div><button class="btn btn-sm ${x.url ? "btn-soft" : ""}" data-vid="${esc(x.url)}" data-title="${esc(x.titulo)}" ${x.url ? "" : "disabled"}>${icon("play")} Ver</button></div>`).join("")}` : ""}
        ${(r.recursos || []).length ? `<div class="acts-h">Actividades de aprendizaje</div>${r.recursos.map((x) => actRow(x, "recurso")).join("")}` : ""}
        ${actsOfRap(r).length ? `<div class="acts-h">Actividades interactivas</div>${actRows(r)}` : ""}
        <div class="acts-h">Evidencia</div>
        <div class="act"><div class="ai">📤</div><div class="ab"><b>${esc(r.evidencia.nombre)}</b><span>${r.evidencia.fecha ? "Entrega hasta " + cap(fDate(evDue(r))) + ", " + fTime(evDue(r)) : "Fecha por confirmar"}</span></div><span class="state pend" data-evstat="${r.id}">Sin calificar</span><a class="btn btn-primary btn-sm" href="#/rap/${r.n}#evidencia">${icon("upload")} Entregar</a></div>`;
    };
    v.innerHTML = `<div class="course-banner fade"><div class="top"><span class="xs" style="opacity:.85;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${esc(I.marca)}${I.codigo ? " · Código " + esc(I.codigo) : ""}</span><h1>${esc(I.nombre)}</h1><p>${esc(I.instructor)} · ${esc(I.rolInstructor)}</p></div>
        <div class="meta"><span>${icon("calendar")} ${fDate(dt(I.inicio, "12:00"))} – ${fDate(dt(I.fin, "12:00"))}</span><span>${icon("clock")} ${esc(I.horas)} horas</span><span>${icon("route")} ${C().raps.length} resultados de aprendizaje</span>${s ? `<span>${icon("video")} ${isLive(s) ? "<b>En vivo ahora</b>" : "Próxima sesión: " + cap(fDate(sesStart(s))) + ", " + fTime(sesStart(s))}</span>` : ""}</div></div>
      <div class="grid split mt">
        <div>
          <details class="topic" ${localStorage.getItem("iap_open_info") === "1" ? "open" : ""} data-topic="info"><summary style="--c:var(--line-2)"><div class="ai" style="width:38px;height:38px;border-radius:9px;display:grid;place-items:center;background:var(--surface-2);border:1px solid var(--line)">ℹ️</div><div class="tt"><b>Información del programa</b><span>Presentación, competencia y requisitos</span></div>${icon("down", "chev")}</summary>
            <div class="in"><p class="pres" style="margin-top:.8rem">${esc(I.presentacion || "")}</p>${I.competencia ? `<div class="acts-h">Competencia</div><p class="small">${esc(I.competencia)}</p>` : ""}${I.requisitos ? `<div class="acts-h">Requisitos</div><p class="small">${esc(I.requisitos)}</p>` : ""}<div class="acts-h">Evaluación</div><p class="small mb0">${esc(I.mensajeEntregas)} ${esc(I.notaAprobacion)}</p></div></details>
          ${C().raps.map((r) => `<details class="topic" ${String(r.n) === open ? "open" : ""} data-topic="${r.n}" style="--c:${r.color}"><summary style="--c:${r.color}"><div class="ai" style="width:38px;height:38px;border-radius:9px;display:grid;place-items:center;background:${r.color};color:#fff;font-weight:700;font-family:var(--font-h)">${r.n}</div><div class="tt"><b>RAP ${r.n} · ${esc(r.corto)}</b><span>${esc(r.titulo)}</span></div><a class="btn btn-sm hide-sm" href="#/rap/${r.n}" style="margin-right:.3rem">Abrir</a>${icon("down", "chev")}</summary><div class="in">${actsOf(r)}</div></details>`).join("")}
        </div>
        <div class="stack">
          <div class="card tint" style="--tc:var(--c-evidencia)"><div class="flex between mb"><h3 class="mb0">Anuncios</h3><a href="#/anuncios" class="small">Ver todos →</a></div><div data-ann-live="3">${annList(3)}</div></div>
          <div class="card tint" style="--tc:var(--c-sesion)"><div class="flex between mb"><h3 class="mb0">Próximas fechas</h3><a href="#/cronograma" class="small">Cronograma →</a></div>
            ${evs.map((x) => `<div class="list-row"><div class="date-box" style="--c:${x.color}"><small>${fMon(x.when)}</small><b>${fDay(x.when)}</b></div><div style="min-width:0;flex:1"><b style="font-size:.88rem">${esc(x.title)}</b><div class="xs muted">${cap(fDate(x.when))} · ${fTime(x.when)}</div></div></div>`).join("") || `<p class="muted small">No hay fechas próximas.</p>`}</div>
        </div></div>`;
    bindMats(v); bindVids(v); bindActs(v);
    B.myGrades().then((g) => { C().raps.forEach((r) => { const el = $(`[data-evstat="${r.id}"]`, v); const x = g && g.raps ? g.raps[r.id] || g.raps["rap" + r.n] : null; if (el && x) { const st = estadoOf(x); el.className = "state " + st[0]; el.textContent = st[1] + (x.nota !== "" && x.nota != null ? " · " + x.nota : ""); } }); }).catch(() => {});
    $$("details.topic", v).forEach((d) => d.addEventListener("toggle", () => { if (d.dataset.topic === "info") localStorage.setItem("iap_open_info", d.open ? "1" : "0"); else if (d.open) localStorage.setItem("iap_open_rap", d.dataset.topic); }));
    $$("summary .btn", v).forEach((a) => a.addEventListener("click", (e) => e.stopPropagation()));
  }

  /* ================================ RAP ================================ */
  function viewRap(v, n) {
    const r = rapOf(n); if (!r) return notFound(v);
    const e = r.evidencia, s = r.sesion, emb = formEmbed(e.formulario), formUrl = (e.formulario || "").trim();
    const vids = (s.grabacion ? [{ titulo: "Grabación de la sesión en vivo", url: s.grabacion, desc: s.fecha ? cap(fDate(sesStart(r))) : "" }] : []).concat(r.videos || []);
    const KC = { sesion: "sesion", materiales: "material", videos: "videos", recursos: "enlaces", interactivas: "enlaces", evidencia: "evidencia" };
    const sec = (id, ic, title, hint, body, open) => `<details class="dsec" id="s-${id}" ${open ? "open" : ""} style="--sc:var(--c-${KC[id]})"><summary>${icon(ic)}<b>${title}</b>${hint ? `<span class="hint-s">${hint}</span>` : ""}${icon("down", "chev")}</summary><div class="dsec-in">${body}</div></details>`;
    const rg = (e.rubrica || []).filter((x) => !Number(x[1])).length, total = (e.rubrica || []).reduce((a, x) => a + (Number(x[1]) || 0), 0), totalTxt = rg > 1 ? `${Math.round(total / rg)} puntos por opción` : `${total} puntos`;
    v.innerHTML = `<div class="rap-head fade" style="--c:${r.color}"><span class="kicker" style="color:${r.color}">RAP ${r.n}</span><h1>${esc(r.titulo)}</h1>
        ${r.descripcion || (r.criterios || []).length ? `<details class="more"><summary>Ver descripción y criterios</summary><p>${esc(r.descripcion)}</p>${(r.criterios || []).length ? `<ul class="small">${r.criterios.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}</details>` : ""}</div>
      ${sec("sesion", "video", "Sesión en vivo", s.fecha ? `${cap(fDate(sesStart(r)))} · ${fTime(sesStart(r))}` : "Fecha por confirmar",
        `<div class="ses ${isLive(r) ? "live" : ""}">${s.fecha ? `<div class="ses-date"><small>${cap(fMon(sesStart(r)))}</small><b>${fDay(sesStart(r))}</b><span>${cap(fWeekday(sesStart(r)))}</span></div>
          <div class="ses-time">${icon("clock")}<div><b>${fTime(sesStart(r))} – ${fTime(sesEnd(r))}</b><span>${isLive(r) ? "En vivo ahora" : sesEnd(r) < now() ? "Sesión finalizada" : "Hora de Colombia"}</span></div></div>` : `<div class="ses-time"><div><b>Fecha por confirmar</b></div></div>`}
          <div class="ses-go"><a class="btn btn-teams btn-lg" href="${esc(U.teamsLink(s.enlace))}" target="_blank" rel="noopener">${icon("teams")} ${isLive(r) ? "Unirme ahora" : "Abrir Teams"}</a>${s.grabacion ? `<button class="btn btn-soft" data-vid="${esc(s.grabacion)}" data-title="Grabación · RAP ${r.n}">${icon("play")} Ver grabación</button>` : ""}</div></div>${(s.datos || C().info.teamsDatos) ? `<div class="datos mt">${icon("info")}<div style="white-space:pre-line">${esc(s.datos || C().info.teamsDatos)}</div></div>` : ""}`, true)}
      ${sec("materiales", "book", "Material y guía", `${(r.materiales || []).length} archivos`, (r.materiales || []).map((m) => actRow(m)).join("") || `<p class="muted mb0">Aún no hay materiales.</p>`, true)}
      ${vids.length ? sec("videos", "play", "Videos", `${vids.length}`, `<div class="grid g3">${vids.map((x) => vidCard(x, r.color)).join("")}</div>`) : ""}
      ${(r.recursos || []).length ? sec("recursos", "link", "Enlaces y apps", `${r.recursos.length}`, r.recursos.map((x) => actRow(x, "recurso")).join("")) : ""}
      ${actsOfRap(r).length ? sec("interactivas", "sparkles", "Actividades", `${actsOfRap(r).length}`, actRows(r)) : ""}
      ${sec("evidencia", "upload", `Evidencia · ${esc(e.nombre)}`, e.fecha ? `Hasta ${cap(fDate(evDue(r)))}, ${fTime(evDue(r))}` : "", `
        ${e.descripcion ? `<p style="white-space:pre-line" class="small">${esc(e.descripcion)}</p>` : ""}
        ${(e.rubrica || []).length ? `<details class="more"><summary>Ver rúbrica (${totalTxt})</summary><table class="rubric"><tbody>${e.rubrica.map(([a, b]) => Number(b) ? `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>` : `<tr><th colspan="2" style="text-align:left;padding-top:.6rem">${esc(a)}</th></tr>`).join("")}</tbody></table><p class="xs muted mb0">${esc(C().info.notaAprobacion)}</p></details>` : ""}
        ${emb ? `<div class="form-embed-wrap"><iframe class="form-embed" src="${esc(emb)}" title="Formulario de entrega" loading="lazy">Cargando…</iframe></div><p class="xs muted mt">Si el formulario no carga o te pide iniciar sesión en Google, <a href="${esc(formUrl)}" target="_blank" rel="noopener">ábrelo en una pestaña nueva</a>.</p>`
          : formUrl ? `<a class="btn btn-primary" href="${esc(formUrl)}" target="_blank" rel="noopener">${icon("external")} Abrir formulario de entrega</a>` : `<p class="muted">El formulario de entrega se publicará pronto.</p>`}
        <div id="evbox-${r.n}" class="evstatus mt"></div>`, true)}
      <div class="flex between">${rapOf(r.n - 1) ? `<a class="btn" href="#/rap/${r.n - 1}">${icon("left")} RAP ${r.n - 1}</a>` : "<span></span>"}${rapOf(r.n + 1) ? `<a class="btn" href="#/rap/${r.n + 1}">RAP ${r.n + 1} ${icon("right")}</a>` : "<span></span>"}</div>`;
    bindMats(v); bindVids(v); bindActs(v); evidenceBox(r, v);
    const hh = location.hash.split("#")[2]; if (hh) setTimeout(() => { const t = document.getElementById("s-" + hh); if (t) { t.open = true; t.scrollIntoView(); } }, 80);
  }

  function viewBiblioteca(v) {
    let q = "", fr = "all";
    v.innerHTML = head("Biblioteca", "Todo el material del curso en un solo lugar.") + `<div class="card mb flex wrap"><input class="input" id="bq" placeholder="Buscar…" style="max-width:300px"><div class="flex wrap" style="gap:.3rem"><button class="chip chip-btn on" data-r="all">Todo</button>${C().raps.map((r) => `<button class="chip chip-btn" data-r="${r.n}"><span class="dot" style="background:${r.color}"></span> RAP ${r.n}</button>`).join("")}${(C().biblioteca || []).length ? `<button class="chip chip-btn" data-r="gen">General</button>` : ""}</div></div><div id="bl"></div>`;
    const draw = () => {
      const groups = C().raps.filter((r) => fr === "all" || fr === String(r.n)).map((r) => [r, (r.materiales || []).filter((m) => !q || norm(m.titulo + m.desc).includes(norm(q)))]).filter(([, l]) => l.length);
      const gen = (fr === "all" || fr === "gen") ? (C().biblioteca || []).filter((m) => !q || norm(m.titulo + m.desc).includes(norm(q))) : [];
      $("#bl").innerHTML = (groups.map(([r, l]) => `<h3 class="mt flex" style="gap:.5rem"><span class="dot" style="background:${r.color}"></span>RAP ${r.n} · ${esc(r.corto)}</h3><div class="stack">${l.map((m) => actRow(m)).join("")}</div>`).join("") + (gen.length ? `<h3 class="mt">Material general</h3><div class="stack">${gen.map((m) => actRow(m)).join("")}</div>` : "")) || `<div class="empty"><span class="big">🔍</span>No hay materiales.</div>`;
      bindMats($("#bl"));
    };
    $("#bq").addEventListener("input", (e) => { q = e.target.value; draw(); });
    $$("[data-r]", v).forEach((b) => b.addEventListener("click", () => { fr = b.dataset.r; $$("[data-r]", v).forEach((x) => x.classList.toggle("on", x === b)); draw(); }));
    draw();
  }
  function viewVideos(v) {
    v.innerHTML = head("Videos", "Grabaciones de las sesiones y videos de apoyo.");
    let html = "";
    C().raps.forEach((r) => { const vids = (r.sesion.grabacion ? [{ titulo: `Grabación · Sesión RAP ${r.n}`, url: r.sesion.grabacion, desc: r.sesion.fecha ? cap(fDate(sesStart(r))) : "" }] : []).concat(r.videos || []); if (vids.length) html += `<h3 class="mt flex" style="gap:.5rem"><span class="dot" style="background:${r.color}"></span>RAP ${r.n} · ${esc(r.corto)}</h3><div class="grid g3">${vids.map((x) => vidCard(x, r.color)).join("")}</div>`; });
    if ((C().videos || []).length) html += `<h3 class="mt">Videos generales</h3><div class="grid g3">${C().videos.map((x) => vidCard(x)).join("")}</div>`;
    v.insertAdjacentHTML("beforeend", html || `<div class="empty"><span class="big">🎬</span>Aún no hay videos publicados.</div>`);
    bindVids(v);
  }

  /* ================================ CRONOGRAMA ================================ */
  function monthCal(year, month, events) {
    const first = new Date(Date.UTC(year, month, 1, 12)), days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate(), offset = (first.getUTCDay() + 6) % 7;
    const key = (ts) => U.fmt(ts, { year: "numeric", month: "2-digit", day: "2-digit" });
    const map = {}; events.forEach((e) => { (map[key(e.when)] = map[key(e.when)] || []).push(e); });
    const todayK = key(now()), cs = dt(C().info.inicio, "00:00"), ce = dt(C().info.fin, "23:59");
    let h = ["L", "M", "M", "J", "V", "S", "D"].map((d) => `<div class="h">${d}</div>`).join("");
    for (let i = 0; i < offset; i++) h += "<div></div>";
    for (let d = 1; d <= days; d++) { const ts = Date.UTC(year, month, d, 17), k = key(ts), es = map[k], inC = ts >= cs && ts <= ce; h += `<div class="d ${es ? "ev" : ""} ${inC && !es ? "in" : ""} ${k === todayK ? "today" : ""}" ${es ? `style="background:${es[0].color}" title="${esc(es.map((x) => x.title).join(" · "))}"` : ""}>${d}</div>`; }
    return `<div class="card"><h4>${cap(new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" }).format(first))}</h4><div class="cal">${h}</div></div>`;
  }
  function viewCronograma(v) {
    const L = allEvents(), next = L.find((e) => e.end > now()), I = C().info;
    const months = []; const a = new Date(I.inicio + "T12:00:00Z"), b = new Date(I.fin + "T12:00:00Z");
    for (let y = a.getUTCFullYear(), m = a.getUTCMonth(); y < b.getUTCFullYear() || (y === b.getUTCFullYear() && m <= b.getUTCMonth()); m++) { if (m > 11) { m = 0; y++; } months.push([y, m]); if (months.length > 6) break; }
    v.innerHTML = head("Cronograma", `Del ${fDate(dt(I.inicio, "12:00"))} al ${fDate(dt(I.fin, "12:00"))} · hora de Colombia.`, `${B.isInstructor() ? `<a class="btn" href="#/admin/cronograma">${icon("settings")} Editar</a>` : ""}`) + `
      <div class="grid split"><div class="timeline fade">${L.map((e) => { const past = e.end < now(); return `<div class="tl-item ${past ? "past" : ""} ${e === next ? "next" : ""}" style="--c:${e.color}"><div class="card"><div class="flex between wrap"><span class="tl-type">${e.icon} ${e.kind === "sesion" ? "Sesión en vivo" : e.kind === "evidencia" ? "Entrega de evidencia" : "Hito"}</span><span class="xs muted">${cap(fDate(e.when))} · ${fTime(e.when)}</span></div><h3 style="margin:.3rem 0 .15rem;font-size:1rem">${esc(e.title)}</h3><p class="small muted mb0">${esc(e.desc || "")}</p>${past ? "" : `<div class="flex wrap mt" style="gap:.4rem">${e.kind === "sesion" ? `<a class="btn btn-teams btn-sm" href="${esc(U.teamsLink(e.link))}" target="_blank" rel="noopener">${icon("teams")} Unirme</a>` : e.kind === "evidencia" ? `<a class="btn btn-primary btn-sm" href="#/rap/${e.rap.n}#evidencia">${icon("upload")} Entregar</a>` : e.link ? `<a class="btn btn-sm" href="${esc(e.link)}" target="_blank" rel="noopener">${icon("external")} Abrir</a>` : ""}${e.rap ? `<a class="btn btn-soft btn-sm" href="#/rap/${e.rap.n}">RAP ${e.rap.n}</a>` : ""}</div>`}</div></div>`; }).join("") || `<div class="empty">Sin fechas programadas.</div>`}</div>
        <div class="stack">${months.map(([y, m]) => monthCal(y, m, L)).join("")}<div class="legend">${C().raps.map((r) => `<span><i class="dot" style="background:${r.color}"></i>RAP ${r.n}</span>`).join("")}<span><i class="dot" style="background:#64748B"></i>Hitos</span></div></div></div>`;
  }

  /* ================================ CHAT GENERAL ================================ */
  let lastSent = 0;
  function renderMsgs(box, list, opts) {
    const u = user(); const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    if (!list.length) { box.innerHTML = `<div class="empty"><span class="big">💬</span>${opts.empty}</div>`; return; }
    let html = "", prev = null, lastDay = "";
    list.forEach((m) => {
      const day = U.fmt(m.ts, { weekday: "long", day: "numeric", month: "long" });
      if (day !== lastDay) { html += `<div class="day-sep">${cap(day)}</div>`; lastDay = day; prev = null; }
      const cont = prev && prev.uid === m.uid && m.ts - prev.ts < 5 * 6e4, mine = m.uid === u.uid;
      html += `<div class="msg ${cont ? "cont" : ""}">${avatar(m, "sm")}<div style="min-width:0;flex:1">${cont ? "" : `<div class="who"><b>${esc(m.name)}</b>${m.role === "instructor" ? `<span class="tag-inst">Instructor</span>` : m.ficha ? `<small>Ficha ${esc(m.ficha)}</small>` : ""}<small>${fTime(m.ts)}</small></div>`}<div class="txt">${linkify(m.text)}</div></div>
        ${opts.tools ? `<div class="tools">${!mine && opts.report ? `<button data-rep="${esc(m.id)}" title="Reportar">${icon("flag")}</button>` : ""}${(mine || B.isInstructor()) && opts.del ? `<button data-del="${esc(m.id)}" title="Borrar">${icon("trash")}</button>` : ""}</div>` : ""}</div>`;
      prev = m;
    });
    box.innerHTML = html;
    if (atBottom || !box.dataset.done) { box.scrollTop = box.scrollHeight; box.dataset.done = "1"; }
  }
  function composer(form, onSend) {
    const tx = $("textarea", form);
    const grow = () => { tx.style.height = "auto"; tx.style.height = Math.min(140, tx.scrollHeight) + "px"; };
    tx.addEventListener("input", grow);
    tx.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
    form.addEventListener("submit", async (e) => {
      e.preventDefault(); const text = tx.value.trim(); if (!text) return;
      if (Date.now() - lastSent < 2000) return toast("Espera un momento antes de enviar otro mensaje");
      lastSent = Date.now(); tx.value = ""; grow();
      try { await onSend(text); } catch (err) { tx.value = text; toast(err.message || "No se pudo enviar", "bad"); }
    });
    tx.focus();
  }
  function viewChat(v) {
    v.innerHTML = `<div class="chat single fade"><section class="chat-main"><div class="chat-head"><span style="font-size:1.3rem">💬</span><div><h3>Chat general</h3><p>Conversación abierta de todo el curso. ${B.isInstructor() ? "" : "Para asuntos personales usa «Mensajes al instructor»."}</p></div></div>
      <div class="msgs" id="msgs"><div class="spinner"></div></div>
      <form class="composer" id="cf"><textarea class="input" rows="1" maxlength="600" placeholder="Escribe un mensaje… (Enter para enviar)"></textarea><button class="btn btn-primary" aria-label="Enviar">${icon("send")}</button></form></section></div>`;
    const box = $("#msgs"); let cache = [];
    onCleanup(B.subscribeChat((l) => { cache = l; renderMsgs(box, l, { empty: "Aún no hay mensajes. ¡Escribe el primero!", tools: true, report: true, del: true }); }));
    box.addEventListener("click", async (e) => {
      const d = e.target.closest("[data-del]"), rp = e.target.closest("[data-rep]");
      if (d && await confirmDialog("Borrar mensaje", "¿Borrar este mensaje?", "Borrar", true)) { try { await B.deleteChat(d.dataset.del); } catch (err) { toast(err.message, "bad"); } }
      if (rp) { const m = cache.find((x) => x.id === rp.dataset.rep); if (m && await confirmDialog("Reportar mensaje", "El instructor revisará este mensaje. ¿Lo reportas?", "Reportar")) { await B.reportChat(m); toast("Reporte enviado", "ok"); } }
    });
    composer($("#cf"), (t) => B.sendChat(t));
  }

  /* ================================ MENSAJES PRIVADOS ================================ */
  function renderThreads(side, sel) {
    sel = sel || side.dataset.sel;
    side.innerHTML = dmThreads.length ? dmThreads.map((t) => { const un = t.lastFrom === "aprendiz" && (t.lastTs || 0) > (t.readInst || 0); return `<a class="thread ${t.uid === sel ? "on" : ""}" href="#/mensajes/${t.uid}">${avatar(t, "sm")}<div class="t"><b>${esc(t.name || "Aprendiz")}</b><small>${esc(t.lastText || "")}</small></div>${un ? `<span class="badge">●</span>` : `<small class="xs muted">${t.lastTs ? ago(t.lastTs) : ""}</small>`}</a>`; }).join("") : `<div class="empty small">Ningún aprendiz te ha escrito todavía.</div>`;
  }
  function viewMensajes(v, uidSel) {
    const inst = B.isInstructor(); const threadUid = inst ? uidSel : user().uid;
    const other = inst ? dmThreads.find((t) => t.uid === threadUid) : null;
    v.innerHTML = `<div class="chat ${inst ? "" : "single"} fade" id="chat">${inst ? `<aside class="chat-side" data-dm-threads data-sel="${esc(threadUid || "")}"></aside>` : ""}
      <section class="chat-main">${(inst && !threadUid) ? `<div class="empty" style="margin:auto"><span class="big">✉️</span>Elige un aprendiz para ver la conversación.</div>` : `
        <div class="chat-head">${inst ? `<button class="btn-icon btn chat-back" id="chBack">${icon("menu")}</button>` : ""}${inst ? avatar(other || { name: "?" }, "sm") : `<span style="font-size:1.3rem">✉️</span>`}<div><h3>${inst ? esc((other && other.name) || "Aprendiz") : "Mensajes al instructor"}</h3><p>${inst ? (other && other.ficha ? "Ficha " + esc(other.ficha) : "Conversación privada") : "Solo tú y " + esc(C().info.instructor) + " ven esta conversación."}</p></div></div>
        <div class="msgs" id="msgs"><div class="spinner"></div></div>
        <form class="composer" id="cf"><textarea class="input" rows="1" maxlength="600" placeholder="Escribe tu mensaje…"></textarea><button class="btn btn-primary" aria-label="Enviar">${icon("send")}</button></form>`}</section></div>`;
    const side = $("[data-dm-threads]", v); if (side) { renderThreads(side, threadUid); const bk = $("#chBack"); if (bk) bk.addEventListener("click", () => $("#chat").classList.toggle("show-side")); if (inst && !threadUid && matchMedia("(max-width:760px)").matches) $("#chat").classList.add("show-side"); }
    if (!threadUid) return;
    const box = $("#msgs");
    onCleanup(B.subscribeDM(threadUid, (l) => { renderMsgs(box, l, { empty: inst ? "Sin mensajes todavía." : "Escríbele al instructor: solo él verá tus mensajes." }); B.markDMRead(threadUid).catch(() => {}); }));
    composer($("#cf"), (t) => B.sendDM(threadUid, t));
  }

  /* ================================ ANUNCIOS / AYUDA / PERFIL ================================ */
  function viewAnuncios(v) {
    localStorage.setItem("iap_annseen_" + user().uid, String(now())); updateBadges();
    v.innerHTML = head("Anuncios", "Novedades y recordatorios del instructor.") + (B.isInstructor() ? `<form class="card mb" id="af"><h3>Publicar anuncio</h3><div class="field"><label>Título</label><input class="input" id="at" required maxlength="120"></div><div class="field"><label>Mensaje</label><textarea class="input" id="ab" required maxlength="1500" rows="4"></textarea></div><button class="btn btn-primary">${icon("megaphone")} Publicar</button></form>` : "") + `<div class="card"><div data-ann-live="50">${annList(50)}</div></div>`;
    bindAnnDel();
    const f = $("#af"); if (f) f.addEventListener("submit", async (e) => { e.preventDefault(); try { await B.postAnnouncement({ title: $("#at").value.trim(), body: $("#ab").value.trim() }); f.reset(); toast("Anuncio publicado", "ok"); } catch (err) { toast(err.message, "bad"); } });
  }
  function viewAyuda(v) {
    v.innerHTML = head("Ayuda") + `<div class="grid split"><div><h3>Preguntas frecuentes</h3>${(C().faq || []).map(([a, b], i) => `<details class="acc" ${i === 0 ? "open" : ""}><summary>${esc(a)}</summary><div class="in">${linkify(b)}</div></details>`).join("")}</div>
      <div class="stack"><div class="card"><h3>Normas de convivencia</h3><ul style="padding-left:1.1rem;margin:0" class="small">${(C().normas || []).map((n) => `<li style="margin-bottom:.3rem">${esc(n)}</li>`).join("")}</ul><button class="btn btn-sm mt" id="pd">Tratamiento de datos</button></div>
      <div class="card"><h3>Contacto</h3><p class="small muted">${esc(C().info.instructor)} · ${esc(C().info.rolInstructor)}</p><div class="flex wrap"><a class="btn btn-soft btn-sm" href="#/mensajes">${icon("mail")} Mensaje privado</a><a class="btn btn-teams btn-sm" href="${esc(U.teamsLink())}" target="_blank" rel="noopener">${icon("teams")} Teams</a></div></div></div></div>`;
    $("#pd").addEventListener("click", showDatos);
  }
  function viewPerfil(v) {
    const u = user(); const COLS = ["#6C3CE1", "#0EA5A4", "#F2545B", "#F5A524", "#2563EB", "#DB2777", "#16A34A", "#9333EA", "#EA580C", "#0891B2"]; let color = u.color;
    v.innerHTML = head("Mi perfil") + `<div class="grid split"><form class="card" id="pf"><div class="flex mb">${avatar(u, "lg").replace('class="avatar lg"', 'class="avatar lg" id="av"')}<div><h2 class="mb0">${esc(u.name)}</h2><span class="muted small">${esc(u.email)}</span></div></div>
        <div class="field"><label>Color del avatar</label><div class="color-pick">${COLS.map((c) => `<button type="button" data-c="${c}" class="${c === color ? "on" : ""}" style="background:${c}"></button>`).join("")}</div></div>
        <div class="field"><label>Nombre completo</label><input class="input" id="pn" value="${esc(u.name)}" required></div>
        <div class="row2"><div class="field"><label>Ficha</label><input class="input" id="pfi" value="${esc(u.ficha || "")}"></div><div class="field"><label>Municipio</label><input class="input" id="pm" value="${esc(u.municipio || "")}"></div></div>
        <button class="btn btn-primary">Guardar</button></form>
      <div class="card"><h3>Seguridad</h3><p class="small muted">Si aún usas tu número de documento como contraseña, cámbiala por una propia.</p><form id="cp" class="stack"><div class="field"><label>Contraseña actual</label><input class="input" id="cp0" type="password" autocomplete="current-password" required></div><div class="row2"><div class="field"><label>Nueva (mín. 8)</label><input class="input" id="cp1" type="password" autocomplete="new-password" minlength="8" required></div><div class="field"><label>Repite la nueva</label><input class="input" id="cp2" type="password" autocomplete="new-password" required></div></div><button class="btn btn-sm btn-primary" style="align-self:flex-start">${icon("lock")} Cambiar contraseña</button></form><div class="flex wrap mt"><button class="btn btn-sm" id="rp">${icon("mail")} Enviarme un correo de recuperación</button><button class="btn btn-danger btn-sm" id="lo">${icon("logout")} Cerrar sesión</button></div></div></div>`;
    $$("[data-c]", v).forEach((b) => b.addEventListener("click", () => { color = b.dataset.c; $$("[data-c]", v).forEach((x) => x.classList.toggle("on", x === b)); $("#av").style.background = color; }));
    $("#pf").addEventListener("submit", async (e) => { e.preventDefault(); try { await B.updateProfile({ name: $("#pn").value.trim(), ficha: $("#pfi").value.trim(), municipio: $("#pm").value.trim(), color }); toast("Perfil actualizado", "ok"); mountShell(); route(); } catch (err) { toast(err.message, "bad"); } });
    $("#cp").addEventListener("submit", async (e) => { e.preventDefault(); if ($("#cp1").value !== $("#cp2").value) return toast("Las contraseñas nuevas no coinciden.", "bad"); try { await B.changePassword($("#cp0").value, $("#cp1").value); toast("Contraseña actualizada", "ok"); e.target.reset(); } catch (err) { toast(err.message, "bad"); } });
    $("#rp").addEventListener("click", async () => { try { await B.resetPassword(u.email); toast("Correo enviado", "ok"); } catch (err) { toast(err.message, "bad"); } });
    $("#lo").addEventListener("click", async () => { await B.logout(); location.hash = "#/"; });
  }

  /* ================================ INSTRUCTOR: aprendices y moderación ================================ */
  /* Importación de aprendices desde los Excel de Sofía Plus: correo = usuario, documento = contraseña inicial. */
  function parseRoster(rows) {
    const nrm = (x) => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const hi = rows.findIndex((r) => r.some((c) => /correo/.test(nrm(c))) && r.some((c) => /documento/.test(nrm(c))));
    if (hi < 0) throw new Error("No encontré las columnas «Número de Documento» y «Correo Electrónico».");
    const H = rows[hi].map(nrm), col = (re) => H.findIndex((h) => re.test(h));
    const cDoc = col(/numero.*documento|^documento|^identificacion/), cEmail = col(/correo/), cNom = col(/^nombre/), cApe = col(/apellido/), cEst = col(/^estado/);
    let ficha = ""; rows.slice(0, hi).forEach((r) => { if (/ficha/.test(nrm(r[0]))) { const m = r.join(" ").match(/\b(\d{6,8})\b/); if (m) ficha = m[1]; } });
    const out = [], bad = [];
    rows.slice(hi + 1).forEach((r) => {
      const email = String(r[cEmail] || "").trim().toLowerCase(), doc = String(r[cDoc] || "").replace(/[^0-9A-Za-z]/g, "");
      if (!email && !doc) return;
      const name = [r[cNom], r[cApe]].filter(Boolean).join(" ").replace(/\s+/g, " ").trim().toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return bad.push(`${name || "(sin nombre)"}: correo no válido`);
      if (!doc) return bad.push(`${name}: sin número de documento`);
      out.push({ name, email, doc, ficha, estado: cEst >= 0 ? r[cEst] : "" });
    });
    return { rows: out, bad, ficha };
  }
  function importarAprendices(done) {
    let list = [];
    const m = modal({ title: "Importar aprendices", wide: true, body: `<p class="small muted">Sube los Excel de aprendices (uno por ficha; acepta .xls, .xlsx o .csv). Cada persona queda con su <b>correo como usuario</b> y su <b>número de documento como contraseña inicial</b>. Los archivos se leen en tu navegador y no se publican.</p>
      <input class="input" type="file" id="rf" accept=".xls,.xlsx,.csv" multiple><div id="rp" class="mt"></div>`, foot: `<button class="btn" data-close>Cerrar</button><button class="btn btn-primary" id="rgo" disabled>Crear cuentas</button>` });
    const box = $("#rp"), go = $("#rgo");
    $("#rf").addEventListener("change", async (e) => {
      list = []; const msgs = []; box.innerHTML = `<div class="spinner"></div>`;
      for (const f of e.target.files) { try { const r = parseRoster(await window.Admin.readTable(f)); r.rows.forEach((x) => list.push(x)); msgs.push(`<li><b>${esc(f.name)}</b>: ${r.rows.length} aprendices${r.ficha ? ` · ficha ${esc(r.ficha)}` : ""}${r.bad.length ? ` <span class="muted">(${r.bad.length} omitidos: ${esc(r.bad.join("; "))})</span>` : ""}</li>`); } catch (err) { msgs.push(`<li><b>${esc(f.name)}</b>: <span style="color:var(--bad,#c00)">${esc(err.message)}</span></li>`); } }
      const seen = new Set(), dup = []; list = list.filter((x) => { if (seen.has(x.email)) { dup.push(x.email); return false; } seen.add(x.email); return true; });
      box.innerHTML = `<ul class="small" style="padding-left:1.1rem">${msgs.join("")}</ul>${dup.length ? `<p class="small muted">Correos repetidos (se usa una sola vez): ${esc(dup.join(", "))}</p>` : ""}
        ${list.length ? `<div class="table-wrap" style="max-height:260px;overflow:auto"><table class="table"><thead><tr><th>Nombre</th><th>Correo (usuario)</th><th>Documento (clave)</th><th>Ficha</th></tr></thead><tbody>${list.map((x) => `<tr><td>${esc(x.name)}</td><td>${esc(x.email)}</td><td>${esc(x.doc.slice(0, 2) + "•".repeat(Math.max(0, x.doc.length - 4)) + x.doc.slice(-2))}</td><td>${esc(x.ficha)}</td></tr>`).join("")}</tbody></table></div><p class="small mt"><b>${list.length}</b> cuentas listas para crear.</p>` : ""}`;
      go.disabled = !list.length; go.textContent = list.length ? `Crear ${list.length} cuentas` : "Crear cuentas";
    });
    go.addEventListener("click", async () => {
      go.disabled = true; $("#rf").disabled = true;
      box.insertAdjacentHTML("beforeend", `<div class="mt"><div class="small" id="pgt">Creando cuentas… 0/${list.length}</div><progress id="pg" max="${list.length}" value="0" style="width:100%"></progress></div>`);
      try {
        const res = await B.importRoster(list, (i, n, em) => { $("#pg").value = i; $("#pgt").textContent = `Creando cuentas… ${i}/${n} · ${em}`; });
        box.innerHTML = `<div class="card"><h3>Listo</h3><p><b>${res.creados}</b> cuentas nuevas · <b>${res.existentes}</b> ya existían${res.errores.length ? ` · <b>${res.errores.length}</b> con aviso` : ""}.</p>${res.errores.length ? `<ul class="small">${res.errores.map((x) => `<li>${esc(x.email)}: ${esc(x.msg)}</li>`).join("")}</ul>` : ""}<p class="small muted">Cada aprendiz ingresa con su correo y su número de documento.</p></div>`;
        go.style.display = "none"; if (done) done();
      } catch (err) { box.insertAdjacentHTML("beforeend", `<div class="form-error mt">${esc(err.message)}</div>`); }
    });
  }
  function viewAprendices(v) {
    if (!B.isInstructor()) return notFound(v);
    v.innerHTML = head("Aprendices", "Personas con acceso a la plataforma.", `<button class="btn btn-primary" id="imp">${icon("upload")} Importar aprendices</button><button class="btn" id="csv">${icon("download")} Exportar CSV</button>`) + `<div class="card mb flex wrap"><input class="input" id="uq" placeholder="Buscar por nombre o correo" style="max-width:300px"><select class="input" id="uf" style="max-width:200px"><option value="all">Todas las fichas</option></select></div><div class="table-wrap"><table class="table"><thead><tr><th>Aprendiz</th><th>Ficha</th><th>Municipio</th><th>Registro</th><th>Último ingreso</th><th></th></tr></thead><tbody id="ut"><tr><td colspan="6"><div class="spinner"></div></td></tr></tbody></table></div>`;
    $("#imp").addEventListener("click", () => importarAprendices(() => { mountShell(); route(); }));
    B.listUsers().then((all) => {
      const L = all.filter((x) => x.role !== "instructor"); let q = "", ff = "all";
      $("#uf").innerHTML += [...new Set(L.map((x) => x.ficha).filter(Boolean))].map((f) => `<option>${esc(f)}</option>`).join("");
      const draw = () => { const R = L.filter((x) => (ff === "all" || x.ficha === ff) && (!q || norm(x.name + x.email).includes(norm(q)))); $("#ut").innerHTML = R.map((x) => `<tr><td><div class="flex">${avatar(x, "sm")}<div><b>${esc(x.name)}</b><div class="xs muted">${esc(x.email)}</div></div></div></td><td>${esc(x.ficha || "—")}</td><td>${esc(x.municipio || "—")}</td><td class="small muted">${x.createdAt ? fShort(x.createdAt) : "—"}</td><td class="small muted">${x.lastLogin ? ago(x.lastLogin) : "—"}</td><td><div class="flex" style="gap:.3rem;justify-content:flex-end"><a class="btn btn-sm" href="#/mensajes/${esc(x.uid)}">${icon("mail")}</a><button class="btn btn-sm btn-danger" data-rm="${esc(x.uid)}" title="Quitar de la plataforma">${icon("trash")}</button></div></td></tr>`).join("") || `<tr><td colspan="6"><div class="empty">Aún no hay aprendices registrados.</div></td></tr>`;
        $$("[data-rm]", v).forEach((b) => b.addEventListener("click", async () => { if (await confirmDialog("Quitar aprendiz", "Se borra su perfil de la plataforma (en Firebase, la cuenta de acceso se elimina desde la consola de Authentication). ¿Continuar?", "Quitar", true)) { await B.deleteUser(b.dataset.rm); const i = L.findIndex((x) => x.uid === b.dataset.rm); L.splice(i, 1); draw(); } })); };
      $("#uq").addEventListener("input", (e) => { q = e.target.value; draw(); }); $("#uf").addEventListener("change", (e) => { ff = e.target.value; draw(); });
      $("#csv").addEventListener("click", () => { const rows = [["Nombre", "Correo", "Ficha", "Municipio", "Registro", "Último ingreso"]]; L.forEach((x) => rows.push([x.name, x.email, x.ficha || "", x.municipio || "", x.createdAt ? new Date(x.createdAt).toLocaleString("es-CO") : "", x.lastLogin ? new Date(x.lastLogin).toLocaleString("es-CO") : ""])); const csv = "﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = "aprendices.csv"; a.click(); });
      draw();
    }).catch((e) => { $("#ut").innerHTML = `<tr><td colspan="6"><div class="form-error">${esc(e.message)}</div></td></tr>`; });
  }
  function viewModeracion(v) {
    if (!B.isInstructor()) return notFound(v);
    v.innerHTML = head("Moderación", "Mensajes del chat reportados por los aprendices.") + `<div id="rl"><div class="spinner"></div></div>`;
    B.listReports().then((L) => {
      $("#rl").innerHTML = L.length ? `<div class="stack">${L.map((r) => `<div class="card flex wrap" style="align-items:flex-start"><span style="font-size:1.3rem">🚩</span><div style="flex:1;min-width:220px"><div class="xs muted">reportado por ${esc(r.by)} · ${ago(r.ts)}</div><b>${esc(r.author)}:</b> ${esc(r.text)}</div><div class="flex"><button class="btn btn-danger btn-sm" data-delmsg="${esc(r.id)}">${icon("trash")} Borrar mensaje</button><button class="btn btn-sm" data-ok="${esc(r.id)}">Descartar</button></div></div>`).join("")}</div>` : `<div class="empty"><span class="big">✅</span>No hay reportes pendientes.</div>`;
      $$("[data-delmsg]", v).forEach((b) => b.addEventListener("click", async () => { const r = L.find((x) => x.id === b.dataset.delmsg); try { await B.deleteChat(r.msgId); } catch (e) {} await B.resolveReport(r.id); viewModeracion(v); }));
      $$("[data-ok]", v).forEach((b) => b.addEventListener("click", async () => { await B.resolveReport(b.dataset.ok); viewModeracion(v); }));
    }).catch((e) => { $("#rl").innerHTML = `<div class="form-error">${esc(e.message)}</div>`; });
  }
  function viewParticipantes(v) {
    v.innerHTML = head("Participantes", "Las personas inscritas en el curso.") + `<div class="card mb flex wrap"><input class="input" id="pq" placeholder="Buscar…" style="max-width:300px"><select class="input" id="pf" style="max-width:200px"><option value="all">Todas las fichas</option></select></div><div id="pl"><div class="spinner"></div></div>`;
    B.listDirectory().then((all) => {
      const inst = all.filter((x) => x.role === "instructor"), L = all.filter((x) => x.role !== "instructor").sort((a, b) => a.name.localeCompare(b.name, "es")); let q = "", ff = "all";
      $("#pf").innerHTML += [...new Set(L.map((x) => x.ficha).filter(Boolean))].sort().map((f) => `<option>${esc(f)}</option>`).join("");
      const card = (x, tag) => `<div class="card flex"><div>${avatar(x)}</div><div style="min-width:0;flex:1"><b>${esc(x.name)}</b><div class="xs muted">${tag || [x.ficha ? "Ficha " + esc(x.ficha) : "", esc(x.municipio || "")].filter(Boolean).join(" · ")}</div></div>${tag ? `<a class="btn btn-sm btn-soft" href="#/mensajes">${icon("mail")}</a>` : ""}</div>`;
      const draw = () => { const R = L.filter((x) => (ff === "all" || x.ficha === ff) && (!q || norm(x.name).includes(norm(q)))); $("#pl").innerHTML = (inst.length && !q && ff === "all" ? `<h3>Instructor</h3><div class="grid g3 mb">${inst.map((x) => card(x, "Instructor")).join("")}</div>` : "") + `<h3>Aprendices <span class="muted small">(${R.length})</span></h3><div class="grid g3">${R.map((x) => card(x)).join("") || `<p class="muted">Sin participantes.</p>`}</div>`; };
      $("#pq").addEventListener("input", (e) => { q = e.target.value; draw(); }); $("#pf").addEventListener("change", (e) => { ff = e.target.value; draw(); }); draw();
    }).catch((e) => { $("#pl").innerHTML = `<div class="form-error">${esc(e.message)}</div>`; });
  }
  function viewCalificaciones(v) {
    if (B.isInstructor()) { location.replace("#/admin/calificaciones"); return; }
    v.innerHTML = head("Mis calificaciones", `${esc(C().info.notaAprobacion)}`) + `<div id="gl"><div class="spinner"></div></div>`;
    B.myGrades().then((g) => {
      const raps = C().raps; const R = raps.map((r) => ({ r, g: g && g.raps ? g.raps[r.id] || g.raps["rap" + r.n] : null }));
      const total = R.filter((x) => estadoOf(x.g)[0] === "ok").length, pend = R.filter((x) => estadoOf(x.g)[0] === "pend").length;
      const final = !g ? ["pend", "Sin calificaciones publicadas"] : g.final ? estadoOf({ estado: g.final }) : pend ? ["pend", `${total} de ${raps.length} RAP aprobados · ${pend} pendiente${pend > 1 ? "s" : ""}`] : total === raps.length ? ["ok", "Curso aprobado"] : ["no", `${total} de ${raps.length} RAP aprobados`];
      $("#gl").innerHTML = `<div class="card mb flex wrap between"><div><h3 class="mb0">${esc(user().name)}</h3><span class="small muted">Ficha ${esc(user().ficha || "—")}</span></div><span class="state ${final[0]}" style="font-size:.9rem;padding:.4rem .9rem">${final[1]}</span></div>
        <div class="grid g4">${R.map(({ r, g: x }) => { const st = estadoOf(x); return `<div class="card grade-card" style="--c:${r.color}"><span class="xs" style="font-weight:700;color:${r.color};text-transform:uppercase;letter-spacing:.06em">RAP ${r.n}</span><h4 style="margin:.2rem 0 .6rem">${esc(r.corto)}</h4><div class="flex between"><span class="n">${x && x.nota !== "" && x.nota != null ? esc(x.nota) : "—"}</span><span class="state ${st[0]}">${st[1]}</span></div>${x && x.obs ? `<p class="small muted mt mb0">${esc(x.obs)}</p>` : ""}</div>`; }).join("")}</div>
        ${g && g.obs ? `<div class="card mt"><h4>Observaciones del instructor</h4><p class="mb0" style="white-space:pre-line">${esc(g.obs)}</p></div>` : ""}
        <p class="small muted mt">La calificación oficial queda registrada también en el sistema del SENA. Si ves una diferencia, escríbele al instructor.</p><div id="gextra"></div>`;
      Promise.all([B.mySubmissions(), B.myResults()]).then(([subs, res]) => {
        const rows = R.map(({ r }) => { const st = estadoOf((R.find((q) => q.r === r) || {}).g); const acts = actsOfRap(r); const done = acts.filter((x) => res[x.id] && res[x.id].passed).length; return `<tr><td><span class="dot" style="background:${r.color}"></span> RAP ${r.n} · ${esc(r.corto)}</td><td><span class="state ${st[0]}">${esc(st[1])}</span></td>${C().info.actividadesActivas === "si" ? `<td>${acts.length ? `${done} de ${acts.length} aprobadas` : '<span class="muted">—</span>'}</td>` : ""}</tr>`; }).join("");
        const el = $("#gextra"); if (el) el.innerHTML = `<div class="card mt"><h4>Mis evidencias</h4><div class="table-wrap"><table class="table"><thead><tr><th>RAP</th><th>Evidencia</th>${C().info.actividadesActivas === "si" ? "<th>Actividades</th>" : ""}</tr></thead><tbody>${rows}</tbody></table></div></div>`;
      }).catch(() => {});
    }).catch((e) => { $("#gl").innerHTML = `<div class="form-error">${esc(e.message)}</div>`; });
  }
  function notFound(v) { v.innerHTML = `<div class="empty"><span class="big">🧭</span><h2>No encontramos esa página</h2><a class="btn btn-primary mt" href="#/inicio">Volver al inicio</a></div>`; }

  /* ================================ ENRUTADOR ================================ */
  const PUBLIC = { "": viewLanding, ingresar: viewLogin, registro: viewRegister, recuperar: viewRecover };
  const TITLES = { inicio: "Área de trabajo", participantes: "Participantes", calificaciones: "Mis calificaciones", biblioteca: "Biblioteca", videos: "Videos", cronograma: "Cronograma", chat: "Chat general", mensajes: "Mensajes", anuncios: "Anuncios", ayuda: "Ayuda", perfil: "Mi perfil", admin: "Administrar curso", aprendices: "Aprendices", moderacion: "Moderación" };
  const currentRoute = () => location.hash.replace(/^#\/?/, "").split("#")[0].split("/").filter(Boolean);
  function route() {
    runCleanups(); document.body.classList.remove("nav-open"); applyBrand();
    const [p0 = "", p1, p2] = currentRoute();
    if (p0 in PUBLIC) { if (user()) return location.replace("#/inicio"); shellOn = false; if (annUnsub) { annUnsub(); annUnsub = null; } if (dmUnsub) { dmUnsub(); dmUnsub = null; } document.title = C().info.marca; PUBLIC[p0](); return window.scrollTo(0, 0); }
    if (!user()) { sessionStorage.setItem("iap_after", location.hash); return location.replace("#/ingresar"); }
    if (!shellOn) mountShell();
    const v = $("#view"); setActive([p0, p1].filter(Boolean).join("/"));
    const r = p0 === "rap" ? rapOf(p1) : null;
    const title = r ? `RAP ${r.n} · ${r.corto}` : p0 === "admin" ? "Administrar curso" : TITLES[p0] || "";
    $("#ttl").textContent = title; document.title = `${title} · ${C().info.marca}`;
    const R = { inicio: () => viewInicio(v), rap: () => viewRap(v, p1), biblioteca: () => viewBiblioteca(v), videos: () => viewVideos(v), cronograma: () => viewCronograma(v), chat: () => viewChat(v), mensajes: () => viewMensajes(v, p1), anuncios: () => viewAnuncios(v), ayuda: () => viewAyuda(v), perfil: () => viewPerfil(v), participantes: () => viewParticipantes(v), calificaciones: () => viewCalificaciones(v), aprendices: () => viewAprendices(v), moderacion: () => viewModeracion(v), admin: () => (B.isInstructor() ? window.Admin.view(v, p1, p2) : notFound(v)) };
    (R[p0] || (() => notFound(v)))();
    const jump = location.hash.split("#")[2]; if (jump && document.getElementById("s-" + jump)) document.getElementById("s-" + jump).scrollIntoView(); else if (p0 !== "chat" && p0 !== "mensajes") window.scrollTo(0, 0);
  }
  window.App = { route, remountShell: () => { shellOn = false; mountShell(); } };
  window.addEventListener("hashchange", route);
  B.init().then(() => {
    let wasIn = !!user();
    B.onAuth((u) => {
      if (u && !wasIn) { wasIn = true; shellOn = false; const after = sessionStorage.getItem("iap_after"); sessionStorage.removeItem("iap_after"); const target = after && !/ingresar|registro|recuperar/.test(after) ? after : "#/inicio"; if (location.hash === target) route(); else location.hash = target; }
      else if (!u && wasIn) { wasIn = false; shellOn = false; location.hash = "#/"; route(); }
    });
    B.onCourse(() => { if (user() && !window.Admin.editing()) { shellOn = false; mountShell(); route(); } else if (!user()) route(); });
    route();
  }).catch((e) => { console.error(e); root.innerHTML = `<div class="loader"><div><h2>No se pudo iniciar la plataforma</h2><p class="muted">${esc(e.message)}</p></div></div>`; });
})();
