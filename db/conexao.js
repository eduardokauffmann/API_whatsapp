const mysql = require('mysql2/promise');

// Ajuste aqui (ou use variáveis de ambiente) conforme o seu MySQL
const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT) || 3306
};
const DB_NAME = process.env.DB_NAME || 'uatizap';

let pool;

// Cria o banco e as tabelas automaticamente na primeira execução
async function iniciarBanco() {
    const temp = await mysql.createConnection(config);
    await temp.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await temp.end();

    pool = mysql.createPool({ ...config, database: DB_NAME, connectionLimit: 10 });

    await pool.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            apelido VARCHAR(50) NOT NULL,
            telefone VARCHAR(20) NOT NULL UNIQUE,
            senha_hash VARCHAR(255) NOT NULL,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS mensagens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            remetente VARCHAR(20) NOT NULL,
            destinatario VARCHAR(20) NOT NULL,
            mensagem TEXT NOT NULL,
            enviado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
    return pool;
}

const getPool = () => pool;
module.exports = { iniciarBanco, getPool };
