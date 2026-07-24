const { WebSocketServer, WebSocket } = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8081;

// Defina aqui as origens permitidas (Seu localhost e seu domínio de produção se houver)
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://superchat-marcosdev.netlify.app/'
  // 'https://vercel.app' // Descomente e adicione quando fizer o deploy do frontend
];

// 1. Criamos o servidor HTTP com tratamento de CORS
const server = http.createServer((req, res) => {
  const origin = req.headers.origin;

  // Se a origem da requisição estiver na nossa lista permitida, nós a liberamos
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  } else if (!origin) {
    // Permite requisições diretas de ferramentas de monitoramento (como UptimeRobot) que não enviam o cabeçalho Origin
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  // Trata requisições de pré-verificação (Preflight) do CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Rota de Health Check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end("ok"); // Alterado para "ok" em minúsculo para bater com o `page.tsx`
  }

  // Resposta padrão para outras rotas
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end("Servidor Ativo 🚀");
});

// 2. Acoplamos o WebSocket e validamos a origem da conexão (Segurança extra)
const wss = new WebSocketServer({ 
  server,
  verifyClient: (info, callback) => {
    const origin = info.origin;
    // Permite conexões se a origem for válida ou se vier do próprio ambiente interno do Render
    if (ALLOWED_ORIGINS.includes(origin) || !origin || origin.includes('render.com')) {
      callback(true);
    } else {
      console.warn(`Conexão WebSocket rejeitada de uma origem não autorizada: ${origin}`);
      callback(false, 403, 'Origem não permitida (CORS)');
    }
  }
});

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
