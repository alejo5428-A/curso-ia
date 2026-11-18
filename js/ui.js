/* =====================================================================
   UI · utilidades compartidas (íconos, modales, avisos, fechas…)
   ===================================================================== */
(function () {
  const TZ = "America/Bogota";

  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    video: '<rect x="2" y="5" width="15" height="14" rx="3"/><path d="m17 10 5-3v10l-5-3z"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    apps: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    game: '<path d="M6 11h4M8 9v4"/><circle cx="15.5" cy="12.5" r=".6" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".6" fill="currentColor"/><path d="M17.3 5H6.7A4.7 4.7 0 0 0 2 9.7v4.6A3.7 3.7 0 0 0 5.7 18c1.2 0 2.3-.6 3-1.6L10 15h4l1.3 1.4c.7 1 1.8 1.6 3 1.6a3.7 3.7 0 0 0 3.7-3.7V9.7A4.7 4.7 0 0 0 17.3 5z"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/>',
    megaphone: '<path d="m3 11 15-6v14L3 13z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/><path d="M21 9v4"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.6-.4-.4-2.6z"/>',
    glossary: '<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M8 9h8M8 13h5"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    play: '<path d="M7 4v16l13-8z" fill="currentColor" stroke="none"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    flag: '<path d="M4 22V4"/><path d="M4 4h13l-2 4 2 4H4"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    trophy: '<path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    sparkles: '<path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8zM5 3l.6 1.4L7 5l-1.4.6L5 7l-.6-1.4L3 5l1.4-.6z"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M10.7 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M2 2l20 20"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 3.1a4 4 0 0 1 0 7.8M22 21a7 7 0 0 0-5-6.7"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
    pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    teams: '<rect x="2" y="6" width="13" height="12" rx="2"/><path d="M5.5 9.5h6M8.5 9.5v6"/><circle cx="19" cy="7" r="2.2"/><path d="M17 11h4.5v4a2.5 2.5 0 0 1-4.5 1.4"/>'
  };
  const icon = (n, cls = "") => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ""}</svg>`;

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const linkify = (s) => esc(s).replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]])/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const initials = (name) => { const p = String(name || "?").trim().split(/\s+/); return ((p[0] || "")[0] || "?").toUpperCase() + ((p[1] || "")[0] || "").toUpperCase(); };
  const avatar = (u, cls = "") => `<span class="avatar ${cls}" style="background:${esc(u.color || "#6C3CE1")}">${esc(initials(u.name))}</span>`;
  const firstName = (n) => String(n || "").trim().split(/\s+/)[0] || "";

  /* ---------- Fechas (hora de Colombia) ---------- */
  const fmt = (d, opts) => new Intl.DateTimeFormat("es-CO", { timeZone: TZ, ...opts }).format(new Date(d));
  const fDate = (d) => fmt(d, { weekday: "long", day: "numeric", month: "long" });
  const fShort = (d) => fmt(d, { day: "numeric", month: "short" });
  const fTime = (d) => fmt(d, { hour: "numeric", minute: "2-digit", hour12: true }).replace("a. m.", "a. m.").replace("p. m.", "p. m.");
  const fDay = (d) => fmt(d, { day: "numeric" });
  const fMon = (d) => fmt(d, { month: "short" }).replace(".", "");
  const fWeekday = (d) => fmt(d, { weekday: "short" }).replace(".", "");
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  function ago(ts) {
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 60) return "ahora";
    if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
    if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
    if (s < 604800) return `hace ${Math.floor(s / 86400)} d`;
    return fShort(ts);
  }
  function parts(ms) {
    ms = Math.max(0, ms);
    return { d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60, s: Math.floor(ms / 1e3) % 60 };
  }
  const utcStamp = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  function gcalUrl(title, start, end, details) {
    const p = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${utcStamp(start)}/${utcStamp(end)}`, details: details || "", ctz: TZ });
    return "https://calendar.google.com/calendar/render?" + p.toString();
  }
  function downloadICS(events, filename = "cronograma-ia-productiva.ics") {
    const escI = (s) => String(s).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//IA Productiva//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    events.forEach((e, i) => {
      lines.push("BEGIN:VEVENT", `UID:iap-${i}-${utcStamp(e.start)}@ia-productiva`, `DTSTAMP:${utcStamp(Date.now())}`, `DTSTART:${utcStamp(e.start)}`, `DTEND:${utcStamp(e.end)}`, `SUMMARY:${escI(e.title)}`, `DESCRIPTION:${escI(e.desc || "")}`);
      if (e.alarm) lines.push("BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:Recordatorio", "END:VALARM");
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ---------- Teams ---------- */
  const teamsLink = (url) => url || (window.Backend.course && window.Backend.course.info.teamsEquipo) || "https://teams.microsoft.com/";

  /* ---------- YouTube ---------- */
  function ytId(url) {
    if (!url) return null;
    const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
    return m ? m[1] : (/^[\w-]{11}$/.test(url) ? url : null);
  }

  /* ---------- Avisos (toasts) ---------- */
  function toast(msg, type = "") {
    const box = document.getElementById("toasts");
    const el = document.createElement("div");
    el.className = "toast " + type;
    el.innerHTML = (type === "ok" ? icon("check") : type === "bad" ? icon("info") : icon("sparkles")) + `<span>${esc(msg)}</span>`;
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; setTimeout(() => el.remove(), 300); }, 3200);
  }

  /* ---------- Modal ---------- */
  function modal({ title, body, foot = "", wide = false, onOpen, onClose }) {
    const bg = document.createElement("div");
    bg.className = "modal-bg";
    bg.innerHTML = `<div class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head"><h3>${title}</h3><button class="btn-icon btn" data-close aria-label="Cerrar">${icon("x")}</button></div>
      <div class="modal-body">${body}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ""}</div>`;
    const close = () => { bg.remove(); document.removeEventListener("keydown", onKey); onClose && onClose(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    bg.addEventListener("click", (e) => { if (e.target === bg || e.target.closest("[data-close]")) close(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(bg);
    const m = bg.querySelector(".modal");
    onOpen && onOpen(m, close);
    const f = m.querySelector("input,textarea,select,button:not([data-close])"); if (f) setTimeout(() => f.focus(), 30);
    return { el: m, close };
  }
  function confirmDialog(title, text, okLabel = "Confirmar", danger = false) {
    return new Promise((resolve) => {
      let done = false;
      modal({
        title, body: `<p class="mb0">${text}</p>`,
        foot: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-ok>${okLabel}</button>`,
        onOpen: (m, close) => m.querySelector("[data-ok]").addEventListener("click", () => { done = true; close(); resolve(true); }),
        onClose: () => { if (!done) resolve(false); }
      });
    });
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast("Copiado al portapapeles", "ok"); }
    catch (e) {
      const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast("Copiado al portapapeles", "ok"); } catch (e2) { toast("No se pudo copiar", "bad"); }
      ta.remove();
    }
  }

  /* ---------- Confeti ---------- */
  function confetti() {
    const c = document.createElement("canvas"); c.className = "confetti"; document.body.appendChild(c);
    const ctx = c.getContext("2d"); c.width = innerWidth; c.height = innerHeight;
    const cols = ["#6C3CE1", "#0EA5A4", "#F2545B", "#F5A524", "#8B5CF6", "#22C55E"];
    const ps = Array.from({ length: 140 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .4, r: 4 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)], vy: 2 + Math.random() * 4, vx: -2 + Math.random() * 4, a: Math.random() * 6, va: -.2 + Math.random() * .4 }));
    let t = 0;
    (function tick() {
      ctx.clearRect(0, 0, c.width, c.height);
      ps.forEach((p) => { p.y += p.vy; p.x += p.vx; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6); ctx.restore(); });
      if (++t < 170) requestAnimationFrame(tick); else c.remove();
    })();
  }

  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const rapOf = (n) => (window.Backend.course.raps || []).find((r) => String(r.n) === String(n) || r.id === n);

  window.UI = { icon, esc, linkify, $, $$, initials, avatar, firstName, fmt, fDate, fShort, fTime, fDay, fMon, fWeekday, cap, ago, parts, gcalUrl, downloadICS, teamsLink, ytId, toast, modal, confirmDialog, copy, confetti, shuffle, rapOf };
})();
