using Eco.Api.Enums;

namespace Eco.Api.Models;

public class Denuncia
{
    public int Id { get; set; }
    public bool Anonima { get; set; } = true;
    public int? UsuarioId { get; set; }
    public TipoDenuncia Tipo { get; set; }
    public string? Descricao { get; set; }
    public string? Codigo { get; set; }
    public DateTime DataCriacao { get; set; } = DateTime.Now;
    public StatusDenuncia Status { get; set; } = StatusDenuncia.Recebido;
    public double? Latitude { get; set; }
    public double? Longitude {get; set; }

}