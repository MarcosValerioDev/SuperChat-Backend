# SuperChat Backend

Servidor de chat em tempo real feito com **Node.js** e **WebSocket** (biblioteca [`ws`](https://github.com/websockets/ws)). É o backend do [SuperChat Front](https://superchat-marcosdev.netlify.app): recebe as mensagens dos clientes conectados e repassa cada uma para todos eles (broadcast).

Um servidor HTTP e um servidor WebSocket compartilham a mesma porta, o que facilita o deploy em plataformas como o [Render](https://render.com).

## Funcionalidades

- **Chat em tempo real:** toda mensagem recebida é enviada a todos os clientes com conexão aberta, inclusive a quem enviou.
- **Restrição de origem:** conexões WebSocket só são aceitas de origens autorizadas.
- **CORS** nas rotas HTTP, com tratamento de requisições *preflight* (`OPTIONS`).
- **Health check** em `/health`, usado pelo frontend e por serviços de monitoramento (ex.: UptimeRobot) para manter a instância ativa.

## Tecnologias

| Tecnologia | Uso |
|---|---|
| Node.js 22.x | Runtime (versão fixada em `.node-version`: `22.22.0`) |
| `ws` ^8.18 | Servidor WebSocket |
| `http` (nativo) | Servidor HTTP, CORS e health check |

## Estrutura

```
SuperChat-Backend/
├── server.js        # Servidor HTTP + WebSocket (todo o código da aplicação)
├── package.json     # Script de start e dependências
├── .node-version    # Versão do Node usada no deploy
└── .gitignore
```

## Como rodar localmente

Pré-requisito: Node.js 22.

```bash
npm install
npm start
```

O servidor sobe em `http://localhost:8081` (WebSocket em `ws://localhost:8081`).

### Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `8081` | Porta do servidor HTTP/WebSocket |

## Endpoints

### HTTP

| Método | Rota | Resposta |
|---|---|---|
| `GET` | `/health` | `200` — `ok` (text/plain) |
| `OPTIONS` | qualquer | `204` — resposta ao *preflight* de CORS |
| `GET` | qualquer outra | `200` — `Servidor Ativo 🚀` |

### WebSocket

Conecte-se à raiz do servidor (`ws://localhost:8081` ou `wss://<seu-domínio>` em produção). Não há formato obrigatório de mensagem: o texto recebido é repassado como string para todos os clientes conectados.

Exemplo no navegador:

```js
const socket = new WebSocket('ws://localhost:8081');

socket.onopen = () => socket.send('Olá, pessoal!');
socket.onmessage = (event) => console.log('Mensagem recebida:', event.data);
```

## Origens permitidas

As origens autorizadas ficam na constante `ALLOWED_ORIGINS` em [server.js](server.js):

```js
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://superchat-marcosdev.netlify.app'
];
```

Regras aplicadas:

- **HTTP:** origens da lista recebem os cabeçalhos de CORS. Requisições sem cabeçalho `Origin` (ferramentas de monitoramento, `curl`) recebem `Access-Control-Allow-Origin: *`.
- **WebSocket:** a conexão é aceita se a origem estiver na lista, se não houver origem, ou se ela contiver `render.com`. Nos demais casos, a conexão é recusada com `403`.

Para liberar um novo domínio do frontend (ex.: um deploy na Vercel), basta adicioná-lo à lista.

## Deploy

O projeto está pronto para plataformas que executam `npm start` e definem a variável `PORT`, como o Render:

1. Crie um *Web Service* apontando para este repositório.
2. **Build command:** `npm install`
3. **Start command:** `npm start`
4. Adicione a URL do frontend em `ALLOWED_ORIGINS`.
5. (Opcional) Configure um monitor no UptimeRobot apontando para `/health`, para evitar que a instância gratuita hiberne.

## Pontos de melhoria

- A dependência `cors` está no `package.json`, mas não é usada (o CORS é feito manualmente). Pode ser removida.
- A checagem `origin.includes('render.com')` é ampla: aceitaria, por exemplo, `https://render.com.exemplo.net`. Comparar o hostname exato seria mais seguro.
- As mensagens não são validadas nem têm limite de tamanho, e não existe histórico, identificação de usuários ou salas.
