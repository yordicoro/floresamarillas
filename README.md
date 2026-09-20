# Universo de Flores Amarillas

Proyecto estático en HTML, CSS y JavaScript. No requiere instalación ni compilación.

## Estructura

- `html/universo-flores-amarillas.html`: contenido de la página y enlaces a los recursos.
- `css/estilos.css`: colores, tipografías, distribución y animaciones CSS.
- `js/app.js`: flores en canvas, interacción, mensajes personalizados y código QR.
- `respaldo/universo-flores-amarillas.html.bak`: copia exacta del archivo original antes de organizarlo.

## Abrir el proyecto

Abre `html/universo-flores-amarillas.html` en el navegador.
Mantén las carpetas html, css y js juntas dentro del proyecto para conservar las rutas relativas.

Las fuentes de Google Fonts y la biblioteca QRCode se cargan desde Internet.
Para compartir un QR accesible desde otros dispositivos, publica las tres carpetas en un servidor web y utiliza la dirección pública de la página HTML; una ruta local no es accesible desde otro dispositivo.

## Mantenimiento

Modifica los textos y la estructura en HTML, la apariencia en CSS y el comportamiento en JavaScript.
La biblioteca QRCode conserva su enlace externo y se carga antes de app.js.
Para restaurar la versión original, copia el archivo .bak a la raíz y quita la extensión .bak.