const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let votos = { milei: 0, noMilei: 0 };
let ips = [];

app.post("/votar", (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

  if (ips.includes(ip)) {
    return res.status(403).json({ error: "Ya votaste desde esta IP." });
  }

  const opcion = req.body.opcion;
  if (!["milei", "noMilei"].includes(opcion)) {
    return res.status(400).json({ error: "Opción inválida" });
  }

  votos[opcion]++;
  ips.push(ip);

  res.json({ ok: true, mensaje: "Voto registrado correctamente" });
});

app.get("/resultados", (req, res) => {
  res.json(votos);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

import express from "express";
import bodyParser from "body-parser";
import pkg from "pg";
import cors from "cors";

const { Pool } = pkg;
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect()
  .then(() => console.log("✅ Conectado a PostgreSQL"))
  .catch(err => console.error("❌ Error de conexión a PostgreSQL:", err));

// Ruta para votar
app.post("/votar", async (req, res) => {
  const { opcion } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log("📩 Voto recibido:", opcion, "desde IP:", ip);

  try {
    const check = await pool.query("SELECT * FROM votos WHERE ip = $1", [ip]);
    if (check.rows.length > 0) {
      console.log("⚠️ IP ya votó:", ip);
      return res.status(400).json({ mensaje: "Ya has votado desde este navegador o IP" });
    }

    await pool.query("INSERT INTO votos (opcion, ip) VALUES ($1, $2)", [opcion, ip]);
    console.log("✅ Voto guardado:", opcion);

    res.json({ mensaje: "Voto registrado correctamente" });
  } catch (err) {
    console.error("❌ Error al guardar el voto:", err);
    res.status(500).json({ mensaje: "Error al guardar el voto" });
  }
});

app.get("/resultados", async (req, res) => {
  try {
    const apoyo = await pool.query("SELECT COUNT(*) FROM votos WHERE opcion = 'Apoyo'");
    const noApoyo = await pool.query("SELECT COUNT(*) FROM votos WHERE opcion = 'NoApoyo'");
    console.log("📊 Resultados:", apoyo.rows[0].count, noApoyo.rows[0].count);

    res.json({
      apoyo: apoyo.rows[0].count,
      noApoyo: noApoyo.rows[0].count
    });
  } catch (err) {
    console.error("❌ Error al obtener resultados:", err);
    res.status(500).json({ mensaje: "Error al obtener resultados" });
  }
});

app.listen(port, () => console.log(`🚀 Servidor corriendo en puerto ${port}`));
