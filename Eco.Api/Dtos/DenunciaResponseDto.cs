using Eco.Api.Enums;

namespace Eco.Api.Dtos;

public class DenunciaResponseDto
{
    public int Id { get; set; }

    public TipoDenuncia Tipo { get; set; }

    public string? Descricao { get; set; } = string.Empty;

    public string Codigo { get; set; } = string.Empty;
    
    public DateTime DataCriacao { get; set; }

    public StatusDenuncia Status { get; set; }

    public double? Latitude { get; set; }
    
    public double? Longitude { get; set; }
}