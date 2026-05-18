namespace Eco.Api.Dtos;

public class ImportarDadosExternosUrlDto
{
    public string Url { get; set; } = string.Empty;
    public string Fonte { get; set; } = string.Empty;
    public bool Substituir { get; set; }
}