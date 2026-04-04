using System.Globalization;
using System.Net.Http.Json;
using Eco.Api.Dtos;
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
        if (!File.Exists(caminho))
            return new List<DadoPublico>();

        var linhas = File.ReadAllLines(caminho);
        if (linhas.Length == 0)
            return new List<DadoPublico>();

        var dados = new List<DadoPublico>();

        var cabecalho = linhas[0].Split(',');
        var indiceBairro = Array.FindIndex(cabecalho, c => c.Trim().Equals("Bairro", StringComparison.OrdinalIgnoreCase));
        var indiceTipo = Array.FindIndex(cabecalho, c => c.Trim().Equals("Tipo", StringComparison.OrdinalIgnoreCase));
        var indiceQuantidade = Array.FindIndex(cabecalho, c => c.Trim().Equals("Quantidade", StringComparison.OrdinalIgnoreCase));
        var indiceLatitude = Array.FindIndex(cabecalho, c => c.Trim().Equals("Latitude", StringComparison.OrdinalIgnoreCase));
        var indiceLongitude = Array.FindIndex(cabecalho, c => c.Trim().Equals("Longitude", StringComparison.OrdinalIgnoreCase));

        if (indiceBairro < 0 || indiceTipo < 0 || indiceQuantidade < 0)
            return new List<DadoPublico>();

        foreach(var linha in linhas.Skip(1))
        {
            if (string.IsNullOrWhiteSpace(linha))
                continue;

            var colunas = linha.Split(',');
            if (colunas.Length <= Math.Max(indiceQuantidade, Math.Max(indiceLatitude, indiceLongitude)))
                continue;

            if (!int.TryParse(colunas[indiceQuantidade], NumberStyles.Integer, CultureInfo.InvariantCulture, out var quantidade))
                continue;

            var latitude = 0d;
            var longitude = 0d;

            if (indiceLatitude >= 0)
                TryParseDoubleFlexivel(colunas[indiceLatitude], out latitude);

            if (indiceLongitude >= 0)
                TryParseDoubleFlexivel(colunas[indiceLongitude], out longitude);

            dados.Add(new DadoPublico
            {
                Bairro = colunas[indiceBairro],
                Tipo = colunas[indiceTipo],
                Quantidade = quantidade,
                Latitude = latitude,
                Longitude = longitude
            });
        }

        return dados;
    }

    public List<DadoPublicoExterno> LerCsvExterno(string caminho)
    {
        if (!File.Exists(caminho))
            return new List<DadoPublicoExterno>();

        var linhas = File.ReadAllLines(caminho);
        var dados = new List<DadoPublicoExterno>();
        var id = 1;

        foreach (var linha in linhas.Skip(1))
        {
            if (string.IsNullOrWhiteSpace(linha))
                continue;

            var colunas = linha.Split(',');
            if (colunas.Length < 6)
                continue;

            if (!int.TryParse(colunas[2], NumberStyles.Integer, CultureInfo.InvariantCulture, out var quantidade))
                continue;

            if (!TryParseDoubleFlexivel(colunas[3], out var latitude))
                continue;

            if (!TryParseDoubleFlexivel(colunas[4], out var longitude))
                continue;

            var dataRegistro = DateTime.TryParse(colunas[5], CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var data)
                ? data
                : DateTime.UtcNow;

            dados.Add(new DadoPublicoExterno
            {
                Id = id++,
                Bairro = colunas[0],
                Tipo = colunas[1],
                Quantidade = quantidade,
                Latitude = latitude,
                Longitude = longitude,
                DataRegistro = dataRegistro
            });
        }

        return dados;
    }

    public DadoPublicoExterno AdicionarCsvExterno(string caminho, CreateDadoPublicoExternoDto dto)
    {
        var diretorio = Path.GetDirectoryName(caminho);
        if (!string.IsNullOrWhiteSpace(diretorio) && !Directory.Exists(diretorio))
        {
            Directory.CreateDirectory(diretorio);
        }

        if (!File.Exists(caminho))
        {
            File.WriteAllText(caminho, "Bairro,Tipo,Quantidade,Latitude,Longitude,DataRegistro" + Environment.NewLine);
        }

        var agora = DateTime.UtcNow;
        var linha = string.Join(',',
            EscaparCsv(dto.Bairro),
            EscaparCsv(dto.Tipo),
            dto.Quantidade.ToString(CultureInfo.InvariantCulture),
            dto.Latitude.ToString(CultureInfo.InvariantCulture),
            dto.Longitude.ToString(CultureInfo.InvariantCulture),
            agora.ToString("O", CultureInfo.InvariantCulture)
        );

        File.AppendAllText(caminho, linha + Environment.NewLine);

        var todos = LerCsvExterno(caminho);
        var id = todos.Count > 0 ? todos.Max(x => x.Id) : 1;

        return new DadoPublicoExterno
        {
            Id = id,
            Bairro = dto.Bairro,
            Tipo = dto.Tipo,
            Quantidade = dto.Quantidade,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            DataRegistro = agora
        };
    }

    private static string EscaparCsv(string? valor)
    {
        var texto = (valor ?? string.Empty)
            .Replace('"', '\'')
            .Replace(',', ' ')
            .Replace('\r', ' ')
            .Replace('\n', ' ');

        return texto.Trim();
    }

    private static bool TryParseDoubleFlexivel(string valor, out double resultado)
    {
        if (double.TryParse(valor, NumberStyles.Float, CultureInfo.InvariantCulture, out resultado))
            return true;

        var normalizado = valor.Replace(',', '.');
        return double.TryParse(normalizado, NumberStyles.Float, CultureInfo.InvariantCulture, out resultado);
    }
}