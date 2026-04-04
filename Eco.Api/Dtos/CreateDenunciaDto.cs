using Eco.Api.Enums;
using System.ComponentModel.DataAnnotations;

namespace Eco.Api.Dtos;

public class CreateDenunciaDto
{
    public bool Anonima { get; set; } = true;

    public int? UsuarioId { get; set; }

    [Required]
    public TipoDenuncia Tipo { get; set; }

    [Required]
    [MinLength(10)]
    [MaxLength(1000)]
    public string Descricao { get; set; } = string.Empty;

    [Required]
    public double? Latitude { get; set; }

    [Required]
    public double? Longitude { get; set; }
}