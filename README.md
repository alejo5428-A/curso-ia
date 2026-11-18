# Plataforma de cursos · cascarón administrable

Aula virtual sencilla (estilo Zajuna) para cursos de formación complementaria con resultados de aprendizaje (RAP). **Todo el contenido se administra desde la misma plataforma** con la cuenta de instructor: nombre del curso, RAP, materiales, videos, fechas, rúbricas, enlaces de Teams, preguntas frecuentes… Los aprendices solo leen.

Viene cargada con el curso *IA Generativa como catalizador de la productividad* como ejemplo; para otro curso basta con cambiar los textos desde **Administrar curso** (o importar un respaldo JSON).

Son archivos HTML, CSS y JavaScript: no hay nada que instalar ni compilar. Funciona en GitHub Pages.

---

## 1. Publicar en GitHub Pages

1. En [github.com](https://github.com) crea un repositorio **público** (por ejemplo `curso-ia`).
2. Toca **uploading an existing file**, arrastra **todo el contenido de esta carpeta** y confirma.
3. **Settings → Pages → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`. Guarda.
4. En 1 o 2 minutos queda en `https://TU_USUARIO.github.io/curso-ia/`.

## 2. Tu cuenta de instructor (`js/config.js`)

Abre `js/config.js` (en GitHub, ícono del lápiz) y escribe tu correo en `instructores`. Quien se registre con ese correo entra como **instructor/administrador**: ve el menú Administración, publica anuncios, modera el chat y responde mensajes privados. Los demás correos entran como aprendices y no pueden modificar nada.

## 3. Activar la nube (Firebase, gratis) — necesario para usarla con aprendices

Sin Firebase la plataforma corre en **modo demo**: todo (cuentas, contenido, chat) se guarda solo en el navegador de cada persona. Sirve para revisarla, no para dictar el curso.

1. [console.firebase.google.com](https://console.firebase.google.com) → **Agregar proyecto** (Analytics puede ir desactivado).
2. **Authentication → Comenzar → Correo electrónico/contraseña → Habilitar.**
3. **Authentication → Configuración → Dominios autorizados → Agregar:** `TU_USUARIO.github.io`.
4. **Firestore Database → Crear base de datos** (modo producción, ubicación `southamerica-east1` u otra cercana).
5. **Firestore → Reglas:** pega el contenido completo de `firestore.rules`, **escribe tu correo en minúsculas** en la línea marcada y **Publica**.
6. **⚙️ Configuración del proyecto → Tus apps → Web (`</>`)**, ponle nombre y copia el bloque `firebaseConfig`.
7. Pega esos valores en `js/config.js` → `firebase`. Guarda en GitHub.
8. Abre la plataforma, regístrate con tu correo de instructor y entra a **Administrar curso → Respaldo**: debe decir *En línea (Firebase)*.

El plan gratuito alcanza de sobra para varias fichas.

## 4. Montar el contenido (desde la plataforma)

Entra como instructor → **Administrar curso**:

| Pestaña | Qué se edita |
|---|---|
| **Curso** | Nombre, descripción, presentación del programa, competencia, requisitos, código, horas, fechas, **color principal**, nota mínima, instructor, código de inscripción, enlace general de Teams, mensajes sobre entregas y calificación |
| **RAP** | Por cada RAP: número, nombre, color, título, descripción, criterios de evaluación, sesión en vivo (fecha, horas, enlace de Teams, grabación), material de formación, videos, actividades de aprendizaje (enlaces, apps, juegos, formularios…), evidencia (descripción, fecha límite, enlace de la tarea en Teams, rúbrica). Botones **Nuevo RAP**, mover ◀ ▶ y **Quitar RAP** |
| **Biblioteca y videos** | Material y videos generales, no ligados a un RAP |
| **Cronograma** | Hitos extra (inicio, cierre, ajustes…). Las sesiones y entregas salen solas de cada RAP |
| **Calificaciones** | Carga un Excel o CSV con las notas (una fila por aprendiz, columna **Correo** y una columna por RAP con la nota o A/D), edita la tabla a mano, exporta. Cada aprendiz ve solo las suyas en «Mis calificaciones» |
| **Ayuda** | Preguntas frecuentes y normas de convivencia |
| **Respaldo** | Exportar / importar todo el contenido en JSON · Restablecer al ejemplo |

Pulsa **Guardar cambios** y los aprendices lo ven de inmediato.

### Dónde poner los archivos (PDF, Word, HTML)

Cada material es un **enlace**. Dos opciones:

- **En el repositorio:** sube los archivos a la carpeta `recursos/` (por ejemplo `recursos/RAP1/Guia_RAP1.pdf`) y en el material escribe esa ruta: `recursos/RAP1/Guia_RAP1.pdf`. Los PDF se abren dentro de la plataforma.
- **En Google Drive / OneDrive / YouTube:** pega el enlace de compartir (con acceso para «cualquiera con el enlace»).

Mientras un material no tenga enlace, aparece como «Próximamente».

> Los archivos de `recursos/` quedan públicos para quien tenga el enlace directo (así funciona GitHub Pages). No subas documentos internos del instructor.

## 5. Para montar otro curso

1. **Administrar curso → Respaldo → Exportar** (guarda una copia del curso actual).
2. Cambia los textos en las pestañas, o importa un JSON previo y ajústalo.
3. Si el nuevo curso tiene otra cantidad de RAP, usa **Nuevo RAP** / **Quitar este RAP**.
4. Importa los nuevos aprendices (sección 5b). Si prefieres registro libre, pon «Registro libre» en Abierto y cambia el **código de inscripción**.
5. Para empezar con el chat y las cuentas en limpio, crea un nuevo proyecto de Firebase (o borra las colecciones `chat`, `dm`, `announcements` y `users` desde la consola) y, si quieres, un nuevo repositorio.

## 5b. Cargar los aprendices (sin que se registren)

1. Entra como instructor → **Aprendices → Importar aprendices**.
2. Selecciona los Excel de Sofía Plus (uno por ficha; acepta `.xls`, `.xlsx`, `.csv`). Se leen en tu navegador y **no se suben a ninguna parte**: no los pongas en el repositorio.
3. Revisa la vista previa y pulsa **Crear cuentas**. Cada aprendiz queda con su **correo como usuario** y su **número de documento como contraseña inicial**. Puedes repetir la importación: quien ya existe no se duplica.
4. Los aprendices solo ingresan con correo + documento (sin puntos ni espacios) y pueden cambiar su clave en **Mi perfil**. Si no tienen correo válido o el documento tiene menos de 6 dígitos, Firebase lo rechaza y queda en el aviso del resultado.
5. Con Firebase, la importación crea las cuentas reales de Authentication. Dejar «Registro libre» en **Cerrado** (Administrar curso → Curso) oculta «Crear cuenta»; tú sigues creando tu cuenta de instructor entrando a `/#/registro`.

> Aviso: usar el documento como contraseña es débil (es un dato que otras personas conocen). Pide a los aprendices cambiarla en el primer ingreso.

## 6. Qué hay en la plataforma

- **Aprendiz:** Área de trabajo (estilo aula virtual: información del programa y una sección desplegable por RAP con todas sus actividades) · página de cada RAP · Biblioteca · Videos · Cronograma (calendario y exportación .ics) · **Mis calificaciones** (nota y estado por RAP) · Chat general · Mensajes al instructor (privados) · Anuncios · Participantes · Ayuda · Perfil.
- **Instructor (además):** Administrar curso (todo el contenido, los RAP y las calificaciones) · Aprendices (lista, CSV, quitar) · Moderación · anuncios · borrar mensajes del chat · responder mensajes privados.

### Formato del archivo de calificaciones

Descarga la plantilla desde **Administrar curso → Calificaciones**. Columnas:

| Correo | Nombre | Ficha | RAP 1 | RAP 2 | RAP 3 | RAP 4 | Juicio final | Observaciones |
|---|---|---|---|---|---|---|---|---|
| ana@gmail.com | Ana Gómez | 1234567 | 85 | 72 | A | | A | Buen trabajo |

- El **Correo** debe ser el mismo con el que el aprendiz ingresa (el de la inscripción).
- En cada RAP puedes poner la nota (1 a 100; se compara con la nota mínima) o **A** (aprobado) / **D** (no aprobado). Vacío = pendiente.
- Columnas opcionales: «Observación RAP n», «Juicio final», «Observaciones».
- Acepta `.xlsx`, `.xls` y `.csv` (separado por `;` o `,`).
- Registro con código del curso, aviso de tratamiento de datos y casilla de autorización para menores. Sin fotos.
- Las evidencias **no se cargan aquí**: cada RAP enlaza a la tarea en Teams.

## Estructura

```
index.html        Página única
css/styles.css    Estilos (tema claro/oscuro, responsive)
js/config.js      ← correo del instructor y datos de Firebase
js/data.js        Contenido de ejemplo (se usa la primera vez o al restablecer)
js/backend.js     Cuentas, contenido, chat, mensajes, anuncios (Firebase o demo)
js/ui.js          Utilidades
js/admin.js       Panel de administración
js/app.js         Páginas y navegación
firestore.rules   Reglas de seguridad para Firebase
recursos/         Carpeta para tus archivos
```


## Entrega de evidencias con Google Forms

1. Crea en Google Forms un formulario con una pregunta de **Carga de archivos** y un campo de **comentario** (los archivos llegan a tu Drive).
2. Copia el enlace largo (termina en `/viewform`, no el corto `forms.gle`).
3. Pégalo en **Administrar curso → RAP → Evidencia → Formulario de Google**. Aparece dentro de la plataforma, en el RAP.
4. En **Administrar curso → Evidencias** calificas a cada aprendiz y con «Enviar notas a Calificaciones» se publican.

La carga de archivos de Google Forms exige que el aprendiz tenga sesión de Google; si el formulario incrustado no la permite en su navegador, el enlace «ábrelo en una pestaña nueva» le sirve de alternativa.

## Actividades interactivas

Se preparan en **Administrar curso → RAP → Actividades interactivas** y quedan ocultas para los aprendices hasta que actives «Actividades interactivas: Visibles» en la pestaña **Curso**.

## Número de RAP

Desde 1 hasta los que necesites: **Administrar curso → RAP → Agregar RAP** (también ordenar y eliminar).

> Si ya publicaste Firebase, vuelve a pegar `firestore.rules` y pulsa Publicar.
