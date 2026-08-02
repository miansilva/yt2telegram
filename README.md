# yt2telegram

Bot de Node.js para las notificaciones automáticas de vídeos de YouTube a Telegram.

> **Nota:** Esta es una versión inicial/básica. No utiliza base de datos, no requiere clave de API oficial de YouTube (utiliza RSS público) y guarda el estado localmente para evitar notificaciones duplicadas.

---

## Instalación

1. Clonar este repo e instalar dependencias:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd yt2telegram
   npm install
   ```

2. Copiar `.env.example` a `.env` y colocar las credenciales del bot e ID del canal:
   ```env
   YOUTUBE_CHANNEL_ID=tu_id_de_canal
   TELEGRAM_BOT_TOKEN=tu_token_de_bot
   TELEGRAM_CHAT_ID=tu_chat_id
   TELEGRAM_MESSAGE_THREAD_ID=tu_thread_id_opcional
   INTERVAL=300000
   ```

3. Iniciar el bot:
   ```bash
   npm start
   ```

---

## Estructura del proyecto

- `index.js`: Archivo principal con la lógica de verificación RSS y envío de mensajes.
- `package.json`: Configuración del proyecto, scripts y dependencias.
- `.env.example`: Plantilla de variables de entorno.
- `state.json`: Archivo local generado dinámicamente con el último vídeo notificado.
