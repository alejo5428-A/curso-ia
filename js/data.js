/* =====================================================================
   CONTENIDO POR DEFECTO DEL CURSO
   ---------------------------------------------------------------------
   Se usa la primera vez (o al «Restablecer» desde Administrar).
   Después, todo se edita desde la plataforma y queda guardado en la
   nube (Firebase) o en el navegador (modo demo).
   ===================================================================== */
window.COURSE_DEFAULTS = {
  version: 1,
  info: {
    marca: "IA Productiva",
    nombre: "Inteligencia Artificial Generativa como catalizador de la productividad",
    codigo: "11220151",
    horas: 48,
    competencia: "220501121 · Operar herramientas informáticas y digitales de acuerdo con protocolos y manuales técnicos",
    instructor: "Luis Alejandro Londoño Rivera",
    rolInstructor: "Instructor virtual · SENA",
    descripcion: "Aprende a usar la inteligencia artificial generativa para trabajar mejor: conoce las herramientas, escribe buenos prompts, evalúa los resultados y mejora tus procesos. Formación complementaria virtual con 4 sesiones en vivo por Microsoft Teams.",
    inicio: "2026-11-17",
    fin: "2026-12-02",
    utc: "-05:00",
    codigoInscripcion: "IAP2026",
    colorPrincipal: "#2F6FED",
    notaMinima: 70,
    presentacion: "Este programa te permitirá reconocer las plataformas de inteligencia artificial generativa, configurarlas y usarlas con prompts efectivos, evaluar la calidad de sus resultados y proponer mejoras documentadas en tus procesos de trabajo o estudio.\n\nEl curso se desarrolla con sesiones en vivo por Microsoft Teams y trabajo autónomo apoyado en el material de esta plataforma.",
    requisitos: "Computador o celular con navegador actualizado, conexión a internet y un correo personal. Edad mínima: 14 años.",
    teamsEquipo: "",
    notaAprobacion: "Las evidencias se califican de 1 a 100 y se aprueban con 70 o más.",
    actividadesActivas: "no",
    registroAbierto: "no",
    intensidad: "suave",
    colores: { sesion: "#3B82F6", material: "#22C55E", videos: "#A855F7", enlaces: "#14B8A6", evidencia: "#F59E0B" },
    admins: [],
    teamsDatos: "",
    mensajeEntregas: "Entrega con el formulario de cada RAP: tus datos, el comentario y tus archivos. Nómbralos EVn_Nombre_Apellido.pdf y App_vn_Nombre_Apellido.html."
  },
  raps: [
    {
      id: "rap1", n: 1, color: "#6C3CE1", corto: "Plataformas de IA",
      titulo: "Clasificar tipos de plataformas de IA generativa según su funcionalidad y aplicabilidad",
      descripcion: "Qué es la IA generativa, qué necesita tu equipo para usarla y cómo se clasifican las herramientas (texto, imagen, código y voz).",
      sesion: { fecha: "2026-11-18", horaInicio: "19:00", horaFin: "21:00", enlace: "", grabacion: "", datos: "" },
      materiales: [{"tipo": "estudio", "titulo": "Material de estudio RAP 1", "url": "recursos/Material_de_estudio_RAP1.pdf", "desc": "Lectura principal del RAP, con videos y ejemplos."}, {"tipo": "guia", "titulo": "Guía de aprendizaje · AA1 · EV1", "url": "recursos/Guia_de_aprendizaje_IA_Productiva.pdf", "desc": "Qué debes hacer, qué entregar y cómo se califica."}, {"tipo": "plantilla", "titulo": "Plantilla EV1", "url": "recursos/Plantilla_EV1_Comparativo_modelos_IA.docx", "desc": "Descárgala, diligénciala y entrégala en PDF."}, {"tipo": "ejemplo", "titulo": "Apps de ejemplo «Mi App con IA»", "url": "recursos/LEEME_Apps_de_Ejemplo.pdf", "desc": "Cinco apps de ejemplo en v1 y v2, y los prompts con que se hicieron."}],
      videos: [{"titulo": "IA generativa: qué es, cómo funciona y ejemplos", "url": "https://www.youtube.com/watch?v=rwFnTJ3Mp9g", "desc": "Instituto Data Science Argentina · 2025"}, {"titulo": "Cómo funciona ChatGPT (y otros LLM) explicado con un viaje a Japón", "url": "https://www.youtube.com/watch?v=FzpdRhwID2M", "desc": "Ester Serra · 2025"}, {"titulo": "ChatGPT vs Gemini vs Claude: ¿cuál es mejor en 2026?", "url": "https://www.youtube.com/watch?v=ek1D7ReIbB4", "desc": "TuTecnoMundo · 2026"}, {"titulo": "ChatGPT vs Gemini vs Claude: cuál pagaría en 2026", "url": "https://www.youtube.com/watch?v=Zim8hNQadqc", "desc": "Migue Baena IA · 2026"}, {"titulo": "7 herramientas de IA (gratuitas) que cambiarán tu vida en 2026", "url": "https://www.youtube.com/watch?v=vZKD8tOq1TU", "desc": "David Zamora · 2026"}, {"titulo": "8 generadores de voz con IA gratis en 2026", "url": "https://www.youtube.com/watch?v=8hJflwR9y_4", "desc": "PCSoftware & Android en Mundo Virtual Pro · 2026"}, {"titulo": "Así creé una app desde cero con Gemini de Google, ¡y no sé programar!", "url": "https://www.youtube.com/watch?v=uM68wv1LklE", "desc": "Marcelo Alejandro · 2025"}],
      recursos: [],
      criterios: ["Reconoce las condiciones mínimas de funcionamiento de acuerdo con la herramienta seleccionada", "Compara funcionalidades de herramientas en función de criterios técnicos"],
      evidencia: {
        formulario: "",
        respuestas: "",
        nombre: "EV1 · Comparativo de modelos de IA y propuesta de mi app", fecha: "2026-11-22", hora: "23:59", enlace: "",
        descripcion: "Compara mínimo 3 modelos de IA, elige con cuál construirás tu app y descríbela: nombre, problema que resuelve, mínimo 3 funciones y cómo te la imaginas. Entrega la plantilla EV1 en PDF (EV1_Nombre_Apellido.pdf).",
        rubrica: [["Tabla comparativa completa de mínimo 3 modelos", 35], ["Elección del modelo bien justificada", 25], ["Descripción clara de la app", 30], ["Sello de autor", 10]]
      }
    },
    {
      id: "rap2", n: 2, color: "#0EA5A4", corto: "Prompts y configuración",
      titulo: "Ejecutar comandos y prompts según objetivos de productividad",
      descripcion: "Registro y configuración segura de una herramienta de IA, la fórmula para escribir buenos prompts y la creación de tu propia app con IA.",
      sesion: { fecha: "2026-11-19", horaInicio: "19:00", horaFin: "21:00", enlace: "", grabacion: "", datos: "" },
      materiales: [{"tipo": "estudio", "titulo": "Material de estudio RAP 2", "url": "recursos/Material_de_estudio_RAP2.pdf", "desc": "Lectura principal del RAP, con videos y ejemplos."}, {"tipo": "guia", "titulo": "Guía de aprendizaje · AA2 · EV2", "url": "recursos/Guia_de_aprendizaje_IA_Productiva.pdf", "desc": "Qué debes hacer, qué entregar y cómo se califica."}, {"tipo": "plantilla", "titulo": "Plantilla EV2", "url": "recursos/Plantilla_EV2_Mi_app_v1.docx", "desc": "Descárgala, diligénciala y entrégala en PDF."}, {"tipo": "ejemplo", "titulo": "Apps de ejemplo «Mi App con IA»", "url": "recursos/LEEME_Apps_de_Ejemplo.pdf", "desc": "Cinco apps de ejemplo en v1 y v2, y los prompts con que se hicieron."}],
      videos: [{"titulo": "Curso de Prompt Engineering en español: cómo crear prompts efectivos (de 0 a pro)", "url": "https://www.youtube.com/watch?v=wM1NrkwJrvU", "desc": "Juan David Quintero · 2026"}, {"titulo": "Cómo escribir prompts para Claude (guía de Anthropic)", "url": "https://www.youtube.com/watch?v=p-Fu2RiEtJI", "desc": "Martin Reche IA · 2026"}, {"titulo": "Así creé una app desde cero con Gemini de Google, ¡y no sé programar!", "url": "https://www.youtube.com/watch?v=uM68wv1LklE", "desc": "Marcelo Alejandro · 2025"}],
      recursos: [],
      criterios: ["Establece configuraciones básicas conforme a protocolos técnicos", "Aplica instrucciones funcionales según necesidades de búsqueda"],
      evidencia: {
        formulario: "",
        respuestas: "",
        nombre: "EV2 · Mi app v1 y bitácora de prompts", fecha: "2026-11-24", hora: "23:59", enlace: "",
        descripcion: "Crea con IA la primera versión de tu app en un solo archivo .html, con mínimo 3 funciones y tu sello de autor. Registra en la plantilla tu prompt inicial, mínimo 2 prompts de corrección, 3 capturas y un problema que resolviste. Entrega App_v1_Nombre_Apellido.html y EV2_Nombre_Apellido.pdf.",
        rubrica: [["La app abre en el navegador y funciona", 35], ["Mínimo 3 funciones que sirven", 20], ["Prompt inicial y prompts de corrección", 20], ["Capturas y problema resuelto", 15], ["Sello de autor en la app y en la plantilla", 10]]
      }
    },
    {
      id: "rap3", n: 3, color: "#F2545B", corto: "Calidad y errores",
      titulo: "Diagnosticar errores de uso con base en comportamiento de la herramienta y criterios de calidad",
      descripcion: "Por qué la IA se equivoca, cómo evaluar una respuesta con criterios de calidad, cómo verificar fuentes y cómo corregir errores.",
      sesion: { fecha: "2026-11-25", horaInicio: "19:00", horaFin: "21:00", enlace: "", grabacion: "", datos: "" },
      materiales: [{"tipo": "estudio", "titulo": "Material de estudio RAP 3", "url": "recursos/Material_de_estudio_RAP3.pdf", "desc": "Lectura principal del RAP, con videos y ejemplos."}, {"tipo": "guia", "titulo": "Guía de aprendizaje · AA3 · EV3", "url": "recursos/Guia_de_aprendizaje_IA_Productiva.pdf", "desc": "Qué debes hacer, qué entregar y cómo se califica."}, {"tipo": "plantilla", "titulo": "Plantilla EV3", "url": "recursos/Plantilla_EV3_Mi_app_v2.docx", "desc": "Descárgala, diligénciala y entrégala en PDF."}, {"tipo": "ejemplo", "titulo": "Apps de ejemplo «Mi App con IA»", "url": "recursos/LEEME_Apps_de_Ejemplo.pdf", "desc": "Cinco apps de ejemplo en v1 y v2, y los prompts con que se hicieron."}],
      videos: [{"titulo": "Cómo evitar las alucinaciones de la IA", "url": "https://www.youtube.com/watch?v=xDr6YKLMMjw", "desc": "18 minutos_Smart Speakers · 2026"}, {"titulo": "Sesgo de la IA: ¿deciden los algoritmos por ti?", "url": "https://www.youtube.com/watch?v=-OmaheBivaM", "desc": "Telefónica · 2026"}, {"titulo": "Así creé una app desde cero con Gemini de Google, ¡y no sé programar!", "url": "https://www.youtube.com/watch?v=uM68wv1LklE", "desc": "Marcelo Alejandro · 2025"}],
      recursos: [],
      criterios: ["Verifica la calidad de resultados conforme a requerimientos establecidos", "Analiza fallos en la generación de contenidos de acuerdo con los resultados obtenidos"],
      evidencia: {
        formulario: "",
        respuestas: "",
        nombre: "EV3 · Mi app v2: diagnóstico y mejoras", fecha: "2026-11-29", hora: "23:59", enlace: "",
        descripcion: "Prueba tu app v1 como usuario y mejórala: mínimo 3 mejoras, una de ellas corrige un error real. Documenta en la plantilla qué cambió, por qué, el prompt usado y capturas de antes y después. Entrega App_v2_Nombre_Apellido.html y EV3_Nombre_Apellido.pdf.",
        rubrica: [["Mínimo 3 mejoras que funcionan, una de ellas un error corregido", 40], ["Explicación de qué cambió y por qué", 30], ["Capturas de antes y después", 20], ["Sello de autor en la app y en la plantilla", 10]]
      }
    },
    {
      id: "rap4", n: 4, color: "#F5A524", corto: "Mejoras y documentación",
      titulo: "Proponer mejoras en el uso de IA generativa según resultados obtenidos",
      descripcion: "Mide cuánto tiempo y esfuerzo te ahorra la IA, mejora tu app a la versión 2 y documenta el proceso con un manual y un video.",
      sesion: { fecha: "2026-11-26", horaInicio: "19:00", horaFin: "21:00", enlace: "", grabacion: "", datos: "" },
      materiales: [{"tipo": "estudio", "titulo": "Material de estudio RAP 4", "url": "recursos/Material_de_estudio_RAP4.pdf", "desc": "Lectura principal del RAP, con videos y ejemplos."}, {"tipo": "guia", "titulo": "Guía de aprendizaje · AA4 · EV4", "url": "recursos/Guia_de_aprendizaje_IA_Productiva.pdf", "desc": "Qué debes hacer, qué entregar y cómo se califica."}, {"tipo": "plantilla", "titulo": "Plantilla EV4", "url": "recursos/Plantilla_EV4_Cierre.docx", "desc": "Descárgala, diligénciala y entrégala en PDF."}, {"tipo": "ejemplo", "titulo": "Apps de ejemplo «Mi App con IA»", "url": "recursos/LEEME_Apps_de_Ejemplo.pdf", "desc": "Cinco apps de ejemplo en v1 y v2, y los prompts con que se hicieron."}],
      videos: [{"titulo": "7 herramientas de IA (gratuitas) que cambiarán tu vida en 2026", "url": "https://www.youtube.com/watch?v=vZKD8tOq1TU", "desc": "David Zamora · 2026"}, {"titulo": "Cómo crear un manual de procedimientos", "url": "https://www.youtube.com/watch?v=VEXv_K7TCDo", "desc": "Felipe Administrador · 2025"}, {"titulo": "Cómo crear un formulario web con Apps Script y guardar datos en Google Sheets", "url": "https://www.youtube.com/watch?v=urkRymI2LAA", "desc": "Valle Grande · 2025"}],
      recursos: [],
      criterios: ["Aplica alternativas de mejoramiento de la productividad según oportunidades de mejora productiva", "Registra el procedimiento implementado según formatos técnicos establecidos"],
      evidencia: {
        formulario: "",
        respuestas: "",
        nombre: "EV4 · Cierre: video del proceso o app en la nube", fecha: "2026-11-30", hora: "23:59", enlace: "",
        descripcion: "Elige una opción (las dos valen lo mismo). Opción 1: video de mínimo 3 minutos con tu voz mostrando tu app y su proceso; entrega la plantilla EV4 en PDF con el enlace del video. Opción 2: app v3 que guarda y lee datos en la nube (Google Sheets con Apps Script u otra); entrega App_v3_Nombre_Apellido.html y la plantilla EV4 en PDF.",
        rubrica: [["Opción 1 · Video", 0], ["Demostración de la app funcionando", 25], ["Explicación del proceso de v1 a v2", 20], ["Lo fácil, lo difícil y lo aprendido", 25], ["Cómo mejora su quehacer", 15], ["Voz propia, buen audio y mínimo 3 minutos", 15], ["Opción 2 · App en la nube", 0], ["Guarda, lee y actualiza en la nube", 40], ["Aviso de sincronización", 15], ["Explicación y prompts", 20], ["Capturas", 15], ["Sello de autor", 10]]
      }
    }
  ],
  /* Biblioteca y videos generales (no ligados a un RAP) */
  biblioteca: [],
  videos: [],
  /* Hitos adicionales del cronograma (las sesiones y entregas salen solas de cada RAP) */
  hitos: [
    { fecha: "2026-11-17", hora: "08:00", titulo: "Inicio del curso", desc: "Regístrate en la plataforma y únete al equipo de Teams.", enlace: "" },
    { fecha: "2026-12-01", hora: "08:00", titulo: "Día de ajustes", desc: "Último día para corregir o completar entregas pendientes.", enlace: "" },
    { fecha: "2026-12-02", hora: "18:00", titulo: "Fin del curso", desc: "Cierre de la formación.", enlace: "" }
  ],
  faq: [
      [
          "¿Cómo ingreso a la plataforma?",
          "Con el correo con el que te inscribiste en el SENA como usuario y tu número de documento como contraseña, sin puntos ni espacios. No necesitas registrarte. Cuando ingreses, cambia tu contraseña en Mi perfil."
      ],
      [
          "¿Cómo entrego una evidencia?",
          "1) Abre el RAP y baja a la sección Evidencia. 2) Descarga la plantilla, diligénciala y guárdala en PDF. 3) Pulsa «Abrir formulario» (o llena el formulario que aparece ahí). 4) Escribe tus datos, adjunta tus archivos y envía. Usa el mismo correo con el que ingresas. Recibirás la confirmación de Google."
      ],
      [
          "¿Cómo debo nombrar mis archivos?",
          "EV1_Nombre_Apellido.pdf · EV2_Nombre_Apellido.pdf y App_v1_Nombre_Apellido.html · EV3_Nombre_Apellido.pdf y App_v2_Nombre_Apellido.html · EV4_Nombre_Apellido.pdf (más el video o App_v3_Nombre_Apellido.html)."
      ],
      [
          "¿Cuáles son las fechas de entrega?",
          "Cada evidencia tiene su fecha y hora en el RAP y en el Cronograma. Si no apruebas, recibes retroalimentación para ajustarla; el 1 de diciembre es el día de ajustes."
      ],
      [
          "¿Puedo corregir una evidencia ya enviada?",
          "Sí, mientras no pase la fecha límite: vuelve a llenar el formulario y escribe en el comentario que es una nueva versión. El instructor revisa la más reciente."
      ],
      [
          "¿Cómo se califica?",
          "De 1 a 100; se aprueba con 70 o más. La rúbrica está en cada evidencia («Ver rúbrica»). Tu nota por RAP aparece en Mis calificaciones."
      ],
      [
          "¿Dónde veo mis notas y mi avance?",
          "En Calificaciones (menú izquierdo). Cada RAP muestra su nota y si está aprobado, no aprobado o pendiente."
      ],
      [
          "¿Cómo entro a la sesión en vivo?",
          "Cada RAP tiene su sesión (fecha y hora en la tarjeta Sesión en vivo). Pulsa el botón de Teams a la derecha. Entra unos minutos antes y prueba tu micrófono."
      ],
      [
          "Me perdí una sesión en vivo",
          "Mira la grabación en el RAP correspondiente o en la sección Videos; se publica después de cada sesión."
      ],
      [
          "¿Qué necesito para crear mi app?",
          "Un computador o celular con navegador (Chrome, Edge o Firefox), conexión a internet y una cuenta gratuita en un modelo de IA (ChatGPT, Gemini, Claude u otro). No necesitas instalar nada ni saber programar."
      ],
      [
          "Mi app no funciona, ¿qué hago?",
          "Dile a la IA qué hiciste, qué esperabas y qué pasó; si sale un mensaje de error, cópialo tal cual. Guarda siempre una copia de la versión anterior antes de pedir cambios."
      ],
      [
          "¿Dónde están las plantillas y los materiales?",
          "En cada RAP (sección Material) y en la Biblioteca. Las plantillas son archivos Word: se diligencian y se entregan en PDF."
      ],
      [
          "¿Puedo usar IA para hacer las evidencias?",
          "Sí, es el objetivo del curso: la IA escribe el código; tú decides, pruebas y explicas con tus palabras. Pon tu sello de autor y tus prompts reales. Dos trabajos iguales se devuelven para rehacer."
      ],
      [
          "Olvidé o quiero cambiar mi contraseña",
          "Cámbiala en Mi perfil → Seguridad. Si no puedes ingresar, usa «¿Olvidaste tu contraseña?» en la pantalla de ingreso y llegará un correo; si no llega, escríbele al instructor."
      ],
      [
          "Ingreso y dice «correo o contraseña incorrectos»",
          "Revisa que uses el correo exacto de tu inscripción y tu documento sin puntos, comas ni espacios. Si ya cambiaste tu contraseña, usa la nueva. Si sigue fallando, escríbele al instructor por Teams."
      ],
      [
          "¿Cómo le escribo al instructor?",
          "Desde «Mensajes al instructor» (privado), en el chat general del curso o por Teams."
      ]
  ],
  normas: [
    "Trata a todos con respeto. Nada de burlas, insultos ni discriminación.",
    "No compartas datos personales: teléfono, dirección, documentos ni contraseñas.",
    "No publiques las respuestas de las evidencias; comparte ideas y dudas.",
    "Si ves algo inapropiado, usa el botón 🚩 para reportarlo al instructor."
  ]
};

