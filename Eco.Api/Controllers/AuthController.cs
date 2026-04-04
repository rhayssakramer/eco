using Eco.Api.Data;
using Eco.Api.Dtos;
using Eco.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace Eco.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<ActionResult<UsuarioResponseDto>> Login(LoginDto dto)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());

        if (usuario == null)
            return Unauthorized("E-mail ou senha inválidos.");

        if (!VerificarSenha(dto.Senha, usuario.SenhaHash))
            return Unauthorized("E-mail ou senha inválidos.");

        var token = GerarToken(usuario);

        return Ok(new UsuarioResponseDto
        {
            Id = usuario.Id,
            NomeCompleto = usuario.NomeCompleto,
            Email = usuario.Email,
            FotoPerfil = usuario.FotoPerfil,
            DataNascimento = usuario.DataNascimento,
            Cpf = usuario.Cpf,
            Rg = usuario.Rg,
            Cep = usuario.Cep,
            Logradouro = usuario.Logradouro,
            Numero = usuario.Numero,
            Complemento = usuario.Complemento,
            Bairro = usuario.Bairro,
            Cidade = usuario.Cidade,
            Estado = usuario.Estado,
            IsAdmin = EhAdmin(usuario.Email),
            Token = token
        });
    }

    [HttpPost("cadastro")]
    public async Task<ActionResult<UsuarioResponseDto>> Cadastro([FromForm] CadastroDto dto)
    {
        // Verificar se o e-mail já existe
        if (await _context.Usuarios.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower()))
            return BadRequest("E-mail já cadastrado.");

        // Processar foto de perfil
        string? caminhoFoto = null;
        if (dto.FotoPerfil != null)
        {
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            var nomeArquivo = $"{Guid.NewGuid()}{Path.GetExtension(dto.FotoPerfil.FileName)}";
            var caminhoCompleto = Path.Combine(uploadsPath, nomeArquivo);

            using (var stream = new FileStream(caminhoCompleto, FileMode.Create))
            {
                await dto.FotoPerfil.CopyToAsync(stream);
            }

            caminhoFoto = $"/uploads/{nomeArquivo}";
        }

        var usuario = new Usuario
        {
            NomeCompleto = dto.NomeCompleto,
            Email = dto.Email,
            SenhaHash = HashSenha(dto.Senha),
            FotoPerfil = caminhoFoto,
            DataCriacao = DateTime.UtcNow
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var token = GerarToken(usuario);

        return Ok(new UsuarioResponseDto
        {
            Id = usuario.Id,
            NomeCompleto = usuario.NomeCompleto,
            Email = usuario.Email,
            FotoPerfil = usuario.FotoPerfil,
            DataNascimento = usuario.DataNascimento,
            Cpf = usuario.Cpf,
            Rg = usuario.Rg,
            Cep = usuario.Cep,
            Logradouro = usuario.Logradouro,
            Numero = usuario.Numero,
            Complemento = usuario.Complemento,
            Bairro = usuario.Bairro,
            Cidade = usuario.Cidade,
            Estado = usuario.Estado,
            IsAdmin = false,
            Token = token
        });
    }

    [HttpGet("perfil/{id:int}")]
    public async Task<ActionResult<UsuarioResponseDto>> ObterPerfil(int id)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (usuario == null)
            return NotFound("Usuária não encontrada.");

        var token = GerarToken(usuario);

        return Ok(new UsuarioResponseDto
        {
            Id = usuario.Id,
            NomeCompleto = usuario.NomeCompleto,
            Email = usuario.Email,
            FotoPerfil = usuario.FotoPerfil,
            DataNascimento = usuario.DataNascimento,
            Cpf = usuario.Cpf,
            Rg = usuario.Rg,
            Cep = usuario.Cep,
            Logradouro = usuario.Logradouro,
            Numero = usuario.Numero,
            Complemento = usuario.Complemento,
            Bairro = usuario.Bairro,
            Cidade = usuario.Cidade,
            Estado = usuario.Estado,
            IsAdmin = EhAdmin(usuario.Email),
            Token = token
        });
    }

    [HttpPut("perfil/{id:int}")]
    public async Task<ActionResult<UsuarioResponseDto>> AtualizarPerfil(int id, [FromForm] AtualizarPerfilDto dto)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (usuario == null)
            return NotFound("Usuária não encontrada.");

        usuario.NomeCompleto = string.IsNullOrWhiteSpace(dto.NomeCompleto)
            ? usuario.NomeCompleto
            : dto.NomeCompleto.Trim();
        usuario.DataNascimento = dto.DataNascimento;
        usuario.Cpf = dto.Cpf?.Trim();
        usuario.Rg = dto.Rg?.Trim();
        usuario.Cep = dto.Cep?.Trim();
        usuario.Logradouro = dto.Logradouro?.Trim();
        usuario.Numero = dto.Numero?.Trim();
        usuario.Complemento = dto.Complemento?.Trim();
        usuario.Bairro = dto.Bairro?.Trim();
        usuario.Cidade = dto.Cidade?.Trim();
        usuario.Estado = dto.Estado?.Trim();

        if (!string.IsNullOrWhiteSpace(dto.NovaSenha))
            usuario.SenhaHash = HashSenha(dto.NovaSenha.Trim());

        if (dto.FotoPerfil != null)
        {
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            if (!Directory.Exists(uploadsPath))
                Directory.CreateDirectory(uploadsPath);

            var nomeArquivo = $"{Guid.NewGuid()}{Path.GetExtension(dto.FotoPerfil.FileName)}";
            var caminhoCompleto = Path.Combine(uploadsPath, nomeArquivo);

            using (var stream = new FileStream(caminhoCompleto, FileMode.Create))
            {
                await dto.FotoPerfil.CopyToAsync(stream);
            }

            usuario.FotoPerfil = $"/uploads/{nomeArquivo}";
        }

        await _context.SaveChangesAsync();

        var token = GerarToken(usuario);

        return Ok(new UsuarioResponseDto
        {
            Id = usuario.Id,
            NomeCompleto = usuario.NomeCompleto,
            Email = usuario.Email,
            FotoPerfil = usuario.FotoPerfil,
            DataNascimento = usuario.DataNascimento,
            Cpf = usuario.Cpf,
            Rg = usuario.Rg,
            Cep = usuario.Cep,
            Logradouro = usuario.Logradouro,
            Numero = usuario.Numero,
            Complemento = usuario.Complemento,
            Bairro = usuario.Bairro,
            Cidade = usuario.Cidade,
            Estado = usuario.Estado,
            IsAdmin = EhAdmin(usuario.Email),
            Token = token
        });
    }

    private bool EhAdmin(string email)
    {
        var adminEmail = _configuration["AdminUser:Email"]
            ?? Environment.GetEnvironmentVariable("ECO_ADMIN_EMAIL");

        if (string.IsNullOrWhiteSpace(adminEmail))
        {
            return false;
        }

        return string.Equals(email?.Trim(), adminEmail.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    private string HashSenha(string senha)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(senha);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    private bool VerificarSenha(string senha, string senhaHash)
    {
        return HashSenha(senha) == senhaHash;
    }

    private string GerarToken(Usuario usuario)
    {
        // Por enquanto, um token simples. Em produção, use JWT
        return Convert.ToBase64String(Encoding.UTF8.GetBytes($"{usuario.Id}:{usuario.Email}:{Guid.NewGuid()}"));
    }
}
