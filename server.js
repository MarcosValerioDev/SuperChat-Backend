const { WebSocketServer, WebSocket } = require('ws');
const http = require('http');

// O Render define a porta automaticamente na variável de ambiente PORT
const PORT = process.env.PORT || 8081;

// 1. Criamos o servidor HTTP
const server = http.createServer((req, res) => {
  // Rota de Health Check para o UptimeRobot
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end("OK");
  }

  // Resposta padrão para outras rotas
  res.writeHead(200);
  res.end("Servidor Ativo 🚀");
});

// 2. Acoplamos o WebSocket ao mesmo servidor HTTP
const wss = new WebSocketServer({ server });

wss.on('connection', (socket) => {
  console.log('Novo cliente conectado!');

  socket.on('message', (message) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`${message}`);
      }
    });
  });

  socket.on('close', () => console.log('Cliente desconectado'));
});

// 3. O servidor escuta em uma única porta
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