window.TIPOS_RECURSO = {
  enlace: { nombre: "Enlace", icono: "🔗" },
  actividad: { nombre: "Actividad interactiva", icono: "🧩" },
  app: { nombre: "App de ejemplo", icono: "📱" },
  juego: { nombre: "Juego", icono: "🎮" },
  formulario: { nombre: "Formulario / encuesta", icono: "📋" },
  lectura: { nombre: "Lectura", icono: "📰" }
};
window.TIPOS_MATERIAL = {
  estudio: { nombre: "Material de estudio", icono: "📘" },
  guia: { nombre: "Guía de aprendizaje", icono: "🧾" },
  plantilla: { nombre: "Plantilla", icono: "📝" },
  ejemplo: { nombre: "Ejemplo resuelto", icono: "✅" },
  sesion: { nombre: "Sesión interactiva", icono: "🖥️" },
  lectura: { nombre: "Lectura", icono: "🔗" },
  otro: { nombre: "Otro", icono: "📎" }
};

/* Actividades interactivas de ejemplo (el instructor puede editarlas, borrarlas o crear nuevas) */
(function () {
  const R = window.COURSE_DEFAULTS.raps; const mk = (id, titulo, descripcion, tipo, items, extra) => Object.assign({ id, titulo, descripcion, tipo, minimo: 70, mezclar: "no", items, html: "", url: "", manual: "no" }, extra || {});
  R.forEach((r) => { r.actividades = []; });
  if (R[0]) R[0].actividades = [mk("act-demo-quiz", "Quiz: ¿qué es la IA generativa?", "Selección múltiple de ejemplo. Edítala desde Administrar curso → RAP.", "quiz", [
    { q: "¿Qué hace una IA generativa?", opciones: "Crea contenido nuevo a partir de instrucciones | Solo busca páginas web | Solo corrige ortografía", correcta: 1, expl: "Genera texto, imágenes u otros contenidos a partir de un prompt." },
    { q: "¿Qué es un prompt?", opciones: "Una contraseña | La instrucción que le das a la IA | Un tipo de archivo", correcta: 2, expl: "Es el mensaje con el que le pides algo a la IA." }])];
  if (R[1]) R[1].actividades = [mk("act-demo-parejas", "Relaciona cada concepto", "Parejas de ejemplo.", "parejas", [{ a: "Prompt", b: "Instrucción que se le da a la IA" }, { a: "Contexto", b: "Información de fondo para mejorar la respuesta" }, { a: "Rol", b: "Papel que se le pide asumir a la IA" }])];
  if (R[2]) R[2].actividades = [mk("act-demo-completar", "Completa la frase", "Espacios en blanco de ejemplo.", "completar", [{ texto: "Un buen prompt incluye rol, [[contexto]] y [[formato|formato de salida]] esperado.", expl: "" }]), mk("act-demo-vf", "Verdadero o falso", "", "vf", [{ q: "Siempre debo verificar la información que entrega la IA.", correcta: "v", expl: "La IA puede equivocarse." }, { q: "Puedo compartir mis contraseñas con una IA.", correcta: "f", expl: "Nunca compartas datos sensibles." }])];
  if (R[3]) R[3].actividades = [mk("act-demo-orden", "Ordena el flujo de trabajo", "Ordena los pasos con las flechas.", "orden", [{ t: "Definir el objetivo" }, { t: "Redactar el prompt" }, { t: "Revisar la respuesta" }, { t: "Ajustar y mejorar" }]),
    mk("act-demo-html", "Actividad HTML de ejemplo", "Ejemplo de actividad propia que envía su nota a la plataforma.", "html", [], { html: "<!doctype html><meta charset=utf-8><body style='font-family:sans-serif;padding:16px'><h3>¿Cuánto es 2 + 2?</h3><button onclick=\"parent.postMessage({iapScore:100},'*')\">4</button> <button onclick=\"parent.postMessage({iapScore:0},'*')\">5</button></body>" })];
})();
