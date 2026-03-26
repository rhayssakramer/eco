using System.Globalization;
using System.Net.Http.Json;
using Eco.Api.Models;

public class DadosPublicosService
{
    private readonly HttpClient _http;
    public DadosPublicosService(HttpClient http)
    {
        _http = http;
    }

    public async Task<List<DadoPublico>> ObterDadosAsync()
    {
        var url = "https://api.exemplo.gov/dados-violencia";

        var dados = await _http.GetFromJsonAsync<List<DadoPublico>>(url);

        return dados ?? new List<DadoPublico>();
    }

    public List<DadoPublico> LerCsv(string caminho)
    {
        var linhas = File.ReadAllLines(caminho);
        var dados = new List<DadoPublico>();

        foreach(var linha in linhas.Skip(1))
        {
            var colunas = linha.Split(',');

            dados.Add(new DadoPublico
            {
                Bairro = colunas[0],
                Tipo = colunas [1],
                Quantidade = int.Parse(colunas[2])
            });
        }

        return dados;
    }
}