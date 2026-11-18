/* =====================================================================
   ACTIVIDADES INTERACTIVAS AUTOCALIFICABLES
   Tipos: quiz · vf · completar · parejas · orden · html (propio)
   Cada actividad vive dentro del RAP: raps[n].actividades[]
   {id, titulo, descripcion, tipo, minimo, mezclar, items[], html, url, manual}
   window.Activities.run(contenedor, actividad, { onDone(score, detalle) })
   ===================================================================== */
(function () {
  const U = window.UI; const { esc } = U;

  const TIPOS = {
    quiz: { nombre: "Selección múltiple", icono: "✅", ayuda: "Una pregunta con varias opciones y una sola correcta." },
    vf: { nombre: "Verdadero o falso", icono: "⚖️", ayuda: "Afirmaciones que el aprendiz marca como verdaderas o falsas." },
    completar: { nombre: "Completar espacios", icono: "✍️", ayuda: "Texto con huecos. Escribe la respuesta entre [[dobles corchetes]]; usa | para respuestas alternativas." },
    parejas: { nombre: "Relacionar parejas", icono: "🔗", ayuda: "Cada concepto se relaciona con su definición." },
    orden: { nombre: "Ordenar pasos", icono: "🔢", ayuda: "Escribe los pasos en el orden correcto; la plataforma los revuelve." },
    html: { nombre: "HTML propio / enlace", icono: "🧩", ayuda: "Pega el código de una actividad hecha con Claude (o un enlace para incrustar). Puede enviar su nota a la plataforma." }
  };

  const TEMPLATES = {
    quiz: () => [{ q: "Escribe aquí la pregunta", opciones: "Opción A | Opción B | Opción C", correcta: 1, expl: "" }],
    vf: () => [{ q: "Escribe aquí una afirmación", correcta: "v", expl: "" }],
    completar: () => [{ texto: "La IA generativa crea [[contenido|textos|imágenes]] nuevo a partir de instrucciones.", expl: "" }],
    parejas: () => [{ a: "Concepto 1", b: "Definición 1" }, { a: "Concepto 2", b: "Definición 2" }],
    orden: () => [{ t: "Primer paso" }, { t: "Segundo paso" }, { t: "Tercer paso" }],
    html: () => []
  };
  const uid = () => "act" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const newActivity = (tipo = "quiz") => ({ id: uid(), titulo: "Nueva actividad", descripcion: "", tipo, minimo: 70, mezclar: "no", items: TEMPLATES[tipo](), html: "", url: "", manual: "no" });

  const norm = (t) => String(t == null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ").trim();
  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const opts = (s) => String(s || "").split(/\s*\|\s*|\n/).map((x) => x.trim()).filter(Boolean);
  const pct = (ok, n) => (n ? Math.round((ok / n) * 100) : 0);

  /* ---------- cada tipo: build(items) → { html, grade(root) → { score, marks[] } } ---------- */
  const T = {
    quiz(items) {
      return {
        html: items.map((it, i) => `<div class="q" data-i="${i}"><p class="qt"><b>${i + 1}.</b> ${esc(it.q)}</p>${opts(it.opciones).map((o, k) => `<label class="opt"><input type="radio" name="q${i}" value="${k + 1}"><span>${esc(o)}</span></label>`).join("")}<div class="fb"></div></div>`).join(""),
        grade(root) {
          let ok = 0;
          items.forEach((it, i) => {
            const q = root.querySelector(`.q[data-i="${i}"]`); const sel = q.querySelector("input:checked"); const good = Number(it.correcta) === Number(sel && sel.value);
            if (good) ok++; q.classList.toggle("good", good); q.classList.toggle("bad", !good);
            q.querySelector(".fb").innerHTML = (good ? "✔ Correcto." : `✘ Respuesta correcta: <b>${esc(opts(it.opciones)[Number(it.correcta) - 1] || "")}</b>.`) + (it.expl ? " " + esc(it.expl) : "");
          });
          return { score: pct(ok, items.length), ok, n: items.length };
        }
      };
    },
    vf(items) {
      return {
        html: items.map((it, i) => `<div class="q" data-i="${i}"><p class="qt"><b>${i + 1}.</b> ${esc(it.q)}</p><div class="flex" style="gap:.5rem"><label class="opt"><input type="radio" name="q${i}" value="v"><span>Verdadero</span></label><label class="opt"><input type="radio" name="q${i}" value="f"><span>Falso</span></label></div><div class="fb"></div></div>`).join(""),
        grade(root) {
          let ok = 0;
          items.forEach((it, i) => { const q = root.querySelector(`.q[data-i="${i}"]`); const sel = q.querySelector("input:checked"); const good = !!sel && sel.value === it.correcta; if (good) ok++; q.classList.toggle("good", good); q.classList.toggle("bad", !good); q.querySelector(".fb").innerHTML = (good ? "✔ Correcto." : `✘ Era <b>${it.correcta === "v" ? "verdadero" : "falso"}</b>.`) + (it.expl ? " " + esc(it.expl) : ""); });
          return { score: pct(ok, items.length), ok, n: items.length };
        }
      };
    },
    completar(items) {
      const parts = items.map((it) => { const blanks = []; const html = esc(it.texto).replace(/\[\[(.+?)\]\]/g, (_, a) => { blanks.push(a.split("|").map((x) => x.trim()).filter(Boolean)); return `<input class="blank" data-b="${blanks.length - 1}" autocomplete="off" size="${Math.max(6, Math.min(24, (blanks[blanks.length - 1][0] || "").length + 2))}">`; }); return { html, blanks }; });
      return {
        html: items.map((it, i) => `<div class="q" data-i="${i}"><p class="qt"><b>${i + 1}.</b> ${parts[i].html}</p><div class="fb"></div></div>`).join(""),
        grade(root) {
          let ok = 0, n = 0;
          items.forEach((it, i) => {
            const q = root.querySelector(`.q[data-i="${i}"]`); let all = true; const miss = [];
            parts[i].blanks.forEach((alts, b) => { n++; const inp = q.querySelector(`[data-b="${b}"]`); const good = alts.some((a) => norm(a) === norm(inp.value)); inp.classList.toggle("good", good); inp.classList.toggle("bad", !good); if (good) ok++; else { all = false; miss.push(alts[0]); } });
            q.classList.toggle("good", all); q.classList.toggle("bad", !all);
            q.querySelector(".fb").innerHTML = (all ? "✔ Correcto." : `✘ Respuesta${miss.length > 1 ? "s" : ""}: <b>${esc(miss.join(", "))}</b>.`) + (it.expl ? " " + esc(it.expl) : "");
          });
          return { score: pct(ok, n), ok, n };
        }
      };
    },
    parejas(items) {
      const rights = shuffle(items.map((x) => x.b));
      return {
        html: `<div class="q">${items.map((it, i) => `<div class="pair" data-i="${i}"><span class="pl">${esc(it.a)}</span><select class="input"><option value="">Elige…</option>${rights.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join("")}</select><span class="fb"></span></div>`).join("")}</div>`,
        grade(root) {
          let ok = 0;
          items.forEach((it, i) => { const row = root.querySelector(`.pair[data-i="${i}"]`); const good = row.querySelector("select").value === it.b; if (good) ok++; row.classList.toggle("good", good); row.classList.toggle("bad", !good); row.querySelector(".fb").innerHTML = good ? "✔" : `✘ <b>${esc(it.b)}</b>`; });
          return { score: pct(ok, items.length), ok, n: items.length };
        }
      };
    },
    orden(items) {
      let order = shuffle(items.map((_, i) => i)); if (items.length > 1 && order.every((v, i) => v === i)) order = order.reverse();
      return {
        html: `<div class="q ordl"></div>`,
        mount(root) {
          const box = root.querySelector(".ordl");
          const draw = (marks) => { box.innerHTML = order.map((idx, pos) => `<div class="ord ${marks ? (marks[pos] ? "good" : "bad") : ""}"><span class="n">${pos + 1}</span><span class="t">${esc(items[idx].t)}</span><button type="button" class="btn btn-icon btn-sm" data-m="${pos}|-1" aria-label="Subir">▲</button><button type="button" class="btn btn-icon btn-sm" data-m="${pos}|1" aria-label="Bajar">▼</button></div>`).join(""); };
          draw(); box.addEventListener("click", (e) => { const b = e.target.closest("[data-m]"); if (!b) return; const [p, d] = b.dataset.m.split("|").map(Number); const q = p + d; if (q < 0 || q >= order.length) return; [order[p], order[q]] = [order[q], order[p]]; draw(); });
          root._redraw = draw;
        },
        grade(root) { const marks = order.map((idx, pos) => idx === pos); const ok = marks.filter(Boolean).length; root._redraw(marks); return { score: pct(ok, items.length), ok, n: items.length }; }
      };
    }
  };

  /* ---------- ejecuta una actividad dentro de un contenedor ---------- */
  function run(box, act, { onDone, preview } = {}) {
    const minimo = Number(act.minimo) || 70;
    if (act.tipo === "html") return runHtml(box, act, { onDone, preview, minimo });
    let items = (act.items || []).filter((x) => x && (x.q || x.texto || x.a || x.t));
    if (!items.length) { box.innerHTML = `<div class="empty">Esta actividad aún no tiene contenido.</div>`; return; }
    if (act.mezclar === "si" && act.tipo !== "orden" && act.tipo !== "parejas") items = shuffle(items);
    const T0 = T[act.tipo] || T.quiz; const b = T0(items);
    box.innerHTML = `<div class="iact">${act.descripcion ? `<p class="muted small">${esc(act.descripcion)}</p>` : ""}<div class="iform">${b.html}</div>
      <div class="iresult" hidden></div><div class="flex wrap mt"><button class="btn btn-primary" data-grade>Calificar</button><button class="btn" data-retry hidden>Intentar de nuevo</button><span class="xs muted">Se aprueba con ${minimo}% o más.</span></div></div>`;
    const form = box.querySelector(".iform"); if (b.mount) b.mount(form);
    const res = box.querySelector(".iresult"), gb = box.querySelector("[data-grade]"), rb = box.querySelector("[data-retry]");
    gb.addEventListener("click", async () => {
      const r = b.grade(form); const pass = r.score >= minimo;
      res.hidden = false; res.className = "iresult " + (pass ? "ok" : "no");
      res.innerHTML = `<div class="big">${r.score}%</div><div><b>${pass ? "¡Actividad aprobada!" : "Aún no alcanzas el mínimo"}</b><br><span class="small">${r.ok} de ${r.n} correctas${pass ? "" : ". Revisa las respuestas e inténtalo otra vez."}</span></div>`;
      gb.hidden = true; rb.hidden = false; form.classList.add("done"); form.querySelectorAll("input,select,button").forEach((x) => (x.disabled = true));
      if (onDone) await onDone(r.score, { ok: r.ok, n: r.n });
    });
    rb.addEventListener("click", () => run(box, act, { onDone, preview }));
  }

  function runHtml(box, act, { onDone, preview, minimo }) {
    const frame = document.createElement("iframe");
    frame.className = "iframe-act"; frame.setAttribute("sandbox", "allow-scripts allow-forms allow-popups" + (act.html && act.html.trim() ? "" : " allow-same-origin")); frame.setAttribute("title", act.titulo || "Actividad");
    if (act.html && act.html.trim()) frame.srcdoc = act.html; else if (act.url) frame.src = act.url;
    box.innerHTML = `${act.descripcion ? `<p class="muted small">${esc(act.descripcion)}</p>` : ""}<div class="iframe-wrap"></div><div class="iresult" hidden></div>
      <div class="flex wrap mt">${act.manual === "si" ? `<button class="btn btn-primary" data-done>Marcar como completada</button>` : `<span class="xs muted">Al terminar la actividad, tu resultado se registra solo (mínimo ${minimo}%).</span>`}</div>`;
    box.querySelector(".iframe-wrap").appendChild(frame);
    const show = (score) => { const res = box.querySelector(".iresult"), pass = score >= minimo; res.hidden = false; res.className = "iresult " + (pass ? "ok" : "no"); res.innerHTML = `<div class="big">${score}%</div><div><b>${pass ? "¡Actividad aprobada!" : "Aún no alcanzas el mínimo"}</b><br><span class="small">Resultado registrado.</span></div>`; };
    const onMsg = async (e) => {
      if (e.source !== frame.contentWindow) return; const d = e.data || {}; let s = d.iapScore != null ? d.iapScore : d.type === "iap-score" ? d.score : null; if (s == null) return;
      s = Math.max(0, Math.min(100, Math.round(Number(s)))); if (isNaN(s)) return; show(s); if (onDone) await onDone(s, { html: true });
    };
    window.addEventListener("message", onMsg);
    const obs = new MutationObserver(() => { if (!document.body.contains(frame)) { window.removeEventListener("message", onMsg); obs.disconnect(); } }); obs.observe(document.body, { childList: true, subtree: true });
    const d = box.querySelector("[data-done]"); if (d) d.addEventListener("click", async () => { d.disabled = true; show(100); if (onDone) await onDone(100, { manual: true }); });
  }

  /* ---------- ventana para realizar la actividad (con guardado de resultado) ---------- */
  function open(act, rap, { preview = false, onSaved } = {}) {
    const B = window.Backend;
    return U.modal({
      title: `${TIPOS[act.tipo] ? TIPOS[act.tipo].icono : "🧩"} ${esc(act.titulo)}${preview ? ' <span class="state pend">Vista previa</span>' : ""}`, wide: true, body: `<div id="actbox"></div>`,
      onOpen: (m) => run(m.querySelector("#actbox"), act, {
        preview, onDone: async (score, det) => {
          if (preview) return;
          try { await B.saveResult({ actId: act.id, rapId: rap.id, titulo: act.titulo, score, minimo: Number(act.minimo) || 70 }); U.toast("Resultado guardado", "ok"); onSaved && onSaved(); } catch (e) { U.toast("No se pudo guardar el resultado: " + e.message, "bad"); }
        }
      })
    });
  }

  window.Activities = { TIPOS, newActivity, run, open, TEMPLATES };
})();
