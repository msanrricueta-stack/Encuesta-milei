const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

const dataFile = path.join(__dirname, 'votos.json');

// Cargar votos
let votos = { milei: 0, noMilei: 0, ips: [] };
if (fs.existsSync(dataFile)) {
  votos = JSON.parse(fs.readFileSync(dataFile));
}

function guardarVotos() {
  fs.writeFileSync(dataFile, JSON.stringify(votos, null, 2));
}

// API para votar
app.post('/votar', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (votos.ips.includes(ip)) {
    return res.status(400).json({ mensaje: 'Ya has votado desde esta IP' });
  }

  const opcion = req.body.opcion;
  if (opcion === 'milei') votos.milei++;
  else if (opcion === 'noMilei') votos.noMilei++;
  else return res.status(400).json({ mensaje: 'Opción inválida' });

  votos.ips.push(ip);
  guardarVotos();
  res.json({ mensaje: 'Voto registrado', votos });
});

// API para obtener resultados
app.get('/resultados', (req, res) => {
  res.json({ milei: votos.milei, noMilei: votos.noMilei });
});

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
