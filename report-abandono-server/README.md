# ReportAbandono - Back-end

Back-end do sistema de gerenciamento de denúncias de abandono de animais.

## Tecnologias

- Node.js
- TypeScript
- Express
- Prisma ORM
- MySQL

## Estrutura do Projeto

```
report-abandono-server/
├── src/
│   ├── controllers/    # Controllers (camada de apresentação)
│   ├── services/       # Services (regras de negócio)
│   ├── routes/         # Rotas da API
│   ├── middlewares/    # Middlewares (autenticação, validação, etc)
│   ├── prisma/         # Schema Prisma e cliente
│   │   ├── schema.prisma
│   │   └── client.ts
│   └── server.ts       # Arquivo principal do servidor
├── .env                # Variáveis de ambiente (criar baseado no .env.example)
├── .env.example        # Exemplo de variáveis de ambiente
├── package.json
└── tsconfig.json
```

## Instalação

1. Instalar dependências:

```bash
npm install
```

2. Configurar variáveis de ambiente:

Copie o arquivo `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure a `DATABASE_URL` com suas credenciais do MySQL:

```
DATABASE_URL="mysql://usuario:senha@localhost:3306/report_abandono"
```

3. Gerar o Prisma Client:

```bash
npm run prisma:generate
```

4. Criar e executar as migrations:

```bash
npm run prisma:migrate
```

## Comandos Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento (watch mode)
- `npm run build` - Compila o TypeScript para JavaScript
- `npm run start` - Inicia o servidor em produção (após build)
- `npm run prisma:generate` - Gera o Prisma Client
- `npm run prisma:migrate` - Cria e executa migrations
- `npm run prisma:studio` - Abre o Prisma Studio (interface gráfica do banco)
- `npm run prisma:deploy` - Aplica migrations em produção

## Desenvolvimento

O servidor roda na porta **3333** por padrão (configurável via `PORT` no `.env`).

Para iniciar em modo desenvolvimento:

```bash
npm run dev
```

Acesse: http://localhost:3333

## API Endpoints

### Health Check

- `GET /` - Mensagem de boas-vindas
- `GET /health` - Status da API

## Próximos Passos

- Implementar autenticação (login, registro, recuperação de senha)
- Implementar CRUD de denúncias
- Implementar serviço de atribuição automática de ONGs (cálculo de distância)
- Implementar upload de mídia
- Implementar histórico de denúncias
