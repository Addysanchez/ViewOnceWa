// Dependencias necesarias.
import {
  makeWASocket,
  useMultiFileAuthState,
  downloadMediaMessage,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import { fileTypeFromBuffer } from "file-type";
import { createInterface } from "node:readline";
import { keepAlive } from "./server.js";
import { QuickDB } from "quick.db";
import { Boom } from "@hapi/boom";
import pino from "pino";

keepAlive();

async function connectToWA() {
  const db = new QuickDB();

  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = (input) => {
    return new Promise((resolve) => readline.question(input, resolve));
  };

  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const socket = makeWASocket({
    mobile: false,
    browser: ["FireFox (linux)"],
    auth: state,
    logger: pino({ level: "silent" }),
  });

  if (!socket.authState.creds.registered) {
    const number = await prompt(`\nIntroduce tu número de WhatsApp:\n=> `);
    const code = await socket.requestPairingCode(number);

    db.set("number", { number });

    console.log("Tu código de conexión es:", code);
  }

  // Evento connection.update
  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect.error instanceof Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log(
        "Conexión cerrada debido a",
        lastDisconnect.error + ", reconectando...".red,
        shouldReconnect
      );

      if (shouldReconnect) {
        connectToWA();
      }
    } else if (connection === "open") {
      console.log("WhatsApp bot ready!");
    }
  });

  // Evento messages.upsert
  socket.ev.on("messages.upsert", async ({ type, messages }) => {
    if (!messages[0]?.message) return;

    if (type !== "notify") return;

    if (messages[0]?.key?.fromMe) return;

    const t = Object.keys(messages[0].message)[0];

    console.log(t);

    if (t !== "messageContextInfo" && t !== "viewOnceMessageV2") return;

    const media = await downloadMediaMessage(messages[0], "buffer");

    const { mime } = await fileTypeFromBuffer(media);
    const { number } = await db.get("number");

    console.log(media);

    socket.sendMessage(number + "@s.whatsapp.net", {
      [mime.split("/")[0] || "document"]: media,
      caption: `Enviado por *${messages[0]?.pushName || "Desconocido"}*`,
    });
  });

  // Evento creds.update
  socket.ev.on("creds.update", saveCreds);
}

// Ejecutamos
await connectToWA();

// Por si hay un error, que no se apague.
process.on("uncaughtException", (error) => console.error(error));

process.on("uncaughtExceptionMonitor", (error) => console.error(error));

process.on("unhandledRejection", (error) => console.error(error));

process.stdin.resume();
