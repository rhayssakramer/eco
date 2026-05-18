namespace Eco.Api.Dtos;

public class ImportacaoDadosExternosResultadoDto
{
    public int TotalRecebidos { get; set; }
    public int Importados { get; set; }
    public int Ignorados { get; set; }
    public int RegistrosTotais { get; set; }
    public string Fonte { get; set; } = string.Empty;
    public string Mensagem { get; set; } = string.Empty;
}