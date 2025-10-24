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
