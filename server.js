var express = require('express')
var app = express()
const redis = require('redis');

app.use(express.static('public'))
app.set('view engine', 'ejs')
app.set('views', './views')

// Cliente redis
const cli = redis.createClient({
    password: 'iJre0JHg6e8HuF3Rj27TQTwfywuHumpQ',
    socket: {
        host: 'redis-17162.c281.us-east-1-2.ec2.cloud.redislabs.com',
        port: 17162
    }
});

var senhaAtual

app.get("/", async (req, res) => {
    let fila = await cli.lRange('fila', 0, -1)
    res.render('index', { senhaAtual: senhaAtual, fila: fila });
})

app.get("/proximo", async (req, res) => {
    // Obtém o próximo número da fila (se houver)
    senhaAtual = await cli.lPop('fila')
    res.render('proximo', {senhaAtual:senhaAtual});
})

app.get("/retirar", async (req, res) => {
    let ultimaSenha = await cli.lIndex('ListaSenha', -1)
    let novaSenha = parseInt(ultimaSenha) + 1
    await cli.rPush('ListaSenha', novaSenha.toString())
    await cli.rPush('fila', novaSenha.toString())
    res.render('retirarsenha', {senhaAtual:novaSenha});
});

async function start() {
    await cli.connect()
    console.log('Conectado ao redis')
    app.listen(8000, async () => {
        console.log('Servidor iniciado porta 8000')
        await cli.del('fila')
        await cli.del('ListaSenha')
        await cli.rPush('ListaSenha', ['0'])
        senhaAtual = await cli.lIndex('ListaSenha', 0)
    });
}
cli.on('connect', function (err) {
    if (err) {
      console.log('Could not establish a connection with Redis. ' + err);
    } else {
      console.log('Connected to Redis successfully!');
    }
  });


start()


