const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { getPool } = require('../db/conexao.js');

const upload = multer();
const router = express.Router();

function gerarHash(senha) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function senhaConfere(senha, armazenado) {
    const [salt, hash] = armazenado.split(':');
    const teste = crypto.scryptSync(senha, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(teste, 'hex'));
}

// Aceita tanto a senha quanto o senha_hash (que o front guarda após o login)
async function autenticar(telefone, senha, senhaHash) {
    if (!telefone) return null;
    const [rows] = await getPool().query('SELECT * FROM usuarios WHERE telefone = ?', [telefone]);
    const usuario = rows[0];
    if (!usuario) return null;
    if (senhaHash) return senhaHash === usuario.senha_hash ? usuario : null;
    if (senha && senhaConfere(senha, usuario.senha_hash)) return usuario;
    return null;
}

// multipart/form-data (o front envia FormData) -> upload.none()
router.post('/registrar', upload.none(), async (req, res) => {
    try {
        const { apelido, telefone, senha } = req.body;
        if (!apelido || !telefone || !senha) {
            return res.status(400).json({ mensagem: 'Preencha apelido, telefone e senha.' });
        }
        const [existe] = await getPool().query('SELECT id FROM usuarios WHERE telefone = ?', [telefone]);
        if (existe.length) {
            return res.status(409).json({ mensagem: 'Este telefone já está cadastrado.' });
        }
        await getPool().query(
            'INSERT INTO usuarios (apelido, telefone, senha_hash) VALUES (?, ?, ?)',
            [apelido, telefone, gerarHash(senha)]
        );
        res.status(201).json({ mensagem: 'Conta criada com sucesso!' });
    } catch (erro) {
        console.error('Erro em /registrar:', erro);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    }
});

router.post('/auth', async (req, res) => {
    try {
        const { telefone, senha } = req.query;
        const usuario = await autenticar(telefone, senha);
        if (!usuario) return res.status(401).json({ mensagem: 'Telefone ou senha inválidos.' });
        res.json({ mensagem: `Bem-vindo, ${usuario.apelido}!`, senha_hash: usuario.senha_hash });
    } catch (erro) {
        console.error('Erro em /auth:', erro);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    }
});

router.post('/chat', async (req, res) => {
    try {
        const { telefone, senha, senha_hash } = req.query;
        const usuario = await autenticar(telefone, senha, senha_hash);
        if (!usuario) return res.status(401).json({ mensagem: 'Não autenticado.' });

        const { telefone: destino, mensagem } = req.body || {};
        if (!destino || !mensagem) {
            return res.status(400).json({ mensagem: 'Informe o destinatário e a mensagem.' });
        }
        const [dest] = await getPool().query('SELECT id FROM usuarios WHERE telefone = ?', [destino]);
        if (!dest.length) return res.status(404).json({ mensagem: 'Destinatário não encontrado.' });

        await getPool().query(
            'INSERT INTO mensagens (remetente, destinatario, mensagem) VALUES (?, ?, ?)',
            [telefone, destino, mensagem]
        );
        res.status(201).json({ mensagem: 'Mensagem enviada!' });
    } catch (erro) {
        console.error('Erro em /chat:', erro);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    }
});

module.exports = router;
