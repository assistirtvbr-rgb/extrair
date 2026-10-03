# LeadMap — Inteligência de Mercado & Prospecção Local B2B

LeadMap é uma plataforma SaaS visual de prospecção comercial, mapeamento de mercado e inteligência competitiva projetada para equipes de vendas e inteligência de negócios.

O sistema utiliza a **Google Places API (New)** através de um **Cloudflare Worker (Proxy Seguro)** com `FieldMask` otimizado para que a chave da API nunca seja exposta no navegador do cliente.

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    LeadMap Front-End                    │
│      (React + Vite + Pure CSS + Leaflet / MapEngine)    │
│                 Hospedado no Cloudflare Pages           │
└───────────────────────────┬─────────────────────────────┘
                            │ POST /api/search
                            ▼
┌─────────────────────────────────────────────────────────┐
│                Cloudflare Worker (Proxy)                │
│    - Validação de entrada & limite de raio (100m - 50km)│
│    - FieldMask restrito para economia de cota e custos  │
│    - Proteção de Segredo (GOOGLE_PLACES_API_KEY)        │
└───────────────────────────┬─────────────────────────────┘
                            │ POST https://places.googleapis.com/v1/places:searchText
                            ▼
┌─────────────────────────────────────────────────────────┐
│               Google Places API (New)                   │
│        Retorno sanitizado dos dados de estabelecimentos │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Como Rodar o Front-End Localmente

### 1. Pré-requisitos
- **Node.js**: Versão 18+ (Node 20+ recomendado)
- **NPM**: Versão 9+

### 2. Instalação das Dependências
```bash
npm install
```

### 3. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse a aplicação no navegador em: `http://localhost:5173`

> **Nota de Demonstração Imediata:** A aplicação possui um provedor de dados sintéticos de alta fidelidade integrado para o mercado brasileiro (Odontologia, Academias, Restaurantes, Pet shops, Advogados, Imobiliárias, Salões, etc.). Isso permite testar imediatamente todas as telas, mapa, filtros, comparador de regiões, radar de concorrentes, exportação e CRM mesmo antes de conectar a chave da Google Cloud.

---

## 🔑 Configuração do Google Cloud Platform

Para utilizar dados reais da Google Places API (New):

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um novo projeto ou selecione um existente (ex: `leadmap-production`).
3. No menu lateral, acesse **APIs e Serviços > Biblioteca**.
4. Pesquise por **Places API (New)** e clique em **Ativar**.
5. Acesse **APIs e Serviços > Credenciais** e clique em **Criar Credenciais > Chave de API**.
6. *(Recomendado para segurança)* Restrinja a chave:
   - **Restrições de API:** Marque exclusivamente `Places API (New)`.
   - **Restrições de aplicativo:** Se desejar, configure restrição por IP dos servidores do Cloudflare ou deixe irrestrito caso use via Worker.

---

## ⚡ Configuração e Deploy do Cloudflare Worker

O backend do LeadMap está localizado na pasta `/worker`.

### 1. Acessar a pasta do Worker
```bash
cd worker
```

### 2. Iniciar sessão no Cloudflare com o Wrangler
```bash
npx wrangler login
```

### 3. Configurar a Chave Secreta da Google API no Cloudflare
Execute o comando abaixo para salvar a sua chave de forma criptografada nos segredos do Cloudflare Worker:
```bash
npx wrangler secret put GOOGLE_PLACES_API_KEY
```
*O terminal solicitará que você cole o valor da sua chave da Google Places API.*

### 4. Testar o Worker Localmente
```bash
npx wrangler dev
```
O Worker responderá localmente em: `http://localhost:8787/api/search`

### 5. Fazer Deploy do Worker em Produção
```bash
npx wrangler deploy
```
O Wrangler fornecerá uma URL pública como:
`https://leadmap-worker.<seu-subdominio>.workers.dev`

---

## 🌐 Conectar o Front-End ao seu Worker em Produção

Você tem duas formas fáceis de apontar o front-end para o seu Worker:

### Opção A: Via Variável de Ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_WORKER_API_URL=https://leadmap-worker.<seu-subdominio>.workers.dev/api/search
```

### Opção B: Diretamente na Interface da Aplicação
1. Abra o LeadMap.
2. Clique no ícone de **Configurações** na barra lateral esquerda.
3. No campo **URL do Endpoint Cloudflare Worker**, cole o endereço do seu Worker e clique em **Salvar Parâmetros**.

---

## ☁️ Deploy do Front-End no Cloudflare Pages

1. Acesse o **Cloudflare Dashboard > Workers & Pages > Create application > Pages**.
2. Conecte seu repositório Git ou faça o upload direto do diretório de build.
3. Configure os parâmetros de compilação:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variables:**
     - `VITE_WORKER_API_URL`: `https://leadmap-worker.<seu-subdominio>.workers.dev/api/search`
4. Clique em **Save and Deploy**.

---

## 🌟 Funcionalidades e Diferenciais do LeadMap

- **Pesquisa por Raio & GPS:** Busca com raio de 1 km até 50 km ou valor customizado com círculo visual delimitador no mapa.
- **Filtros Avançados:** Filtre por nota mínima (3+, 4+, 4.5+), quantidade de avaliações, presença de telefone, presença de website e horários de funcionamento.
- **Visualização Dupla:** Alterne entre Diretório Limpo e Modo Tabela Avançada com colunas completas.
- **Explorar Área:** Clique em qualquer ponto do mapa para reposicionar a pesquisa instantaneamente.
- **Radar de Concorrentes:** Selecione uma empresa para mapear concorrentes em raios de 2 km e 5 km com métricas de nota média do setor.
- **Camada de Cobertura / Densidade:** Mapa térmico com visualização de saturação e oportunidades de mercado.
- **Comparador de Regiões:** Compare até 3 bairros ou cidades lado a lado (densidade comercial por km², % com site, notas e reviews médios).
- **Pipeline de Leads & CRM:** Classifique contatos (Novo, Pesquisar, Contato futuro, Contato realizado, Interessado, Sem interesse, Cliente), adicione tags e observações comerciais persistidas localmente.
- **Exportação Multiformato:** Exporte para **CSV** com seleção granular de colunas, **JSON** ou **Copiar para a Área de Transferência**.
- **Atalhos de Produtividade:**
  - `Ctrl + K` / `⌘ + K`: Focar campo de busca
  - `Esc`: Fechar gaveta de detalhes ou modais
  - `Ctrl + A` / `⌘ + A`: Selecionar todos os leads da página

---

## 🔒 Segurança e Privacidade
- A chave da Google Places API nunca trafega no navegador do usuário.
- O Cloudflare Worker valida e sanitiza todas as requisições antes de repassar à API do Google.
- A persistência de dados de leads e anotações é feita no armazenamento seguro do navegador (`localStorage`) via camada de abstração `storageService.js`.
