<div align="center">

# 🌿 ECO App — Frontend

**Interface Web para Denúncias de Violência**

ECO App é a aplicação frontend que compõe a plataforma ECO. Desenvolvida em Angular 19 com TypeScript, oferece uma interface intuitiva para denunciantes, moderadores e administradores gerenciarem relatórios de violência com segurança e privacidade.

[![Framework](https://img.shields.io/badge/Framework-Angular%2019-DD0031?style=for-the-badge&logo=angular)](https://angular.io)
[![Language](https://img.shields.io/badge/Language-TypeScript%205.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Node](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Reactivity](https://img.shields.io/badge/Reactivity-RxJS%20Signals-EC4899?style=for-the-badge&logo=reactivex)](https://rxjs.dev)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Executando](#-executando)
- [Componentes Principais](#-componentes-principais)
- [Serviços](#-serviços)
- [Guias de Desenvolvimento](#-guias-de-desenvolvimento)
- [Build para Produção](#-build-para-produção)

---

## 🌟 Sobre o Projeto

O **ECO App** é a interface web responsável por oferecer uma experiência segura e responsiva para usuários denunciarem violência. A aplicação se comunica com a API REST do backend (Eco.Api) e oferece:

- 🔐 Autenticação segura com JWT
- 🗺️ Visualização de violência em mapa interativo (Google Maps)
- 📊 Dashboard administrativo com estatísticas
- 📤 Upload de arquivos e evidências
- 📱 Design responsivo para mobile e desktop
- 🎯 Interface intuitiva e acessível

A aplicação utiliza **Angular 19** com **TypeScript**, **RxJS Signals** para reatividade moderna e se comunica com a API via **HttpClient**.

---

## ✨ Funcionalidades

### Página Inicial
- 📋 Visualização de denúncias públicas
- 🗺️ Mapa interativo com localização das denúncias
- 📊 Heatmap de calor mostrando regiões mais violentas
- 🔗 Links para login ou criar nova denúncia

### Denúncias
- ✅ Criar denúncia anônima ou identificada
- ✅ Seleção de tipo de violência
- ✅ Localização via mapa ou coordenadas
- ✅ Upload de evidências (imagens, vídeos, documentos)
- ✅ Acompanhar status via código de denúncia
- ✅ Visualizar denúncias pessoais (usuário identificado)

### Autenticação
- ✅ Registro de novo usuário
- ✅ Login com e-mail e senha
- ✅ Persistência de sessão (JWT em localStorage)
- ✅ Logout seguro
- ✅ Redefinição de senha (integração com backend)

### Dashboard Administrativo
- ✅ Visualizar todas as denúncias
- ✅ Filtrar por status, tipo, data
- ✅ Buscar denúncias por termo
- ✅ Importar dados de violência (CSV/PDF/Excel)
- ✅ Comparar dados externos com banco interno
- ✅ Visualizar estatísticas gerais
- ✅ Gerenciar status das denúncias
- ✅ Visualizar mapa de violência
- ✅ Exportar relatórios

### Componentes Compartilhados
- ✅ Toast/Notificações (sucesso, erro, aviso, info)
- ✅ Menu de perfil de usuário
- ✅ Componentes de carregamento
- ✅ Modais e diálogos

---

## 🏛️ Arquitetura

A aplicação segue o padrão de **Component-Based Architecture** com separação clara de responsabilidades:

```
App Component
├── Pages (Rotas principais)
│   ├── Home
│   ├── Login
│   ├── Dashboard
│   └── Denuncias
├── Shared Components (Reutilizáveis)
│   ├── Toast
│   ├── ProfileMenu
│   └── Loading
├── Services (Lógica de negócio)
│   ├── AuthService
│   ├── DenunciaService
│   └── ToastService
├── Guards (Proteção de rotas)
│   └── AuthGuard
└── Layouts (Estrutura visual)
    ├── Header
    └── Sidebar
```

### Estado Reativo com RxJS Signals

A aplicação utiliza **RxJS Signals** (Angular 19) para gerenciar estado reativo:

```typescript
protected readonly usuario = signal<Usuario | null>(null);
protected readonly carregando = signal(false);
protected readonly denuncias = signal<Denuncia[]>([]);
```

### Comunicação com a API

Toda comunicação com o backend é feita via `HttpClient` através de serviços:

```
Component
  ↓ (chama)
Service (ex: DenunciaService)
  ↓ (faz requisição HTTP)
HttpClient
  ↓ (faz requisição)
Backend API (Eco.Api)
```

---

## 💻 Tecnologias

| Categoria | Tecnologia | Versão |
|-----------|-----------|--------|
| Framework | Angular | 19.1.0+ |
| Linguagem | TypeScript | 5.7+ |
| Gerenciador de Estado | RxJS Signals | 7.8.0+ |
| HTTP Client | HttpClientModule | 19+ |
| Mapas | Google Maps API | Latest |
| Node.js | Node Runtime | 18+ |
| npm | Package Manager | 10+ |
| Build Tool | Angular CLI | 19.1.5+ |
| Module Bundler | Webpack | Integrado no CLI |
| CSS | Vanilla CSS | — |

### Dependências Principais

```json
{
  "dependencies": {
    "@angular/animations": "^19.1.0",
    "@angular/common": "^19.1.0",
    "@angular/compiler": "^19.1.0",
    "@angular/core": "^19.1.0",
    "@angular/forms": "^19.1.0",
    "@angular/platform-browser": "^19.1.0",
    "@angular/platform-browser-dynamic": "^19.1.0",
    "@angular/router": "^19.1.0",
    "rxjs": "^7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "^0.15.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^19.1.5",
    "@angular/cli": "^19.1.5",
    "@angular/compiler-cli": "^19.1.0",
    "typescript": "~5.7.0"
  }
}
```

---

## 📁 Estrutura do Projeto

```
Eco.App/
├── README.md                          # Este arquivo (documentação do frontend)
├── angular.json                       # Configuração do Angular CLI
├── package.json                       # Dependências npm
├── package-lock.json                  # Lock file de dependências
├── tsconfig.json                      # Configuração TypeScript
├── tsconfig.app.json                  # Config TS para aplicação
├── tsconfig.spec.json                 # Config TS para testes
├── .gitignore                         # Arquivos ignorados pelo Git
│
├── src/
│   ├── main.ts                        # Bootstrap principal da aplicação
│   ├── index.html                     # Template HTML principal
│   ├── styles.css                     # Estilos globais
│   │
│   └── app/
│       ├── app.component.ts           # Componente raiz
│       ├── app.component.html         # Template raiz
│       ├── app.component.css          # Estilos raiz
│       ├── app.routes.ts              # Configuração de rotas
│       │
│       ├── pages/
│       │   ├── home/
│       │   │   ├── home.component.ts
│       │   │   ├── home.component.html
│       │   │   └── home.component.css
│       │   ├── login/
│       │   │   ├── login.component.ts
│       │   │   ├── login.component.html
│       │   │   └── login.component.css
│       │   ├── dashboard/
│       │   │   ├── dashboard.component.ts      # Dashboard admin
│       │   │   ├── dashboard.component.html
│       │   │   ├── dashboard.component.css
│       │   │   └── profile-menu/               # Menu de perfil
│       │   └── denuncias/
│       │       ├── denuncias.component.ts
│       │       ├── denuncias.component.html
│       │       └── denuncias.component.css
│       │
│       ├── shared/
│       │   ├── toast/
│       │   │   ├── toast.service.ts   # Serviço de notificações
│       │   │   ├── toast.component.ts
│       │   │   ├── toast.component.html
│       │   │   └── toast.component.css
│       │   └── components/            # Componentes reutilizáveis
│       │
│       ├── services/
│       │   ├── auth.service.ts        # Autenticação
│       │   ├── denuncia.service.ts    # Gerenciamento de denúncias
│       │   ├── toast.service.ts       # Notificações
│       │   └── http.service.ts        # Cliente HTTP customizado
│       │
│       ├── models/
│       │   ├── denuncia.model.ts      # Interface Denuncia
│       │   ├── usuario.model.ts       # Interface Usuario
│       │   └── auth.model.ts          # Interfaces de autenticação
│       │
│       ├── guards/
│       │   └── auth.guard.ts          # Guard de autenticação
│       │
│       └── layouts/
│           ├── header/
│           │   ├── header.component.ts
│           │   ├── header.component.html
│           │   └── header.component.css
│           └── sidebar/
│               ├── sidebar.component.ts
│               ├── sidebar.component.html
│               └── sidebar.component.css
│
├── public/                            # Assets estáticos
│   └── favicon.ico                    # Ícone da aplicação
│
├── dist/                              # Build de produção (após npm run build)
│   └── eco-app/
│       ├── index.html
│       ├── main.*.js
│       ├── styles.*.css
│       └── ...
│
└── node_modules/                      # Dependências instaladas (não commitado)
```

---

## 📌 Pré-requisitos

- [Node.js 18+](https://nodejs.org/) (LTS recomendado)
- [npm 10+](https://www.npmjs.com/)
- [Angular CLI 19.1.5+](https://angular.io/cli)
- Backend Eco.Api rodando em `http://localhost:5000`
- Chave da [Google Maps API](https://cloud.google.com/maps-platform)

### Verificar Versões Instaladas

```bash
node --version      # Deve ser v18.0.0 ou superior
npm --version       # Deve ser 10.0.0 ou superior
ng version          # Deve mostrar Angular 19+
```

---

## 🔧 Instalação

### 1. Clonar o Repositório (se não tiver feito)

```bash
git clone https://github.com/seu-usuario/eco.git
cd eco/Eco.App
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente (Opcional)

Crie um arquivo `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5000',
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY'
};
```

---

## 🚀 Executando

### Desenvolvimento

```bash
npm start
```

Ou utilize Angular CLI diretamente:

```bash
ng serve
```

Acesse: **`http://localhost:4200`**

A aplicação recarrega automaticamente quando você modifica os arquivos fonte.

### Com Proxy para a API

Se a API estiver rodando em `http://localhost:5000`, crie um arquivo `proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:5000",
    "secure": false,
    "changeOrigin": true
  }
}
```

E execute:

```bash
ng serve --proxy-config proxy.conf.json
```

---

## 📦 Componentes Principais

### Home Component

Página inicial com visualização de denúncias e mapa.

```typescript
// Funcionalidades:
- Listar denúncias públicas
- Exibir mapa de calor
- Botão para criar denúncia
- Botão para login
```

### Dashboard Component

Painel administrativo completo.

```typescript
// Funcionalidades:
- Visualizar estatísticas
- Listar todas as denúncias
- Filtrar e buscar
- Importar dados (CSV/PDF/Excel)
- Comparar dados com banco
- Gerenciar status
- Visualizar mapa
```

### Login Component

Autenticação de usuários.

```typescript
// Funcionalidades:
- Formulário de login
- Validação de e-mail e senha
- Armazenar JWT
- Redirecionar após login
```

### Profile Menu

Menu de perfil do usuário.

```typescript
// Funcionalidades:
- Exibir dados do usuário
- Logout
- Links para configurações
```

### Toast Service

Sistema de notificações.

```typescript
// Métodos:
- this.toast.show(mensagem, 'success')
- this.toast.show(mensagem, 'error')
- this.toast.show(mensagem, 'warning')
- this.toast.show(mensagem, 'info')
```

---

## 🔧 Serviços

### AuthService

Gerencia autenticação e autorização.

```typescript
export interface AuthService {
  login(email: string, senha: string): Observable<LoginResponse>;
  registrar(nome: string, email: string, senha: string): Observable<void>;
  logout(): void;
  getToken(): string | null;
  isAutenticado(): boolean;
  getUsuarioAtual(): Usuario | null;
}
```

### DenunciaService

Gerencia operações com denúncias.

```typescript
export interface DenunciaService {
  criarDenuncia(data: CreateDenunciaDto): Observable<DenunciaResponse>;
  listarDenuncias(filtros?: DenunciaFiltros): Observable<Denuncia[]>;
  obterDenuncia(id: number): Observable<Denuncia>;
  atualizarStatus(id: number, status: StatusDenuncia): Observable<void>;
  adicionarEvidencia(denunciaId: number, file: File): Observable<Evidencia>;
}
```

### ToastService

Sistema de notificações.

```typescript
export interface ToastService {
  show(mensagem: string, tipo: 'success' | 'error' | 'warning' | 'info'): void;
  showSuccess(mensagem: string): void;
  showError(mensagem: string): void;
  showWarning(mensagem: string): void;
  showInfo(mensagem: string): void;
}
```

---

## 🛡️ Segurança

### Autenticação com JWT

O token JWT é armazenado em `localStorage` e enviado em todas as requisições:

```typescript
// No header Authorization
Authorization: Bearer <jwt_token>
```

### AuthGuard

Protege rotas que requerem autenticação:

```typescript
// Exemplo de rota protegida:
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [AuthGuard]
}
```

### HTTPS em Produção

Sempre use HTTPS em produção para proteger o token JWT.

---

## 🛠️ Guias de Desenvolvimento

### Criar um Novo Componente

```bash
ng generate component pages/meu-componente
```

### Criar um Novo Serviço

```bash
ng generate service services/meu-servico
```

### Criar um Guard

```bash
ng generate guard guards/meu-guard
```

### Executar Testes

```bash
npm test
```

### Lint e Formatação

```bash
ng lint
```

---

## 🏗️ Build para Produção

### Build Otimizado

```bash
npm run build
```

Ou com Angular CLI:

```bash
ng build --configuration production
```

Saída: `dist/eco-app/`

### Build com SSR (Server-Side Rendering)

```bash
npm run build:ssr
```

### Servir Localmente (Para testar produção)

```bash
npm run serve
```

---

## 📡 Endpoints da API Utilizados

### Autenticação

```
POST   /api/auth/login           → Login
POST   /api/auth/registrar       → Registrar
```

### Denúncias

```
GET    /api/denuncias             → Listar todas
POST   /api/denuncias             → Criar nova
GET    /api/denuncias/{id}        → Obter por ID
PUT    /api/denuncias/{id}/status → Atualizar status
POST   /api/denuncias/{id}/evidencias → Adicionar evidência
```

### Dados Externos

```
GET    /api/denuncias/dados-externos → Listar dados
POST   /api/denuncias/dados-externos/importar-csv → Importar CSV
POST   /api/denuncias/dados-externos/comparar → Comparar arquivo
```

### Dashboard

```
GET    /api/denuncias/dashboard/completo → Resumo completo
GET    /api/denuncias/heatmap             → Dados do mapa
```

---

## 🚢 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório GitHub à Vercel
2. Configure a variável de ambiente `API_BASE_URL`
3. Build command: `npm run build`
4. Output directory: `dist/eco-app`

### Netlify

1. Conecte GitHub à Netlify
2. Build command: `npm run build`
3. Publish directory: `dist/eco-app`
4. Configure variáveis de ambiente

### Manual (Node/Express)

```bash
npm run build
# Servir a pasta dist/eco-app em um servidor web
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module '@angular/...'

```bash
npm install
```

### Port 4200 já está em uso

```bash
ng serve --port 4300
```

### Google Maps não carrega

Verifique se a chave da API está configurada e está ativa.

### API retorna 404

Verifique se:
- Backend está rodando em `http://localhost:5000`
- O endpoint existe e está correto
- CORS está configurado no backend

---

## 📚 Recursos Úteis

- [Documentação Angular](https://angular.io/docs)
- [RxJS Documentation](https://rxjs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Angular Best Practices](https://angular.io/guide/styleguide)

---

## 👥 Contribuindo

Para contribuir com o frontend:

1. Crie uma branch: `git checkout -b feature/minha-feature`
2. Commit suas mudanças: `git commit -m "feat: descrição da feature"`
3. Push para a branch: `git push origin feature/minha-feature`
4. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob licença [MIT](LICENSE).

---

<div align="center">
  <p><strong>ECO App — Interface para Denúncias de Violência</strong></p>
  <p>Desenvolvido com Angular 19 e TypeScript</p>
  <sub>© 2026 ECO. Todos os direitos reservados.</sub>
</div>

