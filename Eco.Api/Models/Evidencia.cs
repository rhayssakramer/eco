using Eco.Api.Models;

namespace Eco.Api.Models;

public class Evidencia
{
    public int Id { get; set; }
    public int DenunciaId { get; set; }
    public string? NomeArquivo { get; set; } = string.Empty;
    public string? Caminho { get; set; } = string.Empty;
    public DateTime DataUpload { get; set; } = DateTime.UtcNow;
}