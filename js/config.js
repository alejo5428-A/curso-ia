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
    "alejo5428@gmail.com"
  ],

  /* Firebase (registro real, chat y contenido compartido). */
  firebase: {
    apiKey: "AIzaSyBuwq6G3upSW0bHvc3e5IyPJLxEjVZqvtQ",
    authDomain: "curso-ia-productiva-759a3.firebaseapp.com",
    projectId: "curso-ia-productiva-759a3",
    storageBucket: "curso-ia-productiva-759a3.firebasestorage.app",
    messagingSenderId: "530944868944",
    appId: "1:530944868944:web:ddf29a0c84ff3a99b70755"
  }
};
