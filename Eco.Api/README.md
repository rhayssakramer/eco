<div align="center">

# 🌿 ECO API — Backend

**API REST para Plataforma de Denúncias de Violência**

ECO API é o backend que alimenta a plataforma ECO. Desenvolvida em ASP.NET Core 10.0 com C#, oferece um conjunto robusto de endpoints para gerenciar denúncias, dados de violência, autenticação e geração de relatórios com segurança em primeiro lugar.

[![Framework](https://img.shields.io/badge/Framework-ASP.NET%20Core%2010.0-512BD4?style=for-the-badge&logo=dotnet)](https://dotnet.microsoft.com)
[![Language](https://img.shields.io/badge/Language-C%23%2013-239120?style=for-the-badge&logo=csharp)](https://docs.microsoft.com/en-us/dotnet/csharp/)
[![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20SQL%20Server-003B57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org)
[![ORM](https://img.shields.io/badge/ORM-Entity%20Framework%20Core%2010-512BD4?style=for-the-badge&logo=dotnet)](https://docs.microsoft.com/en-us/ef/core/)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Executando](#-executando)
- [API Endpoints](#-api-endpoints)
- [Models e DTOs](#-models-e-dtos)
- [Services](#-services)
- [Database](#-database)
- [Autenticação e Segurança](#-autenticação-e-segurança)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Build e Deploy](#-build-e-deploy)
- [Guias de Desenvolvimento](#-guias-de-desenvolvimento)

---

## 🌟 Sobre o Projeto

A **ECO API** é uma API REST desenvolvida em **ASP.NET Core 10.0** que fornece toda a lógica de negócio para a plataforma ECO. Gerencia:

- 🔐 Autenticação e autorização de usuários
- 📝 Criação, consulta e gerenciamento de denúncias
- 📊 Importação e processamento de dados de violência (CSV, PDF, Excel)
- 🗺️ Dados geográficos para visualização em mapa
- 📈 Geração de estatísticas e relatórios
- 🔄 Comparação entre dados internos e externos

A API segue princípios de **Clean Architecture**, utiliza **Entity Framework Core** para acesso a dados e implementa autenticação com **JWT**.

---

## ✨ Funcionalidades

### Autenticação e Usuários
- ✅ Registro de novos usuários
- ✅ Login com e-mail e senha
- ✅ Geração de JWT com validade configurável
- ✅ Perfis de usuário (Admin, Usuario)
- ✅ Criação automática de admin por variáveis de ambiente
- ✅ Validação de permissões (role-based access control)

### Denúncias
- ✅ Criar denúncia anônima ou identificada
- ✅ Listar denúncias com filtros (status, tipo, data)
- ✅ Atualizar status de denúncia
- ✅ Anexar evidências (imagens, vídeos, documentos)
- ✅ Buscar denúncia por código
- ✅ Gerar código único para cada denúncia

### Dados de Violência
- ✅ Importar dados via CSV
- ✅ Importar dados via URL (JSON ou CSV)
- ✅ Processar arquivos Excel (XLSX, XLS)
- ✅ Processar arquivos PDF
- ✅ Comparar dados importados com banco de dados
- ✅ Extrair dados geográficos (latitude/longitude)
- ✅ Armazenar dados com rastreamento de fonte

### Dashboard e Relatórios
- ✅ Resumo completo (total de denúncias, dados externos)
- ✅ Mapa de calor com distribuição geográfica
- ✅ Estatísticas por tipo de violência
- ✅ Estatísticas por área de risco
- ✅ Dados por horário de ocorrência
- ✅ Exportar relatórios

### Processamento de Arquivos
- ✅ Ler e extrair dados de Excel
- ✅ Ler e extrair dados de PDF
- ✅ Validar coordenadas geográficas
- ✅ Processar grandes volumes de dados
- ✅ Tratamento de erros robusto

---

## 🏛️ Arquitetura

A aplicação segue **Clean Architecture** com separação clara de responsabilidades:

```
Requests
   ↓
Controllers (Recebem requisições HTTP)
   ↓
Services (Contêm lógica de negócio)
   ↓
Repositories/DbContext (Acesso a dados)
   ↓
Models (Entidades de domínio)
   ↓
Database (SQLite/SQL Server)
```

### Camadas

- **Controllers**: Manipulam requisições HTTP, delegam para Services
- **Services**: Implementam regras de negócio, orquestram operações
- **Data**: DbContext, Migrations, acesso ao banco
- **Models**: Entidades de domínio (Denuncia, Usuario, etc)
- **DTOs**: Objetos de transferência para requisições/respostas
- **Enums**: Tipos enumerados (StatusDenuncia, TipoDenuncia)

### Fluxo de Requisição

```
HTTP Request
    ↓
Routing (ApiController route)
    ↓
Action Method (Controller)
    ↓
Service Method (Business Logic)
    ↓
DbContext Query/Insert/Update
    ↓
Database Operation
    ↓
DTO Response
    ↓
HTTP Response
```

---

## 💻 Tecnologias

| Categoria | Tecnologia | Versão | Propósito |
|-----------|-----------|--------|----------|
| Framework | ASP.NET Core | 10.0 | Web API |
| Linguagem | C# | 13 | Desenvolvimento |
| ORM | Entity Framework Core | 10.0 | Acesso a dados |
| Database | SQLite (dev) | — | Desenvolvimento local |
| Database | SQL Server (prod) | 2019+ | Produção |
| Autenticação | JWT Bearer | — | Segurança |
| Excel | ClosedXML | 0.102.1 | Leitura de planilhas |
| PDF | iTextSharp | 5.5.13.3 | Leitura de PDFs |
| Documentação | Swashbuckle | 6.5.0 | Swagger/OpenAPI |
| Serialização | System.Text.Json | — | JSON |

---

## 📁 Estrutura do Projeto

```
Eco.Api/
├── README.md                          # Este arquivo
├── Eco.Api.csproj                     # Arquivo de projeto .NET
├── Program.cs                         # Configuração e startup
├── appsettings.json                   # Configurações padrão
├── appsettings.Development.json       # Configurações desenvolvimento
├── appsettings.Production.json        # Configurações produção
├── Eco.Api.http                       # Testes de endpoints HTTP
├── Nuget.config                       # Configuração de feeds NuGet
│
├── Controllers/
│   ├── AuthController.cs              # Autenticação (login, registro)
│   └── DenunciasController.cs         # Denúncias, dados, dashboard
│
├── Services/
│   ├── DadosPublicosService.cs        # Importação e processamento CSV
│   └── ProcessarArquivosService.cs    # Leitura de Excel e PDF
│
├── Models/
│   ├── Denuncia.cs                    # Entidade de denúncia
│   ├── Usuario.cs                     # Entidade de usuário
│   ├── DadoPublicoExterno.cs          # Entidade de dados externos
│   └── Evidencia.cs                   # Entidade de evidência
│
├── Dtos/
│   ├── CreateDenunciaDto.cs           # DTO para criar denúncia
│   ├── DenunciaResponseDto.cs         # DTO de resposta
│   ├── UsuarioDtos.cs                 # DTOs de usuário
│   ├── CreateDadoPublicoExternoDto.cs # DTO para dados externos
│   ├── ImportarDadosExternosUrlDto.cs # DTO para importação por URL
│   └── ImportacaoDadosExternosResultadoDto.cs # DTO de resultado
│
├── Enums/
│   ├── StatusDenuncia.cs              # Enum de status
│   │   # Recebido, Analisando, Aprovado, Reprovado, Arquivado
│   └── TipoDenuncia.cs                # Enum de tipos
│       # ViolenciaDomestica, Estupro, etc
│
├── Data/
│   ├── AppDbContext.cs                # DbContext do EF Core
│   ├── AppDbContextFactory.cs         # Factory para migrations
│
├── Migrations/
│   ├── 20260223235657_InitialCreate.cs
│   ├── 20260223235657_InitialCreate.Designer.cs
│   ├── ... (histórico de migrações)
│   └── AppDbContextModelSnapshot.cs   # Snapshot atual do modelo
│
├── DataSources/
│   ├── dados-violencia-externos.csv   # Dados de exemplo
│   ├── estupro-pe.csv                 # Estatísticas de estupro
│   └── violencia-domestica-familiar-pe.csv # Violência doméstica
│
├── Properties/
│   └── launchSettings.json            # Configuração de debug/launch
│
├── uploads/                           # Pasta para arquivos uploadados
│
├── bin/                               # Diretório de build (ignorado)
├── obj/                               # Diretório de objeto (ignorado)
│
└── global.json                        # Versão do SDK .NET
```

---

## 📌 Pré-requisitos

### Essencial
- [.NET 10.0 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- Git

### Opcional (para SQL Server em produção)
- [SQL Server 2019+](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
- [SQL Server Management Studio](https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)

### Verificar Instalação

```bash
dotnet --version      # Deve mostrar versão 10.0.x
dotnet --info         # Mostra informações detalhadas
```

---

## 🔧 Instalação e Configuração

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/eco.git
cd eco/Eco.Api
```

### 2. Restaurar Dependências

```bash
dotnet restore
```

### 3. Configurar Banco de Dados

Em desenvolvimento, o SQLite é criado automaticamente. Para aplicar migrações:

```bash
# Criar banco de dados
dotnet ef database update

# Ou, se receber erro de ferramenta:
dotnet tool install --global dotnet-ef
dotnet ef database update
```

### 4. Configurar Usuário Admin (Opcional)

Configure as variáveis de ambiente para criar admin automaticamente:

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

> O usuário será criado automaticamente na primeira execução se as variáveis estiverem definidas e o e-mail não existir no banco.

---

## 🚀 Executando

### Modo Desenvolvimento

```bash
# Com hot reload
dotnet watch run

# Ou sem hot reload
dotnet run
```

Disponível em:
- **API:** `http://localhost:5000`
- **Swagger UI:** `http://localhost:5000/swagger`

### Modo Produção

```bash
dotnet run --configuration Release
```

---

## 📡 API Endpoints

A documentação interativa está em `http://localhost:5000/swagger`.

### Autenticação — `/api/auth`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|-------------|
| POST | `/api/auth/registrar` | Registrar novo usuário | ❌ |
| POST | `/api/auth/login` | Login e obtenção de JWT | ❌ |

**Exemplo de Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@eco.local",
    "senha": "Admin@123456"
  }'
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

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|-------------|
| POST | `/api/denuncias` | Criar denúncia | ❌ |
| GET | `/api/denuncias` | Listar denúncias | Admin |
| GET | `/api/denuncias/{id}` | Obter denúncia por ID | ❌ |
| GET | `/api/denuncias/codigo/{codigo}` | Buscar por código | ❌ |
| PUT | `/api/denuncias/{id}/status` | Atualizar status | Admin |
| GET | `/api/denuncias/{id}/evidencias` | Listar evidências | — |
| POST | `/api/denuncias/{id}/evidencias` | Adicionar evidência | — |

**Exemplo de Criar Denúncia:**
```bash
curl -X POST http://localhost:5000/api/denuncias \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": 0,
    "descricao": "Violência doméstica no bairro X",
    "latitude": -8.0476,
    "longitude": -34.877,
    "anonima": true
  }'
```

### Dados Externos — `/api/denuncias/dados-externos`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|-------------|
| GET | `/api/denuncias/dados-externos` | Listar dados externos | ❌ |
| POST | `/api/denuncias/dados-externos` | Criar dado externo | Admin |
| POST | `/api/denuncias/dados-externos/importar-csv` | Importar arquivo CSV | Admin |
| POST | `/api/denuncias/dados-externos/comparar` | Comparar arquivo (Excel/PDF) | Admin |
| POST | `/api/denuncias/dados-externos/importar-url` | Importar de URL | Admin |

**Exemplo de Importar CSV:**
```bash
curl -X POST http://localhost:5000/api/denuncias/dados-externos/importar-csv \
  -H "Authorization: Bearer <seu_token>" \
  -F "file=@dados.csv" \
  -F "fonte=Secretaria de Segurança"
```

**Exemplo de Comparar Arquivo:**
```bash
curl -X POST http://localhost:5000/api/denuncias/dados-externos/comparar \
  -H "Authorization: Bearer <seu_token>" \
  -F "file=@dados-violencia.xlsx" \
  -F "fonte=SDS PE"
```

**Resposta de Comparação:**
```json
{
  "novosDados": [
    {
      "bairro": "RECIFE",
      "tipo": "Violência Doméstica",
      "quantidade": 2673
    }
  ],
  "comparacao": [
    {
      "bairro": "RECIFE",
      "tipo": "Violência Doméstica",
      "novo": 2673,
      "existente": 2500,
      "diferenca": 173,
      "percentualMudanca": 6.92
    }
  ]
}
```

### Dashboard — `/api/denuncias/dashboard`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|-------------|
| GET | `/api/denuncias/dashboard/completo` | Resumo completo | Admin |
| GET | `/api/denuncias/heatmap` | Dados para mapa de calor | ❌ |

**Exemplo de Heatmap:**
```bash
curl http://localhost:5000/api/denuncias/heatmap
```

**Resposta:**
```json
{
  "denuncias": [
    {
      "latitude": -8.0476,
      "longitude": -34.877,
      "quantidade": 42
    }
  ],
  "publicos": [
    {
      "latitude": -8.0476,
      "longitude": -34.877,
      "quantidade": 2673
    }
  ]
}
```

---

## 📐 Models e DTOs

### Model: Denuncia

```csharp
public class Denuncia
{
    public int Id { get; set; }
    public string Codigo { get; set; }              // ECO-ABC123DE
    public int? UsuarioId { get; set; }             // null se anônima
    public bool Anonima { get; set; }
    public int Tipo { get; set; }                   // TipoDenuncia enum
    public string Descricao { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public int Status { get; set; }                 // StatusDenuncia enum
    public DateTime DataCriacao { get; set; }
    
    // Relationships
    public Usuario? Usuario { get; set; }
    public ICollection<Evidencia> Evidencias { get; set; }
}
```

### Model: Usuario

```csharp
public class Usuario
{
    public int Id { get; set; }
    public string Nome { get; set; }
    public string Email { get; set; }               // Único
    public string Senha { get; set; }               // Hash BCrypt
    public bool IsAdmin { get; set; }
    public DateTime CriadoEm { get; set; }
    
    // Relationships
    public ICollection<Denuncia> Denuncias { get; set; }
}
```

### Model: DadoPublicoExterno

```csharp
public class DadoPublicoExterno
{
    public int Id { get; set; }
    public string Bairro { get; set; }
    public string Tipo { get; set; }
    public int Quantidade { get; set; }
    public string Fonte { get; set; }
    public DateTime DataRegistro { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}
```

### Model: Evidencia

```csharp
public class Evidencia
{
    public int Id { get; set; }
    public int DenunciaId { get; set; }
    public string NomeArquivo { get; set; }
    public string Url { get; set; }
    public string Tipo { get; set; }                // image, video, document
    
    // Relationships
    public Denuncia Denuncia { get; set; }
}
```

### DTO: CreateDenunciaDto

```csharp
public class CreateDenunciaDto
{
    public int Tipo { get; set; }
    public string Descricao { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool Anonima { get; set; }
    public int? UsuarioId { get; set; }
}
```

---

## 🔧 Services

### DadosPublicosService

Responsável por importar e processar dados de violência.

```csharp
public class DadosPublicosService
{
    // Ler CSV de arquivo
    public List<DadoPublico> LerCsv(string caminho)
    
    // Ler CSV de stream
    public List<DadoPublicoExterno> LerCsvExterno(Stream stream, string fontePadrao)
    
    // Importar dados de URL
    public Task<List<DadoPublicoExterno>> ImportarDadosDeUrlAsync(string url, string fonte)
    
    // Persistir dados externos em arquivo CSV
    public List<DadoPublicoExterno> PersistirDadosExternos(
        string caminho,
        List<DadoPublicoExterno> dados,
        bool substituir = false
    )
}
```

### ProcessarArquivosService

Responsável por processar arquivos Excel e PDF.

```csharp
public class ProcessarArquivosService
{
    // Ler dados de arquivo Excel
    public List<(string bairro, string tipo, int quantidade)> LerExcel(Stream stream)
    
    // Ler dados de arquivo PDF
    public List<(string bairro, string tipo, int quantidade)> LerPdf(Stream stream)
}
```

---

## 🗄️ Database

### Ambiente de Desenvolvimento

Por padrão, utiliza **SQLite** armazenado localmente em `eco.db` ou similar.

```csharp
// appsettings.Development.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=eco.db"
  }
}
```

### Ambiente de Produção

Utiliza **SQL Server** com string de conexão em variável de ambiente.

```csharp
// appsettings.Production.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=seu-servidor;Database=eco_db;User Id=sa;Password=..."
  }
}
```

### Migrações

Criar nova migração:
```bash
dotnet ef migrations add MigrationName
```

Aplicar migrações:
```bash
dotnet ef database update
```

Desfazer última migração:
```bash
dotnet ef migrations remove
```

---

## 🔐 Autenticação e Segurança

### JWT (JSON Web Token)

O token JWT é gerado no login e deve ser enviado em todas as requisições autenticadas:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Propriedades do Token:**
- **Algoritmo:** HS256
- **Validade:** 24 horas (configurável)
- **Issuer:** ECO API
- **Audience:** ECO App

### Senhas

Senhas são hasheadas com **BCrypt** e nunca são armazenadas em texto plano.

```csharp
// Hasheando senha
var senhaCriptografada = BCrypt.Net.BCrypt.HashPassword(senha);

// Verificando senha
bool senhaCorreta = BCrypt.Net.BCrypt.Verify(senhaTexto, senhaCriptografada);
```

### CORS

A API permite requisições de `http://localhost:4200` (frontend em desenvolvimento).

```csharp
// Em Program.cs
services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder.WithOrigins("http://localhost:4200")
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});
```

---

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Padrão (Dev) | Obrigatória |
|----------|-----------|-------------|-----------|
| `ASPNETCORE_ENVIRONMENT` | Ambiente (Development, Production) | Development | — |
| `ASPNETCORE_URLS` | URLs de listening | `http://localhost:5000` | — |
| `ECO_ADMIN_NOME` | Nome do usuário admin inicial | — | ❌ |
| `ECO_ADMIN_EMAIL` | E-mail do usuário admin | — | ❌ |
| `ECO_ADMIN_SENHA` | Senha do usuário admin | — | ❌ |
| `JWT_SECRET` | Chave secreta para assinatura (min 32 chars) | Valor interno | ⚠️ (usar em prod) |
| `JWT_EXPIRATION_MINUTES` | Minutos de validade do JWT | 1440 (24h) | — |

### Exemplo de .env (não commitar)

```env
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=https://localhost:5001
JWT_SECRET=sua_chave_super_secreta_com_minimo_32_caracteres_aqui
JWT_EXPIRATION_MINUTES=1440
ECO_ADMIN_NOME=Administrador ECO
ECO_ADMIN_EMAIL=admin@eco.com
ECO_ADMIN_SENHA=SenhaForte@123456
```

---

## 🏗️ Build e Deploy

### Build para Produção

```bash
dotnet publish -c Release -o ./publish
```

Saída: `./publish/`

### Build Docker

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app
COPY . .
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/out .
EXPOSE 5000
ENTRYPOINT ["dotnet", "Eco.Api.dll"]
```

**Build e executar:**
```bash
docker build -t eco-api .
docker run -p 5000:5000 eco-api
```

### Deploy em Produção

Recomenda-se usar:
- **Docker** em servidores com suporte a containers
- **IIS** se usando Windows Server
- **Linux** com Nginx reverse proxy

---

## 🛠️ Guias de Desenvolvimento

### Adicionar um Novo Endpoint

1. **Criar DTO (se necessário):**
```csharp
public class MeuNovoDto
{
    public string Campo1 { get; set; }
    public int Campo2 { get; set; }
}
```

2. **Adicionar método no Service:**
```csharp
public async Task<MeuNovoDto> MeuMetodoAsync(MeuNovoDto dto)
{
    // Lógica aqui
    return resultado;
}
```

3. **Adicionar método no Controller:**
```csharp
[HttpPost("meu-endpoint")]
public async Task<IActionResult> MeuEndpoint([FromBody] MeuNovoDto dto)
{
    var resultado = await _service.MeuMetodoAsync(dto);
    return Ok(resultado);
}
```

### Adicionar Nova Migration

```bash
# 1. Modificar Models
# (adicionar propriedade em Denuncia, Usuario, etc)

# 2. Criar migration
dotnet ef migrations add NomeDescritivo

# 3. Revisar arquivo gerado em Migrations/

# 4. Aplicar migration
dotnet ef database update
```

### Teste de Endpoints (Eco.Api.http)

Arquivo `Eco.Api.http` contém testes REST que podem ser executados diretamente em VS Code com a extensão "REST Client":

```http
### Login
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@eco.local",
  "senha": "Admin@123456"
}

###
```

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

```bash
# Verificar se banco existe
dotnet ef database update

# Deletar e recrear banco (dev apenas!)
dotnet ef database drop --force
dotnet ef database update
```

### Erro: "The required Microsoft.Data.SqlClient version..."

```bash
# Restaurar dependências novamente
dotnet restore
```

### Erro de CORS

Verifique `appsettings.json` para CORS configurado corretamente para sua URL de frontend.

### JWT inválido ou expirado

- Verifique se `JWT_SECRET` é consistente
- Verifique expiração do token
- Faça novo login para gerar novo token

---

## 📚 Recursos Úteis

- [ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core/)
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/)
- [JWT Authentication](https://jwt.io/)
- [Swagger/OpenAPI](https://swagger.io/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

## 👥 Contribuindo

Para contribuir com o backend:

1. Crie uma branch: `git checkout -b feature/minha-feature`
2. Faça suas mudanças seguindo o padrão de código
3. Commit: `git commit -m "feat: descrição da feature"`
4. Push: `git push origin feature/minha-feature`
5. Abra um Pull Request

### Padrões de Código

- Seguir convenções de nomenclatura C#
- Usar async/await para operações I/O
- Adicionar validação em DTOs
- Documentar métodos públicos com XML docs
- Tratar exceções apropriadamente

---

## 📄 Licença

Este projeto está sob licença [MIT](LICENSE).

---

<div align="center">
  <p><strong>ECO API — Backend para Plataforma de Denúncias de Violência</strong></p>
  <p>Desenvolvido com ASP.NET Core 10.0 e C#</p>
  <sub>© 2026 ECO. Todos os direitos reservados.</sub>
</div>
