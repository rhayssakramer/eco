# 🌿 Projeto: ECO

### A voz que não pode ser ignorada. 💜

> ECO é uma aplicação web de denúncia anônima com botão de emergência, desenvolvida com .NET e Angular, com foco em segurança, anonimato e impacto social.

### Estrutura do diretório:
```
/Models
/Enums
/Data
/Controllers
```

## 🔐 Usuário administrador por variável de ambiente

Para maior segurança, configure o admin por variáveis de ambiente (em vez de salvar senha no repositório):

- `ECO_ADMIN_NOME`
- `ECO_ADMIN_EMAIL`
- `ECO_ADMIN_SENHA`

Exemplo no PowerShell (sessão atual):

```powershell
$env:ECO_ADMIN_NOME="Administradora ECO"
$env:ECO_ADMIN_EMAIL="admin@eco.local"
$env:ECO_ADMIN_SENHA="Admin@123456"
```

Ao iniciar a API, se o usuário com esse e-mail ainda não existir, ele é criado automaticamente.