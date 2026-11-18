/* =====================================================================
   CONFIGURACIÓN TÉCNICA · Plataforma de cursos
   ---------------------------------------------------------------------
   Lo único que se edita en código. Todo el contenido del curso
   (nombre, RAP, materiales, fechas, rúbricas…) se administra desde la
   plataforma con la cuenta de instructor (menú «Administrar»).
   ===================================================================== */
window.APP_CONFIG = {

  /* Correos que entran como INSTRUCTOR / ADMINISTRADOR.
     Escríbelos también en firestore.rules (línea marcada). */
  instructores: [
    "TU_CORREO_DE_INSTRUCTOR@gmail.com"
  ],

  /* Firebase (registro real, chat y contenido compartido).
     Mientras esté sin configurar, la plataforma trabaja en MODO DEMO:
     todo se guarda solo en el navegador de cada persona.
     Pasos en README.md. */
  firebase: {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "",
    appId: ""
  }
};
