const express = require('express');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'chave-secreta',
    resave: false,
    saveUninitialized: true,
}));

function protegerRota(req, res, proximo) {
    if (req.session.usuario) {
        proximo();
    } else {
        res.redirect('/login');
    }
}


const urlMongo = 'mongodb://127.0.0.1:27017';
const nomeBanco = 'sistemaLogin';

app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/cadastro.html'));
});

app.post('/cadastro', async (req, res) => {
    const cliente = new MongoClient(urlMongo);
    try {
        await cliente.connect();
        const banco = cliente.db(nomeBanco);
        const usuarios = banco.collection('usuarios');

        const { usuario, senha } = req.body;

        const existente = await usuarios.findOne({ usuario });

        if (existente) {
            return res.send(`
                <script>
                    alert("Usuário já existe!");
                    window.location.href = "/cadastro";
                </script>
            `);
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);

        await usuarios.insertOne({ usuario, senha: senhaCriptografada });

        return res.send(`
            <script>
                alert("Conta criada com sucesso!");
                window.location.href = "/login";
            </script>
        `);

    } catch (erro) {
        console.error(erro);
        return res.send(`
            <script>
                alert("Erro ao cadastrar usuário!");
                window.location.href = "/cadastro";
            </script>
        `);
    } finally {
        await cliente.close();
    }
});


app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/login.html'));
});

app.post('/login', async (req, res) => {
    const cliente = new MongoClient(urlMongo);
    try {
        await cliente.connect();
        const banco = cliente.db(nomeBanco);
        const usuarios = banco.collection('usuarios');

        const { usuario, senha } = req.body;

        const user = await usuarios.findOne({ usuario });

        if (user && await bcrypt.compare(senha, user.senha)) {
            req.session.usuario = user.usuario;

            return res.send(`
                <script>
                    alert("Login realizado com sucesso!");
                    window.location.href = "/dashboard";
                </script>
            `);
        } else {
            return res.send(`
                <script>
                    alert("Usuário ou senha incorretos!");
                    window.location.href = "/login";
                </script>
            `);
        }

    } catch (erro) {
        console.error(erro);
        return res.send(`
            <script>
                alert("Erro ao realizar login!");
                window.location.href = "/login";
            </script>
        `);
    } finally {
        await cliente.close();
    }
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/dashboard.html'));
});

app.get('/perfil', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/perfil.html'));
});

app.get('/monitoramento', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/monitoramento.html'));
});

app.get('/camera', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/camera.html'));
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.send(`
                <script>
                    alert("Erro ao sair!");
                    window.location.href = "/dashboard";
                </script>
            `);
        }

        res.send(`
            <script>
                alert("Você saiu da conta!");
                window.location.href = "/login";
            </script>
        `);
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
