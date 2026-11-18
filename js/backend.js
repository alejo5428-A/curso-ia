/* =====================================================================
   BACKEND · cuentas, contenido del curso, chat, mensajes privados,
   anuncios y reportes. Dos modos con la misma interfaz:
   · FIREBASE   → datos compartidos en la nube.
   · DEMO LOCAL → todo en el navegador (para probar).
   ===================================================================== */
(function () {
  const CFG = window.APP_CONFIG;
  const FB_VERSION = "10.12.2";
  const authListeners = new Set(), courseListeners = new Set();
  let current = null, course = null;

  const COLORS = ["#6C3CE1", "#0EA5A4", "#F2545B", "#F5A524", "#2563EB", "#DB2777", "#16A34A", "#9333EA", "#EA580C", "#0891B2"];
  const pickColor = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return COLORS[h % COLORS.length]; };
  const isInstructorEmail = (email) => { const extra = (course && course.info && course.info.admins) || []; return [...(CFG.instructores || []), ...extra].map((e) => String(e).toLowerCase().trim()).includes(String(email || "").toLowerCase().trim()); };
  const emitAuth = () => authListeners.forEach((fn) => { try { fn(current); } catch (e) { console.error(e); } });
  const emitCourse = () => courseListeners.forEach((fn) => { try { fn(course); } catch (e) { console.error(e); } });
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const defaults = () => clone(window.COURSE_DEFAULTS);

  function firebaseConfigured() {
    const f = CFG.firebase || {};
    return !!(f.apiKey && f.projectId && !/^TU_/i.test(f.apiKey) && !/^TU_/i.test(f.projectId));
  }
  const BAD = ["hijueputa", "hpta", "gonorrea", "malparido", "marica", "puta", "mierda", "idiota", "imbécil", "imbecil", "estúpido", "estupido", "pendejo", "huevón", "huevon", "careverga", "culo"];
  function cleanText(t, max = 600) {
    let out = String(t || "").trim().slice(0, max);
    BAD.forEach((w) => { out = out.replace(new RegExp("\\b" + w + "\\b", "gi"), (m) => m[0] + "•".repeat(m.length - 1)); });
    return out;
  }

  /* ================================ DEMO LOCAL ================================ */
  function LocalBackend() {
    const K = { users: "iap_users", session: "iap_session", ann: "iap_ann", reports: "iap_reports", course: "iap_course", chat: "iap_chat", dmIdx: "iap_dm_threads", dm: (u) => "iap_dm_" + u };
    const bus = new EventTarget();
    const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
    const write = (k, v) => { localStorage.setItem(k, JSON.stringify(v)); bus.dispatchEvent(new CustomEvent("change", { detail: k })); };
    window.addEventListener("storage", (e) => { if (e.key) bus.dispatchEvent(new CustomEvent("change", { detail: e.key })); });
    const uid = () => "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const sub = (key, fire) => { const h = (e) => { if (e.detail === key) fire(); }; bus.addEventListener("change", h); fire(); return () => bus.removeEventListener("change", h); };
    async function hash(text) {
      try { const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
      catch (e) { let h = 5381; for (const c of text) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return "x" + h.toString(16); }
    }
    const pub = (u) => { if (!u) return null; const { hash: _h, salt: _s, ...rest } = u; return rest; };
    const usersObj = () => read(K.users, {});
    const saveUser = (u) => { const all = usersObj(); all[u.email] = u; write(K.users, all); };
    const byUid = (id) => Object.values(usersObj()).find((u) => u.uid === id);
    const role = (email) => (isInstructorEmail(email) ? "instructor" : "aprendiz");

    return {
      mode: "local",
      async init() {
        course = read(K.course, null) || defaults();
        if (!localStorage.getItem("iap_seeded")) {
          write(K.ann, [{ id: "a1", title: "Bienvenida al curso", body: "Explora cada RAP, revisa el cronograma y escribe en el chat si tienes dudas. ¡Éxitos!", ts: Date.now() - 36e5, author: course.info.instructor }]);
          localStorage.setItem("iap_seeded", "1");
        }
        const id = localStorage.getItem(K.session);
        const u = id && byUid(id);
        if (u) { u.lastLogin = Date.now(); u.role = role(u.email); saveUser(u); current = pub(u); }
        sub(K.course, () => { course = read(K.course, null) || defaults(); emitCourse(); });
      },
      async register({ name, email, password, ficha, municipio }) {
        email = email.toLowerCase().trim();
        if (usersObj()[email]) throw new Error("Ya existe una cuenta con ese correo. Ingresa con tu contraseña.");
        const salt = Math.random().toString(36).slice(2);
        const u = { uid: uid(), name: name.trim(), email, ficha: String(ficha).trim(), municipio: (municipio || "").trim(), role: role(email), color: pickColor(email), createdAt: Date.now(), lastLogin: Date.now(), salt, hash: await hash(salt + password) };
        saveUser(u); localStorage.setItem(K.session, u.uid); current = pub(u); emitAuth(); return current;
      },
      async login(email, password) {
        const u = usersObj()[email.toLowerCase().trim()];
        if (!u || u.hash !== (await hash(u.salt + password))) throw new Error("Correo o contraseña incorrectos.");
        u.lastLogin = Date.now(); u.role = role(u.email); saveUser(u); localStorage.setItem(K.session, u.uid); current = pub(u); emitAuth();
      },
      async logout() { localStorage.removeItem(K.session); current = null; emitAuth(); },
      /* Importación masiva: cada aprendiz queda con su correo como usuario y su documento como clave inicial. */
      async importRoster(rows, onProgress) {
        const res = { creados: 0, existentes: 0, errores: [] };
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i], email = String(r.email || "").toLowerCase().trim();
          try {
            if (!email || !r.doc) throw new Error("Falta correo o documento.");
            const ex = usersObj()[email];
            if (ex) { if (r.ficha && !ex.ficha) { ex.ficha = r.ficha; saveUser(ex); } res.existentes++; }
            else { const salt = Math.random().toString(36).slice(2); saveUser({ uid: uid(), name: r.name, email, ficha: r.ficha || "", municipio: "", role: role(email), color: pickColor(email), createdAt: Date.now(), lastLogin: 0, imported: true, salt, hash: await hash(salt + String(r.doc)) }); res.creados++; }
          } catch (e) { res.errores.push({ email, msg: e.message }); }
          if (onProgress) onProgress(i + 1, rows.length, email);
        }
        return res;
      },
      async changePassword(current_, next) {
        const u = byUid(current.uid); if (u.hash !== (await hash(u.salt + current_))) throw new Error("La contraseña actual no es correcta.");
        if (String(next).length < 8) throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
        u.salt = Math.random().toString(36).slice(2); u.hash = await hash(u.salt + next); saveUser(u);
      },
      async resetPassword() { throw new Error("En el modo demostración no se envían correos. Activa Firebase (README.md) o crea otra cuenta."); },
      async updateProfile(patch) { const u = byUid(current.uid); delete patch.role; delete patch.email; Object.assign(u, patch); saveUser(u); current = pub(u); emitAuth(); },
      async listUsers() { return Object.values(usersObj()).map(pub).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); },
      async deleteUser(id) { const all = usersObj(); for (const k in all) if (all[k].uid === id) delete all[k]; write(K.users, all); },
      async listDirectory() { return Object.values(usersObj()).map((u) => ({ uid: u.uid, name: u.name, ficha: u.ficha || "", municipio: u.municipio || "", color: u.color, role: u.role })); },
      /* calificaciones: { [correo]: { email, name, ficha, raps: { rap1: { nota, estado } }, obs } } */
      async listGrades() { return read("iap_grades", {}); },
      async saveGrades(map) { write("iap_grades", map); },
      async myGrades() { return read("iap_grades", {})[current.email.toLowerCase()] || null; },
      async setRapGrade(who, rapId, data) { const all = read("iap_grades", {}); const k = String(who.email).toLowerCase(); const g = all[k] || { email: k, name: who.name, ficha: who.ficha || "", raps: {}, obs: "" }; g.raps = g.raps || {}; g.raps[rapId] = data; if (!g.name) g.name = who.name; all[k] = g; write("iap_grades", all); },
      /* entregas (enlaces a Drive) y resultados de actividades */
      async saveSubmission({ rapId, link, comment, late }) {
        const all = read("iap_subs", {}); const k = current.uid + "_" + rapId; const prev = all[k] || {};
        all[k] = { ...prev, uid: current.uid, rapId, name: current.name, email: current.email, ficha: current.ficha || "", link: String(link || "").trim(), comment: cleanText(comment, 500), late: !!late, ts: Date.now(), intentos: (prev.intentos || 0) + 1 };
        write("iap_subs", all);
      },
      async mySubmissions() { const out = {}; Object.values(read("iap_subs", {})).forEach((x) => { if (x.uid === current.uid) out[x.rapId] = x; }); return out; },
      async listSubmissions() { return Object.values(read("iap_subs", {})); },
      async reviewSubmission(who, rapId, rev) {
        const all = read("iap_subs", {}); const k = who.uid + "_" + rapId;
        all[k] = { ...(all[k] || { uid: who.uid, rapId, name: who.name, email: who.email, ficha: who.ficha || "" }), rev: { ...rev, ts: Date.now() } }; write("iap_subs", all);
      },
      async saveResult({ actId, rapId, titulo, score, minimo }) {
        const all = read("iap_results", {}); const k = current.uid + "_" + actId; const p = all[k] || {};
        all[k] = { uid: current.uid, name: current.name, email: current.email, ficha: current.ficha || "", actId, rapId, titulo, last: score, best: Math.max(p.best || 0, score), intentos: (p.intentos || 0) + 1, passed: Math.max(p.best || 0, score) >= (minimo || 70), ts: Date.now() };
        write("iap_results", all);
      },
      async myResults() { const out = {}; Object.values(read("iap_results", {})).forEach((x) => { if (x.uid === current.uid) out[x.actId] = x; }); return out; },
      async listResults() { return Object.values(read("iap_results", {})); },
      /* contenido */
      async saveCourse(c) { course = clone(c); write(K.course, course); emitCourse(); },
      /* chat general */
      subscribeChat(cb) { return sub(K.chat, () => cb(read(K.chat, []).slice(-200))); },
      async sendChat(text) { const l = read(K.chat, []); l.push({ id: uid(), uid: current.uid, name: current.name, ficha: current.ficha, role: current.role, color: current.color, text: cleanText(text), ts: Date.now() }); write(K.chat, l.slice(-400)); },
      async deleteChat(id) { write(K.chat, read(K.chat, []).filter((m) => m.id !== id)); },
      async reportChat(m) { const r = read(K.reports, []); r.push({ id: uid(), msgId: m.id, text: m.text, author: m.name, by: current.name, ts: Date.now() }); write(K.reports, r); },
      async listReports() { return read(K.reports, []).sort((a, b) => b.ts - a.ts); },
      async resolveReport(id) { write(K.reports, read(K.reports, []).filter((r) => r.id !== id)); },
      /* mensajes privados (aprendiz ↔ instructor) */
      subscribeDM(threadUid, cb) { return sub(K.dm(threadUid), () => cb(read(K.dm(threadUid), []))); },
      async sendDM(threadUid, text) {
        const l = read(K.dm(threadUid), []); const m = { id: uid(), uid: current.uid, name: current.name, role: current.role, color: current.color, text: cleanText(text), ts: Date.now() };
        l.push(m); write(K.dm(threadUid), l.slice(-400));
        const idx = read(K.dmIdx, {}); const owner = byUid(threadUid) || current;
        const th = idx[threadUid] || { uid: threadUid, name: owner.name, ficha: owner.ficha || "", color: owner.color, readUser: 0, readInst: 0 };
        Object.assign(th, { lastText: m.text, lastTs: m.ts, lastFrom: current.role });
        if (current.role === "instructor") th.readInst = m.ts; else th.readUser = m.ts;
        idx[threadUid] = th; write(K.dmIdx, idx);
      },
      subscribeDMThreads(cb) { return sub(K.dmIdx, () => cb(Object.values(read(K.dmIdx, {})).sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0)))); },
      async markDMRead(threadUid) { const idx = read(K.dmIdx, {}); if (!idx[threadUid]) return; if (current.role === "instructor") idx[threadUid].readInst = Date.now(); else idx[threadUid].readUser = Date.now(); write(K.dmIdx, idx); },
      /* anuncios */
      subscribeAnnouncements(cb) { return sub(K.ann, () => cb(read(K.ann, []).sort((a, b) => b.ts - a.ts))); },
      async postAnnouncement({ title, body }) { const a = read(K.ann, []); a.push({ id: uid(), title, body, ts: Date.now(), author: current.name }); write(K.ann, a); },
      async deleteAnnouncement(id) { write(K.ann, read(K.ann, []).filter((a) => a.id !== id)); }
    };
  }

  /* ================================ FIREBASE ================================ */
  function FirebaseBackend() {
    let A, F, auth, db, FBAPP, registering = false;
    const base = `https://www.gstatic.com/firebasejs/${FB_VERSION}/`;
    const ERR = { "auth/email-already-in-use": "Ya existe una cuenta con ese correo.", "auth/invalid-email": "El correo no es válido.", "auth/weak-password": "La contraseña debe tener al menos 8 caracteres.", "auth/invalid-credential": "Correo o contraseña incorrectos.", "auth/user-not-found": "No existe una cuenta con ese correo.", "auth/wrong-password": "Correo o contraseña incorrectos.", "auth/too-many-requests": "Demasiados intentos. Espera unos minutos.", "auth/network-request-failed": "No hay conexión a internet.", "permission-denied": "No tienes permiso para esta acción." };
    const tr = (e) => new Error(ERR[e && e.code] || (e && e.message) || "Ocurrió un error.");
    const ms = (ts) => (ts && ts.toMillis ? ts.toMillis() : typeof ts === "number" ? ts : Date.now());
    const role = (email) => (isInstructorEmail(email) ? "instructor" : "aprendiz");
    const wrap = (fn) => async (...a) => { try { return await fn(...a); } catch (e) { throw tr(e); } };
    async function loadProfile(fbUser) {
      const ref = F.doc(db, "users", fbUser.uid); const snap = await F.getDoc(ref); const r = role(fbUser.email);
      if (!snap.exists()) { const p = { uid: fbUser.uid, name: fbUser.displayName || fbUser.email.split("@")[0], email: fbUser.email, ficha: "", municipio: "", role: r, color: pickColor(fbUser.email), createdAt: Date.now(), lastLogin: Date.now() }; await F.setDoc(ref, p); await F.setDoc(F.doc(db, "directory", fbUser.uid), { name: p.name, ficha: "", municipio: "", color: p.color, role: r }).catch(() => {}); return p; }
      const p = snap.data(); const patch = { lastLogin: Date.now() }; if (p.role !== r) patch.role = r; F.updateDoc(ref, patch).catch(() => {});
      F.setDoc(F.doc(db, "directory", fbUser.uid), { name: p.name, ficha: p.ficha || "", municipio: p.municipio || "", color: p.color, role: r }, { merge: true }).catch(() => {});
      return { ...p, ...patch, uid: fbUser.uid };
    }
    const dmThread = (uid) => F.doc(db, "dm", uid);
    return {
      mode: "firebase",
      async init() {
        const [appM, authM, fsM] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-auth.js"), import(base + "firebase-firestore.js")]);
        A = authM; F = fsM; FBAPP = appM; const app = appM.initializeApp(CFG.firebase); auth = A.getAuth(app); db = F.getFirestore(app);
        await new Promise((resolve) => {
          let first = true;
          F.onSnapshot(F.doc(db, "config", "course"), (s) => { course = s.exists() ? s.data() : defaults(); emitCourse(); if (first) { first = false; resolve(); } }, (e) => { console.warn("config/course", e); course = course || defaults(); if (first) { first = false; resolve(); } });
        });
        await new Promise((resolve) => {
          let first = true;
          A.onAuthStateChanged(auth, async (u) => { if (registering) return; try { current = u ? await loadProfile(u) : null; } catch (e) { console.error(e); current = null; } if (first) { first = false; resolve(); } else emitAuth(); });
        });
      },
      register: wrap(async ({ name, email, password, ficha, municipio }) => {
        registering = true;
        try {
          const cred = await A.createUserWithEmailAndPassword(auth, email.trim(), password);
          await A.updateProfile(cred.user, { displayName: name.trim() });
          const p = { uid: cred.user.uid, name: name.trim(), email: cred.user.email, ficha: String(ficha).trim(), municipio: (municipio || "").trim(), role: role(cred.user.email), color: pickColor(cred.user.email), createdAt: Date.now(), lastLogin: Date.now() };
          await F.setDoc(F.doc(db, "users", cred.user.uid), p);
          await F.setDoc(F.doc(db, "directory", cred.user.uid), { name: p.name, ficha: p.ficha, municipio: p.municipio, color: p.color, role: p.role }).catch(() => {});
          current = p; registering = false; emitAuth(); return p;
        } catch (e) { registering = false; throw e; }
      }),
      login: wrap((email, password) => A.signInWithEmailAndPassword(auth, email.trim(), password)),
      async logout() { await A.signOut(auth); },
      /* Importación masiva: se crean las cuentas con una segunda conexión para no cerrar la sesión del instructor. */
      importRoster: wrap(async (rows, onProgress) => {
        const res = { creados: 0, existentes: 0, errores: [] }; const sleep = (t) => new Promise((r) => setTimeout(r, t));
        let app2; try { app2 = FBAPP.getApp("import"); } catch (e) { app2 = FBAPP.initializeApp(CFG.firebase, "import"); }
        const auth2 = A.getAuth(app2), db2 = F.getFirestore(app2);
        const retry = async (fn) => { for (let k = 0; ; k++) { try { return await fn(); } catch (e) { if (k < 4 && e && (e.code === "auth/too-many-requests" || e.code === "auth/network-request-failed")) { await sleep(3000 * (k + 1)); continue; } throw e; } } };
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i], email = String(r.email || "").toLowerCase().trim(), doc = String(r.doc || "");
          try {
            if (!email || !doc) throw new Error("Falta correo o documento.");
            if (doc.length < 6) throw new Error("El documento tiene menos de 6 dígitos (mínimo que exige Firebase).");
            let cred, nuevo = false;
            try { cred = await retry(() => A.createUserWithEmailAndPassword(auth2, email, doc)); nuevo = true; }
            catch (e) {
              if (e.code !== "auth/email-already-in-use") throw e;
              try { cred = await retry(() => A.signInWithEmailAndPassword(auth2, email, doc)); }
              catch (e2) { res.existentes++; res.errores.push({ email, msg: "Ya tenía cuenta con otra contraseña; no se tocó.", aviso: true }); if (onProgress) onProgress(i + 1, rows.length, email); continue; }
            }
            const u = cred.user; if (nuevo) await A.updateProfile(u, { displayName: r.name });
            const ref = F.doc(db2, "users", u.uid), snap = await F.getDoc(ref);
            if (!snap.exists()) {
              const p = { uid: u.uid, name: r.name, email, ficha: r.ficha || "", municipio: "", role: role(email), color: pickColor(email), createdAt: Date.now(), lastLogin: 0, imported: true };
              await F.setDoc(ref, p); await F.setDoc(F.doc(db2, "directory", u.uid), { name: p.name, ficha: p.ficha, municipio: "", color: p.color, role: p.role });
              res.creados++;
            } else res.existentes++;
            await A.signOut(auth2);
          } catch (e) { res.errores.push({ email, msg: ERR[e && e.code] || (e && e.message) || "Error desconocido." }); try { await A.signOut(auth2); } catch (x) {} }
          if (onProgress) onProgress(i + 1, rows.length, email);
          await sleep(200);
        }
        return res;
      }),
      changePassword: wrap(async (current_, next) => {
        if (String(next).length < 8) throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
        const u = auth.currentUser; await A.reauthenticateWithCredential(u, A.EmailAuthProvider.credential(u.email, current_)); await A.updatePassword(u, next);
      }),
      resetPassword: wrap((email) => A.sendPasswordResetEmail(auth, email.trim())),
      updateProfile: wrap(async (patch) => { delete patch.role; delete patch.email; await F.updateDoc(F.doc(db, "users", current.uid), patch); current = { ...current, ...patch }; await F.setDoc(F.doc(db, "directory", current.uid), { name: current.name, ficha: current.ficha || "", municipio: current.municipio || "", color: current.color, role: current.role }, { merge: true }).catch(() => {}); emitAuth(); }),
      listUsers: wrap(async () => (await F.getDocs(F.collection(db, "users"))).docs.map((d) => ({ ...d.data(), uid: d.id })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))),
      deleteUser: wrap(async (id) => { await F.deleteDoc(F.doc(db, "users", id)); await F.deleteDoc(F.doc(db, "directory", id)).catch(() => {}); }),
      listDirectory: wrap(async () => (await F.getDocs(F.collection(db, "directory"))).docs.map((d) => ({ ...d.data(), uid: d.id }))),
      listGrades: wrap(async () => { const out = {}; (await F.getDocs(F.collection(db, "grades"))).docs.forEach((d) => { out[d.data().email] = d.data(); }); return out; }),
      saveGrades: wrap(async (map) => {
        const existing = (await F.getDocs(F.collection(db, "grades"))).docs.map((d) => d.id);
        const keys = Object.keys(map); const keyOf = (e) => e.toLowerCase().replace(/\./g, ",");
        for (const e of keys) await F.setDoc(F.doc(db, "grades", keyOf(e)), { ...map[e], email: e.toLowerCase(), updatedAt: Date.now() });
        for (const id of existing) if (!keys.some((e) => keyOf(e) === id)) await F.deleteDoc(F.doc(db, "grades", id));
      }),
      setRapGrade: wrap((who, rapId, data) => F.setDoc(F.doc(db, "grades", String(who.email).toLowerCase().replace(/\./g, ",")), { email: String(who.email).toLowerCase(), name: who.name || "", ficha: who.ficha || "", raps: { [rapId]: data }, updatedAt: Date.now() }, { merge: true })),
      myGrades: wrap(async () => { const s = await F.getDoc(F.doc(db, "grades", current.email.toLowerCase().replace(/\./g, ","))); return s.exists() ? s.data() : null; }),
      saveSubmission: wrap(async ({ rapId, link, comment, late }) => {
        const ref = F.doc(db, "subs", current.uid + "_" + rapId); const snap = await F.getDoc(ref); const prev = snap.exists() ? snap.data() : {};
        await F.setDoc(ref, { uid: current.uid, rapId, name: current.name, email: current.email, ficha: current.ficha || "", link: String(link || "").trim(), comment: cleanText(comment, 500), late: !!late, ts: Date.now(), intentos: (prev.intentos || 0) + 1 }, { merge: true });
      }),
      mySubmissions: wrap(async () => { const out = {}; (await F.getDocs(F.query(F.collection(db, "subs"), F.where("uid", "==", current.uid)))).docs.forEach((d) => { out[d.data().rapId] = d.data(); }); return out; }),
      listSubmissions: wrap(async () => (await F.getDocs(F.collection(db, "subs"))).docs.map((d) => d.data())),
      reviewSubmission: wrap((who, rapId, rev) => F.setDoc(F.doc(db, "subs", who.uid + "_" + rapId), { uid: who.uid, rapId, name: who.name, email: who.email, ficha: who.ficha || "", rev: { ...rev, ts: Date.now() } }, { merge: true })),
      saveResult: wrap(async ({ actId, rapId, titulo, score, minimo }) => {
        const ref = F.doc(db, "results", current.uid + "_" + actId); const snap = await F.getDoc(ref); const p = snap.exists() ? snap.data() : {}; const best = Math.max(p.best || 0, score);
        await F.setDoc(ref, { uid: current.uid, name: current.name, email: current.email, ficha: current.ficha || "", actId, rapId, titulo, last: score, best, intentos: (p.intentos || 0) + 1, passed: best >= (minimo || 70), ts: Date.now() });
      }),
      myResults: wrap(async () => { const out = {}; (await F.getDocs(F.query(F.collection(db, "results"), F.where("uid", "==", current.uid)))).docs.forEach((d) => { out[d.data().actId] = d.data(); }); return out; }),
      listResults: wrap(async () => (await F.getDocs(F.collection(db, "results"))).docs.map((d) => d.data())),
      saveCourse: wrap(async (c) => { await F.setDoc(F.doc(db, "config", "course"), clone(c)); course = clone(c); emitCourse(); }),
      subscribeChat(cb) { const q = F.query(F.collection(db, "chat"), F.orderBy("ts", "desc"), F.limit(200)); return F.onSnapshot(q, (s) => cb(s.docs.map((d) => ({ ...d.data(), id: d.id, ts: ms(d.data().ts) })).reverse()), (e) => { console.error(e); cb([]); }); },
      sendChat: wrap((text) => F.addDoc(F.collection(db, "chat"), { uid: current.uid, name: current.name, ficha: current.ficha || "", role: current.role, color: current.color, text: cleanText(text), ts: F.serverTimestamp() })),
      deleteChat: wrap((id) => F.deleteDoc(F.doc(db, "chat", id))),
      reportChat: wrap((m) => F.addDoc(F.collection(db, "reports"), { msgId: m.id, text: m.text, author: m.name, by: current.name, byUid: current.uid, ts: F.serverTimestamp() })),
      listReports: wrap(async () => (await F.getDocs(F.query(F.collection(db, "reports"), F.orderBy("ts", "desc"), F.limit(100)))).docs.map((d) => ({ ...d.data(), id: d.id, ts: ms(d.data().ts) }))),
      resolveReport: wrap((id) => F.deleteDoc(F.doc(db, "reports", id))),
      subscribeDM(threadUid, cb) { const q = F.query(F.collection(db, "dm", threadUid, "messages"), F.orderBy("ts", "desc"), F.limit(200)); return F.onSnapshot(q, (s) => cb(s.docs.map((d) => ({ ...d.data(), id: d.id, ts: ms(d.data().ts) })).reverse()), (e) => { console.error(e); cb([]); }); },
      sendDM: wrap(async (threadUid, text) => {
        const t = cleanText(text);
        await F.addDoc(F.collection(db, "dm", threadUid, "messages"), { uid: current.uid, name: current.name, role: current.role, color: current.color, text: t, ts: F.serverTimestamp() });
        const th = { uid: threadUid, lastText: t, lastTs: Date.now(), lastFrom: current.role };
        if (current.role === "instructor") th.readInst = Date.now(); else { th.readUser = Date.now(); th.name = current.name; th.ficha = current.ficha || ""; th.color = current.color; }
        await F.setDoc(dmThread(threadUid), th, { merge: true });
      }),
      subscribeDMThreads(cb) { return F.onSnapshot(F.collection(db, "dm"), (s) => cb(s.docs.map((d) => ({ ...d.data(), uid: d.id })).sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0))), (e) => { console.error(e); cb([]); }); },
      markDMRead: wrap((threadUid) => F.setDoc(dmThread(threadUid), current.role === "instructor" ? { readInst: Date.now() } : { readUser: Date.now() }, { merge: true })),
      subscribeAnnouncements(cb) { const q = F.query(F.collection(db, "announcements"), F.orderBy("ts", "desc"), F.limit(50)); return F.onSnapshot(q, (s) => cb(s.docs.map((d) => ({ ...d.data(), id: d.id, ts: ms(d.data().ts) }))), (e) => { console.error(e); cb([]); }); },
      postAnnouncement: wrap(({ title, body }) => F.addDoc(F.collection(db, "announcements"), { title, body, author: current.name, ts: F.serverTimestamp() })),
      deleteAnnouncement: wrap((id) => F.deleteDoc(F.doc(db, "announcements", id)))
    };
  }

  /* ================================ FACHADA ================================ */
  let impl = null;
  window.Backend = {
    get mode() { return impl ? impl.mode : "local"; },
    get user() { return current; },
    get course() { return course; },
    defaults,
    onAuth(fn) { authListeners.add(fn); return () => authListeners.delete(fn); },
    onCourse(fn) { courseListeners.add(fn); return () => courseListeners.delete(fn); },
    get preview() { try { return sessionStorage.getItem("iap_preview") === "1"; } catch (e) { return false; } },
    isInstructor() { return !!(current && current.role === "instructor") && !this.preview; },
    async init() {
      if (firebaseConfigured()) { try { impl = FirebaseBackend(); await impl.init(); return; } catch (e) { console.warn("Firebase no disponible; modo demo.", e); this.firebaseError = true; } }
      impl = LocalBackend(); await impl.init();
    }
  };
  ["register", "login", "logout", "importRoster", "changePassword", "resetPassword", "updateProfile", "listUsers", "deleteUser", "listDirectory", "listGrades", "saveGrades", "setRapGrade", "myGrades", "saveCourse", "saveSubmission", "mySubmissions", "listSubmissions", "reviewSubmission", "saveResult", "myResults", "listResults", "subscribeChat", "sendChat", "deleteChat", "reportChat", "listReports", "resolveReport", "subscribeDM", "sendDM", "subscribeDMThreads", "markDMRead", "subscribeAnnouncements", "postAnnouncement", "deleteAnnouncement"]
    .forEach((fn) => { window.Backend[fn] = (...a) => impl[fn](...a); });
})();
