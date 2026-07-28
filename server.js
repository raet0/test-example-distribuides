const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World! App de evaluacion activa.');
});

// Bug para el Reto 1: el servidor solo escucha en localhost (127.0.0.1)
// Por lo tanto, no será accesible desde fuera del contenedor.
app.listen(port, '127.0.0.1', () => {
  console.log(`App listening at http://127.0.0.1:${port}`);
});
