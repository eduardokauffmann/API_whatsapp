const express = require('express');
const cors = require('cors');
const authRoute = require('./routes/auth.route.js');
const { iniciarBanco } = require('./db/conexao.js');

const app = express();

app.use(cors());
app.use(express.json());
app.use(authRoute);

const PORT = 3000;
const SERVER = "localhost";
const MSG = `Servidor Online em ${SERVER}:${PORT}`;

iniciarBanco()
    .then(() => app.listen(PORT, () => console.log(MSG)))
    .catch((erro) => {
        console.error('Falha ao conectar no MySQL. Verifique se ele está rodando e confira usuário/senha em db/conexao.js');
       console.error(erro.code, erro.message, erro.errors || '');
        process.exit(1);
    });
