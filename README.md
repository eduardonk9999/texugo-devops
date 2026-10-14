# texugo-site

Site estático do texugo-do-mel servido por Nginx (Alpine) em container Docker.

## Estrutura

```
.
├── Dockerfile           # nginx:alpine + cópia de website/
├── docker-compose.yml   # serviço "web" na porta 80, com volume pra dev
└── website/             # HTML, CSS, JS e imagens do site
    ├── index.html
    ├── style.css
    ├── script.js
    └── assets/

```

## Rodando com Docker

Build da imagem:

```bash
docker build -t site-texugo:v1.0 .
```

Subir o container:::

```bash
docker run -d --name texugo -p 8080:80 site-texugo:v1.0
```

Acesse http://localhost:8080 — deve aparecer a página do texugo (se aparecer
"Welcome to nginx", o `COPY website/` não funcionou).

Parar e remover:

```bash
docker rm -f texugo
```

## Rodando com Docker Compose

```bash
docker compose up -d --build
```

Acesse http://localhost (porta 80). O compose monta `./website` como volume,
então alterações nos arquivos aparecem direto, sem rebuild — só recarregar a
página.

Derrubar:

```bash
docker compose down
```
