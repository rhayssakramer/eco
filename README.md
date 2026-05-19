<div align="center">

# 💜 ECO - Sua voz contra a violência

**A voz que não pode ser ignorada**

ECO é uma plataforma de denúncia anônima de violência com foco em segurança, anonimato e impacto social. Desenvolvida com .NET e Angular, integra dados externos de violência com relatórios de usuários para criar uma visão abrangente sobre violência em Pernambuco.

[![Backend](https://img.shields.io/badge/Backend-.NET%2010.0-512BD4?style=for-the-badge&logo=dotnet)](https://dotnet.microsoft.com)
[![Frontend](https://img.shields.io/badge/Frontend-Angular%2019-DD0031?style=for-the-badge&logo=angular)](https://angular.io)
[![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20SQL%20Server-003B57?style=for-the-badge&logo=sqlite)](https://sqlite.org)
[![Maps](https://img.shields.io/badge/Maps-Google%20Maps%20API-4285F4?style=for-the-badge&logo=googlemaps)](https://cloud.google.com/maps-platform)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](https://github.com/rhayssakramer/eco/edit/main/README.md#%EF%B8%8F-arquitetura)
- [Tecnologias](#-tecnologias)
- [Estrutura do Repositório](#-estrutura-do-repositório)
- [Pré-requisitos](#-pré-requisitos)
- [Imagens](#-imagens)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Executando o Projeto](#-executando-o-projeto)
- [API Endpoints](#-api-endpoints)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Modelos de Dados](#-modelos-de-dados)
- [Créditos](#-créditos)

---

## 🌟 Sobre o Projeto

O **ECO** é uma plataforma web desenvolvida para facilitar denúncias de violência de forma segura e anônima. Com foco em Pernambuco, integra dados públicos de órgãos como a Secretaria de Segurança Pública com relatos de usuários, criando um painel de inteligência sobre padrões de violência.

A plataforma permite que:

- 🔐 Usuários façam denúncias anônimas ou identificadas
- 📊 Administradores importem dados de violência (CSV, PDF, Excel)
- 🗺️ Visualizem violência em mapa interativo com Google Maps
- 📈 Comparem dados externos com registros internos
- 👤 Criem perfil de usuário para acompanhar denúncias
- 🎯 Moderadores revisem e aprovem denúncias antes de publicação

Ideal para **ONGs**, **órgãos de segurança**, **ativistas sociais** e **pesquisadores** que trabalham com dados de violência e segurança pública.

---

## ✨ Funcionalidades

### Para Usuários Anônimos
- ✅ Fazer denúncias anônimas de violência
- ✅ Descrever o tipo, local e hora do incidente
- ✅ Anexar evidências (imagens, vídeos, arquivos)
- ✅ Acompanhar status da denúncia via código
- ✅ Visualizar mapa de calor com violência reportada

### Para Usuários Identificados
- ✅ Registrar-se com e-mail e senha
- ✅ Criar denúncias vinculadas ao perfil
- ✅ Gerenciar histórico de denúncias
- ✅ Redefinir senha via e-mail
- ✅ Visualizar dashboard pessoal com relatório

### Para Moderadores
- ✅ Revisar denúncias pendentes
- ✅ Aprovar ou reprovar denúncias
- ✅ Adicionar anotações administrativas
- ✅ Alterar status das denúncias
- ✅ Exportar relatórios de denúncias

### Para Administradores
- ✅ Gerenciar usuários e permissões
- ✅ Importar dados de violência (CSV/PDF/Excel)
- ✅ Comparar dados externos com banco interno
- ✅ Visualizar estatísticas e heatmap de violência
- ✅ Configurar perfis de usuário
- ✅ Gerenciar sistema e manutenção

### Geral
- ✅ Autenticação com JWT (validade configurável)
- ✅ Mapa interativo com visualização de denúncias
- ✅ Upload seguro de arquivos e mídias
- ✅ Processamento de Excel e PDF com extração de dados
- ✅ Comparação automática de dados de violência
- ✅ Documentação automática da API via Swagger/OpenAPI
- ✅ Sistema responsivo para mobile e desktop

---

## 🏛️ Arquitetura

O projeto é uma aplicação **full stack** dividida em dois serviços independentes:

```
ECO/
├── Eco.Api/       → API REST em ASP.NET Core 10.0 (C#)
└── Eco.App/       → SPA em Angular 19 com TypeScript
```

### Backend — Clean Architecture

```
Controllers  →  Services  →  Models  →  DbContext (EF Core)
                    ↓
              DTOs / Exceptions
```

- **Controllers**: Recebem requisições HTTP e delegam para os serviços
- **Services**: Contêm lógica de negócio isolada
  - `DadosPublicosService`: Importação e processamento de dados CSV
  - `ProcessarArquivosService`: Leitura de Excel (ClosedXML) e PDF (iTextSharp)
- **Models**: Entidades de domínio (Denuncia, Usuario, DadoPublicoExterno)
- **DTOs**: Objetos de transferência para requisições/respostas
- **Data**: Entity Framework Core DbContext e Migrations
- **Middleware**: Tratamento de erros e segurança

### Banco de Dados por Ambiente

| Ambiente | Banco de Dados |
|----------|----------------|
| Development | SQLite (arquivo local) |
| Production | SQL Server |

---

## 💻 Tecnologias

### Backend

| Categoria | Tecnologia | Versão |
|-----------|-----------|--------|
| Framework | ASP.NET Core | 10.0 |
| Linguagem | C# | 13 |
| ORM | Entity Framework Core | 10.0 |
| Banco (dev) | SQLite | — |
| Banco (prod) | SQL Server | 2019+ |
| Autenticação | JWT Bearer | — |
| Hash de Senha | BCrypt | — |
| Excel | ClosedXML | 0.102.1 |
| PDF | iTextSharp | 5.5.13.3 |
| Documentação | Swashbuckle (Swagger) | 6.5.0 |

### Frontend

| Categoria | Tecnologia | Versão |
|-----------|-----------|--------|
| Framework | Angular | 19+ |
| Linguagem | TypeScript | 5.7 |
| Reatividade | RxJS Signals | 7.8.0 |
| HTTP Client | HttpClientModule | 19+ |
| Mapas | Google Maps API | Latest |
| Build | Angular CLI | 19+ |

### Serviços Externos

| Serviço | Finalidade |
|---------|-----------|
| Google Maps API | Visualização de denúncias em mapa interativo |
| SMTP (Gmail, Outlook) | Envio de e-mails para redefinição de senha |

---

## 📁 Estrutura do Repositório

```
eco/
├── README.md                          # Este arquivo
├── .gitignore                         # Arquivos ignorados pelo Git
├── Nuget.config                       # Configuração de feeds NuGet
│
├── Eco.Api/                           # API REST ASP.NET Core 10.0
│   ├── Eco.Api.csproj                 # Arquivo de projeto .NET
│   ├── Program.cs                     # Ponto de entrada e configuração
│   ├── appsettings.json               # Configurações (desenvolvimento)
│   ├── appsettings.Development.json   # Configurações de desenvolvimento
│   ├── appsettings.Homolog.json       # Configurações de homologação
│   ├── appsettings.Production.json    # Configurações de produção
│   ├── Eco.Api.http                   # Testes de endpoints HTTP
│   ├── Controllers/
│   │   ├── AuthController.cs          # Autenticação e login
│   │   └── DenunciasController.cs     # Denúncias, dados externos e mapa
│   ├── Services/
│   │   ├── DadosPublicosService.cs    # Importação de dados CSV
│   │   └── ProcessarArquivosService.cs # Leitura de Excel e PDF
│   ├── Models/
│   │   ├── Denuncia.cs                # Modelo de denúncia
│   │   ├── Usuario.cs                 # Modelo de usuário
│   │   ├── DadoPublicoExterno.cs      # Dados de violência externos
│   │   └── Evidencia.cs               # Evidências da denúncia
│   ├── Dtos/
│   │   ├── CreateDenunciaDto.cs       # DTO para criar denúncia
│   │   ├── DenunciaResponseDto.cs     # DTO de resposta
│   │   ├── UsuarioDtos.cs             # DTOs de usuário
│   │   ├── CreateDadoPublicoExternoDto.cs # DTO para dados externos
│   │   ├── ImportarDadosExternosUrlDto.cs # DTO para importar por URL
│   │   └── ImportacaoDadosExternosResultadoDto.cs # DTO de resultado
│   ├── Enums/
│   │   ├── StatusDenuncia.cs          # Status (Recebido, Analisando, etc)
│   │   └── TipoDenuncia.cs            # Tipos de violência
│   ├── Data/
│   │   ├── AppDbContext.cs            # DbContext do EF Core
│   │   ├── AppDbContextFactory.cs     # Factory para migrações
│   ├── Migrations/                    # Histórico de migrações do banco
│   ├── DataSources/
│   │   ├── dados-violencia-externos.csv # Dados de exemplo
│   │   ├── estupro-pe.csv             # Estatísticas de estupro
│   │   └── violencia-domestica-familiar-pe.csv # Violência doméstica
│   ├── uploads/                       # Pasta para uploads de arquivos
│   ├── Properties/
│   │   └── launchSettings.json        # Configuração de debug
│   └── bin/, obj/                     # Diretórios de build
│
└── Eco.App/                           # SPA Angular 19
    ├── angular.json                   # Configuração do Angular CLI
    ├── package.json                   # Dependências npm
    ├── tsconfig.json                  # Configuração TypeScript
    ├── src/
    │   ├── main.ts                    # Bootstrap do Angular
    │   ├── index.html                 # Template HTML
    │   ├── styles.css                 # Estilos globais
    │   └── app/
    │       ├── pages/
    │       │   ├── dashboard/         # Dashboard administrativo
    │       │   ├── home/              # Página inicial
    │       │   ├── login/             # Página de login
    │       │   └── denuncias/         # Gerenciamento de denúncias
    │       ├── services/
    │       │   ├── auth.service.ts    # Autenticação
    │       │   └── toast.service.ts   # Notificações
    │       ├── shared/
    │       │   └── toast/             # Componentes compartilhados
    │       └── app.component.ts       # Componente raiz
    └── dist/                          # Build de produção
```

---

## 📌 Pré-requisitos

### Para rodar o backend localmente
- [.NET 10.0 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- Git

> O banco de dados em desenvolvimento é **SQLite** — não requer instalação extra.

### Para rodar o frontend localmente
- [Node.js 18+](https://nodejs.org/)
- npm 10+

### Opcional
- [SQL Server Management Studio](https://docs.microsoft.com/pt-br/sql/ssms/download-sql-server-management-studio-ssms) (para produção)

---

## 🖼 Imagens
<img src="https://github.com/rhayssakramer/eco/blob/main/images/img_1.png">
<img src="https://github.com/rhayssakramer/eco/blob/main/images/img_2.png">
<img src="https://github.com/rhayssakramer/eco/blob/main/images/img_3.png">
<img src="https://github.com/rhayssakramer/eco/blob/main/images/img_4.png">
<img src="https://github.com/rhayssakramer/eco/blob/main/images/img_5.png">
<img src="https://github.com/rhayssakramer/eco/blob/main/images/img_6.png">
<img src="https://github.com/rhayssakramer/eco/blob/main/images/img_7.png">  
<img src="https://github.com/rhayssakramer/eco/blob/main/images/img_8.png">  
  
---

## 🔧 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/eco.git
cd eco
```

### 2. Configuração do Backend

```bash
cd Eco.Api

# Restaurar dependências
dotnet restore

# Aplicar migrações (cria banco SQLite automaticamente em desenvolvimento)
dotnet ef database update
```

#### Criar Usuário Administrador

Configure as variáveis de ambiente antes de iniciar a API:

**PowerShell (Windows):**
```powershell
$env:ECO_ADMIN_NOME="Administrador ECO"
$env:ECO_ADMIN_EMAIL="admin@eco.local"
$env:ECO_ADMIN_SENHA="Admin@123456"
```

**Bash (Linux/Mac):**
```bash
export ECO_ADMIN_NOME="Administrador ECO"
export ECO_ADMIN_EMAIL="admin@eco.local"
export ECO_ADMIN_SENHA="Admin@123456"
```

> Ao iniciar a API, se o usuário com esse e-mail não existir, ele será criado automaticamente com permissão de admin.

### 3. Configuração do Frontend

```bash
cd Eco.App
npm install
```

---

## 🚀 Executando o Projeto

### Backend

```bash
cd Eco.Api

# Modo desenvolvimento com hot reload
dotnet watch run

# Ou sem hot reload
dotnet run
```

Disponível em:
- **API:** `http://localhost:5000`
- **Swagger UI:** `http://localhost:5000/swagger`

### Frontend

```bash
cd Eco.App

# Servidor de desenvolvimento
npm start
```

Disponível em: **`http://localhost:4200`**

---

## 📡 API Endpoints

A documentação interativa completa está em `http://localhost:5000/swagger`.

### Autenticação — `/api/auth`

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/registrar` | Registrar novo usuário | ❌ |
| POST | `/api/auth/login` | Login e obtenção de JWT | ❌ |

**Exemplo de login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@eco.local", "senha": "Admin@123456"}'
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nome": "Administrador ECO",
    "email": "admin@eco.local",
    "isAdmin": true
  }
}
```

### Denúncias — `/api/denuncias`

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/denuncias` | Criar nova denúncia | ❌ |
| GET | `/api/denuncias` | Listar denúncias | Admin |
| GET | `/api/denuncias/{id}` | Buscar denúncia por ID | ❌ |
| PUT | `/api/denuncias/{id}/status` | Atualizar status | Admin |
| GET | `/api/denuncias/{id}/evidencias` | Listar evidências | — |
| POST | `/api/denuncias/{id}/evidencias` | Adicionar evidência | — |

### Dados Externos — `/api/denuncias/dados-externos`

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/denuncias/dados-externos` | Listar dados externos | ❌ |
| POST | `/api/denuncias/dados-externos` | Criar dado externo | Admin |
| POST | `/api/denuncias/dados-externos/importar-csv` | Importar arquivo CSV | Admin |
| POST | `/api/denuncias/dados-externos/comparar` | Comparar Excel/PDF com BD | Admin |
| POST | `/api/denuncias/dados-externos/importar-url` | Importar dados de URL | Admin |

**Exemplo de comparação de arquivo:**
```bash
curl -X POST http://localhost:5000/api/denuncias/dados-externos/comparar \
  -H "Authorization: Bearer <seu_token>" \
  -F "file=@dados-violencia.xlsx" \
  -F "fonte=SDS PE"
```

### Dashboard — `/api/denuncias/dashboard`

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/denuncias/dashboard/completo` | Resumo completo do dashboard | Admin |
| GET | `/api/denuncias/heatmap` | Dados para mapa de calor | ❌ |

Endpoints marcados com ✅ requerem o header:
```
Authorization: Bearer <seu_jwt_token>
```

---

## 🔐 Variáveis de Ambiente

### Backend

| Variável | Descrição | Padrão (dev) |
|----------|-----------|-------------|
| `ASPNETCORE_ENVIRONMENT` | Ambiente (Development, Production) | `Development` |
| `ASPNETCORE_URLS` | URLs de listening | `http://localhost:5000` |
| `ConnectionStrings__DefaultConnection` | String de conexão (SQLite dev) | Arquivo local |
| `ECO_ADMIN_NOME` | Nome do usuário admin inicial | — |
| `ECO_ADMIN_EMAIL` | E-mail do usuário admin | — |
| `ECO_ADMIN_SENHA` | Senha do usuário admin | — |
| `JWT_SECRET` | Chave secreta para JWT (min 32 chars) | Valor padrão interno |
| `JWT_EXPIRATION_MINUTES` | Minutos de validade do JWT | `1440` (24h) |

### Frontend

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `API_BASE_URL` | URL base da API | `http://localhost:5000` |
| `GOOGLE_MAPS_API_KEY` | Chave da Google Maps API | — |

---

## 📐 Modelos de Dados

### Usuario

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `Id` | int | Identificador único |
| `Nome` | string | Nome completo |
| `Email` | string | E-mail único |
| `Senha` | string | Hash BCrypt |
| `IsAdmin` | bool | Se é administrador |
| `CriadoEm` | DateTime | Data de criação |

### Denuncia

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `Id` | int | Identificador único |
| `Codigo` | string | Código único (ex: ECO-ABCD1234) |
| `UsuarioId` | int? | FK para Usuario (null se anônima) |
| `Anonima` | bool | Se é denúncia anônima |
| `Tipo` | int | Tipo de violência (enum) |
| `Descricao` | string | Descrição do incidente |
| `Latitude` | double? | Latitude do local |
| `Longitude` | double? | Longitude do local |
| `Status` | int | Status atual (Recebido, Analisando, Approved, Reprovado) |
| `DataCriacao` | DateTime | Data da denúncia |

### DadoPublicoExterno

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `Id` | int | Identificador único |
| `Bairro` | string | Nome do bairro/município |
| `Tipo` | string | Tipo de violência |
| `Quantidade` | int | Número de ocorrências |
| `Fonte` | string | Origem dos dados |
| `DataRegistro` | DateTime | Data do registro |
| `Latitude` | double | Latitude para mapeamento |
| `Longitude` | double | Longitude para mapeamento |

### Evidencia

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `Id` | int | Identificador único |
| `DenunciaId` | int | FK para Denuncia |
| `NomeArquivo` | string | Nome do arquivo |
| `Url` | string | URL do arquivo armazenado |
| `Tipo` | string | Tipo (imagem, vídeo, documento) |

---

# 👥 Créditos  

<div>
  <p><strong>A voz que não pode ser ignorada.</strong></p>
  <p>ECO: Denúncias de violência com foco em segurança, anonimato e impacto social.</p>
</div> 

*Nota: Este projeto é apenas para fins educacionais e não possui nenhuma afiliação oficial.*

## 👩🏼‍💻 Autora:
<table style="border=0">
  <tr>
    <td align="left">
      <a href="https://github.com/rhayssakramer">
        <span><b>Rhayssa Kramer</b></span>
      </a>
      <br>
      <span>Sr. Assoc, Full-Stack Development</span>
    </td>
  </tr>
</table> 
<div align="center"><p>© 2026 ECO. Todos os direitos reservados.</p></div>  

<div align="center"><a href="https://github.com/rhayssakramer"><img src="https://github.com/rhayssakramer/rhayssakramer/blob/main/img/rodape.png"></a></div>
