const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  // res.send('Hello World! App de evaluacion activa.');
  res.send('Hell World! Esta es la V2 actualizada!')
});

// Bug para el Reto 1: el servidor solo escucha en localhost (127.0.0.1)
// Por lo tanto, no será accesible desde fuera del contenedor.
app.listen(port, '0.0.0.0', () => {
  console.log(`App listening at http://127.0.0.1:${port}`);
});
