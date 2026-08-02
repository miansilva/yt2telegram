import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import RSSParser from "rss-parser";

const parser = new RSSParser();

// Variables de entorno
const {
  YOUTUBE_CHANNEL_ID,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  TELEGRAM_MESSAGE_THREAD_ID,
} = process.env;

/**
 * Comprueba que las variables de entorno obligatorias estén definidas
 */
if (!YOUTUBE_CHANNEL_ID || !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error(
    "Error: Faltan variables obligatorias en el archivo .env (YOUTUBE_CHANNEL_ID, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)",
  );
  process.exit(1);
}

const YOUTUBE_RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;

const INTERVAL = parseInt(
  process.env.INTERVAL || process.env.POLL_INTERVAL_MS || "300000",
  10,
);

// Guarda el último vídeo notificado en state.json para evitar duplicados al reiniciar
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.join(__dirname, "state.json");

/**
 * Obtiene el enlace del último vídeo notificado desde state.json
 */
function getLastVideo() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = fs.readFileSync(STATE_FILE, "utf-8");
      return JSON.parse(data).lastLink;
    } catch (error) {
      console.error("Error al leer el archivo de estado:", error.message);
      return null;
    }
  }
  return null;
}

/**
 * Guarda el enlace del último vídeo notificado en state.json
 */
function saveLastVideo(link) {
  try {
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({ lastLink: link }, null, 2),
      "utf-8",
    );
  } catch (error) {
    console.error("Error al guardar el archivo de estado:", error.message);
  }
}

let lastCheckedVideo = getLastVideo();

/**
 * Escapa caracteres especiales para HTML de Telegram
 */
function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Envía un mensaje a Telegram utilizando la API nativa fetch con async/await
 */
async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      message_thread_id: TELEGRAM_MESSAGE_THREAD_ID || undefined,
      text: text,
      parse_mode: "HTML",
    }),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Error Telegram HTTP ${response.status}: ${errorDetails}`);
  }
}

/**
 * Revisa el feed RSS de YouTube en busca de nuevos vídeos
 */
async function checkForNewVideos() {
  try {
    const feed = await parser.parseURL(YOUTUBE_RSS_URL);
    if (!feed.items || feed.items.length === 0) {
      console.log("No se encontraron vídeos en el feed.");
      return;
    }

    const latestVideo = feed.items[0];

    if (latestVideo.link !== lastCheckedVideo) {
      const message = `🎬 <b>¡Nuevo vídeo disponible!</b>\n\n<a href="${latestVideo.link}">${escapeHtml(latestVideo.title)}</a>`;
      await sendTelegramMessage(message);

      lastCheckedVideo = latestVideo.link;
      saveLastVideo(lastCheckedVideo);
      console.log(`[OK] Notificado nuevo vídeo: "${latestVideo.title}"`);
    } else {
      console.log("No hay vídeos nuevos.");
    }
  } catch (error) {
    console.error("Error al verificar vídeos:", error.message || error);
  }
}

// Inicio del bot
console.log("Bot de notificaciones de YouTube iniciado");
checkForNewVideos();
setInterval(checkForNewVideos, INTERVAL);
