namespace Eco.Api.Dtos;

public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
}

public class CadastroDto
{
    public string NomeCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
    public IFormFile? FotoPerfil { get; set; }
}

public class UsuarioResponseDto
{
    public int Id { get; set; }
    public string NomeCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FotoPerfil { get; set; }
    public DateTime? DataNascimento { get; set; }
    public string? Cpf { get; set; }
    public string? Rg { get; set; }
    public string? Cep { get; set; }
    public string? Logradouro { get; set; }
    public string? Numero { get; set; }
    public string? Complemento { get; set; }
    public string? Bairro { get; set; }
    public string? Cidade { get; set; }
    public string? Estado { get; set; }
    public bool IsAdmin { get; set; }
    public string Token { get; set; } = string.Empty;
}

public class AtualizarPerfilDto
{
    public string NomeCompleto { get; set; } = string.Empty;
    public DateTime? DataNascimento { get; set; }
    public string? Cpf { get; set; }
    public string? Rg { get; set; }
    public string? Cep { get; set; }
    public string? Logradouro { get; set; }
    public string? Numero { get; set; }
    public string? Complemento { get; set; }
    public string? Bairro { get; set; }
    public string? Cidade { get; set; }
    public string? Estado { get; set; }
    public string? NovaSenha { get; set; }
    public IFormFile? FotoPerfil { get; set; }
}
