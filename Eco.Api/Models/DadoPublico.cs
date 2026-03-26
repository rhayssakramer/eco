namespace Eco.Api.Models;

public class DadoPublico
{
    public string? Bairro { get; set; } = string.Empty;
    public string? Tipo { get; set; } = string.Empty;
    public int Quantidade { get; set; }
    public double Latitude { get; set;}
    public double Longitude { get; set; }
}