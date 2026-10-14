const API = 'http://localhost:3000';

function pegarTelefone() {
    const ddiInput = document.querySelector('input[name="ddi"]:checked');
    const ddi = ddiInput ? ddiInput.value.replace('+', '') : '55';
    const telElem = document.getElementById('tel') || document.getElementById('regTelefone');
    const numero = telElem ? telElem.value.replace(/\D/g, '') : '';
    return ddi + numero;
}

async function realizarRegistro() {
    const apelido = document.getElementById('regApelido').value;
    const senha = document.getElementById('regSenha').value;
    const telefone = pegarTelefone();

    const formData = new FormData();
    formData.append('apelido', apelido);
    formData.append('senha', senha);
    formData.append('telefone', telefone);

    try {
        const resposta = await fetch(`${API}/registrar`, {
            method: 'POST',
            body: formData
        });
        const dados = await resposta.json();

        if (resposta.ok) {
            alert('Sucesso: ' + (dados.mensagem || 'Conta criada!'));
            window.location.href = `index.html`;
        } else {
            alert('Atenção: ' + (dados.mensagem || 'Erro no registro.'));
        }
    } catch (erro) {
        alert('Falha ao conectar com o servidor da API.');
    }
}

async function realizarLogin() {
    const telefone = pegarTelefone();
    const senha = document.getElementById('senha') ? document.getElementById('senha').value : '';

    try {
        const url = `${API}/auth?telefone=${encodeURIComponent(telefone)}&senha=${encodeURIComponent(senha)}`;
        const resposta = await fetch(url, { method: 'POST' });
        const dados = await resposta.json();

        if (resposta.ok) {
            localStorage.setItem('telefone', telefone);
            localStorage.setItem('senha', senha);
            if (dados.senha_hash) {
                localStorage.setItem('senha_hash', dados.senha_hash);
            }
            alert('Sucesso: ' + (dados.mensagem || 'Login efetuado!'));
            window.location.href = `chat.html`;
        } else {
            alert('Falha: ' + (dados.mensagem || 'Credenciais inválidas.'));
        }
    } catch (erro) {
        alert('Falha ao conectar com o servidor da API.');
    }
}

async function enviarMensagem() {
    const telefoneDestino = document.getElementById('destinatario').value;
    const mensagem = document.getElementById('textoMensagem').value;

    const meuTelefone = localStorage.getItem('telefone');
    const minhaSenhaHash = localStorage.getItem('senha_hash');
    const minhaSenha = localStorage.getItem('senha');

    if (!meuTelefone) {
        alert('Faça login primeiro.');
        window.location.href = `index.html`;
        return;
    }

    const dadosMensagem = {
        telefone: telefoneDestino,
        mensagem: mensagem
    };

    const auth = minhaSenhaHash
        ? `senha_hash=${encodeURIComponent(minhaSenhaHash)}`
        : `senha=${encodeURIComponent(minhaSenha)}`;

    try {
        const url = `${API}/chat?telefone=${encodeURIComponent(meuTelefone)}&${auth}`;
        const resposta = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosMensagem)
        });
        const dadosRetorno = await resposta.json();

        if (resposta.ok) {
            alert('Status: ' + (dadosRetorno.mensagem || 'Mensagem enviada!'));
            const enviadas = document.getElementById('enviadas');
            if (enviadas) {
                const item = document.createElement('p');
                item.textContent = 'Para ' + telefoneDestino + ': ' + mensagem;
                enviadas.appendChild(item);
            }
            document.getElementById('textoMensagem').value = '';
        } else {
            alert('Falha: ' + (dadosRetorno.mensagem || 'Erro ao enviar.'));
        }
    } catch (erro) {
        alert('Falha ao conectar com o servidor da API.');
    }
}