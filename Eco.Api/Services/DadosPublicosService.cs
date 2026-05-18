using System.Globalization;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Eco.Api.Dtos;
using Eco.Api.Models;

public class DadosPublicosService
{
    private static readonly string[] HeadersBairro = ["bairro", "municipio", "município", "cidade", "localidade", "nome"];
    private static readonly string[] HeadersTipo = ["tipo", "categoria", "natureza", "indicador", "crime", "descricao", "descrição"];
    private static readonly string[] HeadersQuantidade = ["quantidade", "qtd", "total", "valor", "casos", "ocorrencias", "ocorrências"];
    private static readonly string[] HeadersLatitude = ["latitude", "lat"];
    private static readonly string[] HeadersLongitude = ["longitude", "lon", "lng", "long"];
    private static readonly string[] HeadersData = ["dataregistro", "data_registro", "data", "competencia", "competência", "mes", "mês", "referencia", "referência"];
    private static readonly string[] HeadersFonte = ["fonte", "origem", "source"];

    private readonly HttpClient _http;

    public DadosPublicosService(HttpClient http)
    {
        _http = http;
    }

    public List<DadoPublico> LerCsv(string caminho)
    {
        if (!File.Exists(caminho))
            return new List<DadoPublico>();

        var linhas = File.ReadAllLines(caminho);
        if (linhas.Length == 0)
            return new List<DadoPublico>();

        var dados = new List<DadoPublico>();

        var cabecalho = ParseCsvLine(linhas[0]);
        var indiceBairro = FindHeaderIndex(cabecalho, HeadersBairro);
        var indiceTipo = FindHeaderIndex(cabecalho, HeadersTipo);
        var indiceQuantidade = FindHeaderIndex(cabecalho, HeadersQuantidade);
        var indiceLatitude = FindHeaderIndex(cabecalho, HeadersLatitude);
        var indiceLongitude = FindHeaderIndex(cabecalho, HeadersLongitude);

        if (indiceBairro < 0 || indiceTipo < 0 || indiceQuantidade < 0)
            return new List<DadoPublico>();

        foreach (var linha in linhas.Skip(1))
        {
            if (string.IsNullOrWhiteSpace(linha))
                continue;

            var colunas = ParseCsvLine(linha);
            if (!TryGetInt(colunas, indiceQuantidade, out var quantidade))
                continue;

            TryGetDouble(colunas, indiceLatitude, out var latitude);
            TryGetDouble(colunas, indiceLongitude, out var longitude);

            dados.Add(new DadoPublico
            {
                Bairro = GetValue(colunas, indiceBairro),
                Tipo = GetValue(colunas, indiceTipo),
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

        using var stream = File.OpenRead(caminho);
        return LerCsvExterno(stream);
    }

    public List<DadoPublicoExterno> LerCsvExterno(Stream stream, string? fontePadrao = null)
    {
        using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: true);
        var conteudo = reader.ReadToEnd();
        return ParseCsvExterno(conteudo, fontePadrao);
    }

    public DadoPublicoExterno AdicionarCsvExterno(string caminho, CreateDadoPublicoExternoDto dto)
    {
        var dado = new DadoPublicoExterno
        {
            Bairro = dto.Bairro.Trim(),
            Tipo = dto.Tipo.Trim(),
            Fonte = string.IsNullOrWhiteSpace(dto.Fonte) ? "Manual" : dto.Fonte.Trim(),
            Quantidade = dto.Quantidade,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            DataRegistro = DateTime.UtcNow
        };

        var todos = PersistirDadosExternos(caminho, [dado], substituir: false);
        return todos.Last();
    }

    public async Task<ImportacaoDadosExternosResultadoDto> ImportarCsvExternoAsync(
        string caminho,
        Stream stream,
        string? fontePadrao,
        bool substituir = false)
    {
        var importados = LerCsvExterno(stream, fontePadrao);
        var persistidos = PersistirDadosExternos(caminho, importados, substituir);

        return CriarResultadoImportacao(importados, persistidos.Count, fontePadrao);
    }

    public async Task<ImportacaoDadosExternosResultadoDto> ImportarDadosExternosPorUrlAsync(
        string caminho,
        string url,
        string? fontePadrao,
        bool substituir = false)
    {
        using var resposta = await _http.GetAsync(url);
        resposta.EnsureSuccessStatusCode();

        var conteudo = await resposta.Content.ReadAsStringAsync();
        var contentType = resposta.Content.Headers.ContentType?.MediaType ?? string.Empty;

        var registros = contentType.Contains("json", StringComparison.OrdinalIgnoreCase)
            || url.EndsWith(".json", StringComparison.OrdinalIgnoreCase)
            ? ParseJsonExterno(conteudo, fontePadrao)
            : ParseCsvExterno(conteudo, fontePadrao);

        var persistidos = PersistirDadosExternos(caminho, registros, substituir);

        return CriarResultadoImportacao(registros, persistidos.Count, fontePadrao);
    }





    private static ImportacaoDadosExternosResultadoDto CriarResultadoImportacao(
        IReadOnlyCollection<DadoPublicoExterno> registros,
        int registrosTotais,
        string? fontePadrao)
    {
        var fonte = string.IsNullOrWhiteSpace(fontePadrao) ? "Arquivo/URL" : fontePadrao.Trim();

        return new ImportacaoDadosExternosResultadoDto
        {
            TotalRecebidos = registros.Count,
            Importados = registros.Count,
            Ignorados = 0,
            RegistrosTotais = registrosTotais,
            Fonte = fonte,
            Mensagem = registros.Count == 0
                ? "Nenhum registro válido foi encontrado para importação."
                : $"{registros.Count} registros importados da fonte {fonte}."
        };
    }

    private List<DadoPublicoExterno> PersistirDadosExternos(string caminho, IEnumerable<DadoPublicoExterno> novos, bool substituir)
    {
        var diretorio = Path.GetDirectoryName(caminho);
        if (!string.IsNullOrWhiteSpace(diretorio) && !Directory.Exists(diretorio))
        {
            Directory.CreateDirectory(diretorio);
        }

        var consolidados = (substituir ? [] : LerCsvExterno(caminho))
            .Concat(novos)
            .Where(x => !string.IsNullOrWhiteSpace(x.Bairro) && !string.IsNullOrWhiteSpace(x.Tipo) && x.Quantidade > 0)
            .GroupBy(x => new
            {
                Bairro = NormalizeKey(x.Bairro),
                Tipo = NormalizeKey(x.Tipo),
                Fonte = NormalizeKey(x.Fonte),
                x.Quantidade,
                Latitude = Math.Round(x.Latitude, 6),
                Longitude = Math.Round(x.Longitude, 6),
                Data = x.DataRegistro.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture)
            })
            .Select(g => g.First())
            .OrderByDescending(x => x.DataRegistro)
            .ToList();

        for (var indice = 0; indice < consolidados.Count; indice++)
        {
            consolidados[indice].Id = indice + 1;
        }

        using var writer = new StreamWriter(caminho, false, Encoding.UTF8);
        writer.WriteLine("Bairro,Tipo,Fonte,Quantidade,Latitude,Longitude,DataRegistro");
        foreach (var item in consolidados)
        {
            var linha = string.Join(',',
                EscapeCsv(item.Bairro),
                EscapeCsv(item.Tipo),
                EscapeCsv(item.Fonte),
                item.Quantidade.ToString(CultureInfo.InvariantCulture),
                item.Latitude.ToString(CultureInfo.InvariantCulture),
                item.Longitude.ToString(CultureInfo.InvariantCulture),
                item.DataRegistro.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture)
            );

            writer.WriteLine(linha);
        }

        return consolidados;
    }

    private List<DadoPublicoExterno> ParseCsvExterno(string conteudo, string? fontePadrao)
    {
        if (string.IsNullOrWhiteSpace(conteudo))
            return [];

        var linhas = conteudo
            .Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries)
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .ToList();

        if (linhas.Count == 0)
            return [];

        var cabecalho = ParseCsvLine(linhas[0]);
        var indiceBairro = FindHeaderIndex(cabecalho, HeadersBairro);
        var indiceTipo = FindHeaderIndex(cabecalho, HeadersTipo);
        var indiceQuantidade = FindHeaderIndex(cabecalho, HeadersQuantidade);
        var indiceLatitude = FindHeaderIndex(cabecalho, HeadersLatitude);
        var indiceLongitude = FindHeaderIndex(cabecalho, HeadersLongitude);
        var indiceData = FindHeaderIndex(cabecalho, HeadersData);
        var indiceFonte = FindHeaderIndex(cabecalho, HeadersFonte);

        if (indiceBairro < 0 || indiceTipo < 0 || indiceQuantidade < 0 || indiceLatitude < 0 || indiceLongitude < 0)
        {
            return [];
        }

        var dados = new List<DadoPublicoExterno>();
        foreach (var linha in linhas.Skip(1))
        {
            var colunas = ParseCsvLine(linha);

            if (!TryGetInt(colunas, indiceQuantidade, out var quantidade)
                || !TryGetDouble(colunas, indiceLatitude, out var latitude)
                || !TryGetDouble(colunas, indiceLongitude, out var longitude))
            {
                continue;
            }

            var dataRegistro = TryGetDate(colunas, indiceData, out var data)
                ? data
                : DateTime.UtcNow;

            dados.Add(new DadoPublicoExterno
            {
                Bairro = GetValue(colunas, indiceBairro),
                Tipo = GetValue(colunas, indiceTipo),
                Fonte = ResolveFonte(colunas, indiceFonte, fontePadrao),
                Quantidade = quantidade,
                Latitude = latitude,
                Longitude = longitude,
                DataRegistro = dataRegistro
            });
        }

        return dados;
    }

    private List<DadoPublicoExterno> ParseJsonExterno(string conteudo, string? fontePadrao)
    {
        if (string.IsNullOrWhiteSpace(conteudo))
            return [];

        using var document = JsonDocument.Parse(conteudo);
        var elementos = FlattenJsonCollection(document.RootElement).ToList();
        var dados = new List<DadoPublicoExterno>();

        foreach (var item in elementos)
        {
            var bairro = GetJsonString(item, HeadersBairro);
            var tipo = GetJsonString(item, HeadersTipo);
            var fonte = GetJsonString(item, HeadersFonte);
            var quantidade = GetJsonInt(item, HeadersQuantidade) ?? 1;
            var latitude = GetJsonDouble(item, HeadersLatitude);
            var longitude = GetJsonDouble(item, HeadersLongitude);
            var data = GetJsonDate(item, HeadersData) ?? DateTime.UtcNow;

            if (string.IsNullOrWhiteSpace(bairro) || string.IsNullOrWhiteSpace(tipo) || latitude is null || longitude is null)
            {
                continue;
            }

            dados.Add(new DadoPublicoExterno
            {
                Bairro = bairro,
                Tipo = tipo,
                Fonte = string.IsNullOrWhiteSpace(fonte) ? (fontePadrao?.Trim() ?? "API") : fonte,
                Quantidade = quantidade,
                Latitude = latitude.Value,
                Longitude = longitude.Value,
                DataRegistro = data
            });
        }

        return dados;
    }

    private static IEnumerable<JsonElement> FlattenJsonCollection(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
            {
                yield return item;
            }

            yield break;
        }

        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in element.EnumerateObject())
            {
                if (property.Value.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in property.Value.EnumerateArray())
                    {
                        yield return item;
                    }

                    yield break;
                }
            }

            yield return element;
        }
    }

    private static string? GetJsonString(JsonElement element, string[] candidatos)
    {
        foreach (var candidato in candidatos)
        {
            if (TryGetJsonProperty(element, candidato, out var property) && property.ValueKind != JsonValueKind.Null)
            {
                return property.ToString();
            }
        }

        return null;
    }

    private static int? GetJsonInt(JsonElement element, string[] candidatos)
    {
        foreach (var candidato in candidatos)
        {
            if (TryGetJsonProperty(element, candidato, out var property))
            {
                if (property.ValueKind == JsonValueKind.Number && property.TryGetInt32(out var valorNumero))
                    return valorNumero;

                if (property.ValueKind == JsonValueKind.String && int.TryParse(property.GetString(), out var valorTexto))
                    return valorTexto;
            }
        }

        return null;
    }

    private static double? GetJsonDouble(JsonElement element, string[] candidatos)
    {
        foreach (var candidato in candidatos)
        {
            if (TryGetJsonProperty(element, candidato, out var property))
            {
                if (property.ValueKind == JsonValueKind.Number && property.TryGetDouble(out var valorNumero))
                    return valorNumero;

                if (property.ValueKind == JsonValueKind.String && TryParseDoubleFlexivel(property.GetString() ?? string.Empty, out var valorTexto))
                    return valorTexto;
            }
        }

        return null;
    }

    private static DateTime? GetJsonDate(JsonElement element, string[] candidatos)
    {
        foreach (var candidato in candidatos)
        {
            if (TryGetJsonProperty(element, candidato, out var property))
            {
                if (property.ValueKind == JsonValueKind.String && DateTime.TryParse(property.GetString(), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var data))
                    return data;
            }
        }

        return null;
    }

    private static bool TryGetJsonProperty(JsonElement element, string nomeNormalizado, out JsonElement value)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            value = default;
            return false;
        }

        foreach (var property in element.EnumerateObject())
        {
            if (NormalizeKey(property.Name) == NormalizeKey(nomeNormalizado))
            {
                value = property.Value;
                return true;
            }
        }

        value = default;
        return false;
    }

    private static List<string> ParseCsvLine(string linha)
    {
        var resultado = new List<string>();
        var atual = new StringBuilder();
        var emAspas = false;

        foreach (var caractere in linha)
        {
            if (caractere == '"')
            {
                emAspas = !emAspas;
                continue;
            }

            if (caractere == ',' && !emAspas)
            {
                resultado.Add(atual.ToString().Trim());
                atual.Clear();
                continue;
            }

            atual.Append(caractere);
        }

        resultado.Add(atual.ToString().Trim());
        return resultado;
    }

    private static int FindHeaderIndex(IReadOnlyList<string> headers, string[] aliases)
    {
        for (var indice = 0; indice < headers.Count; indice++)
        {
            var header = NormalizeKey(headers[indice]);
            if (aliases.Any(alias => NormalizeKey(alias) == header))
                return indice;
        }

        return -1;
    }

    private static string GetValue(IReadOnlyList<string> colunas, int indice)
        => indice >= 0 && indice < colunas.Count ? colunas[indice].Trim() : string.Empty;

    private static bool TryGetInt(IReadOnlyList<string> colunas, int indice, out int valor)
        => int.TryParse(GetValue(colunas, indice), NumberStyles.Integer, CultureInfo.InvariantCulture, out valor);

    private static bool TryGetDouble(IReadOnlyList<string> colunas, int indice, out double valor)
        => TryParseDoubleFlexivel(GetValue(colunas, indice), out valor);

    private static bool TryGetDate(IReadOnlyList<string> colunas, int indice, out DateTime data)
        => DateTime.TryParse(GetValue(colunas, indice), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out data);

    private static string ResolveFonte(IReadOnlyList<string> colunas, int indiceFonte, string? fontePadrao)
    {
        var fonte = GetValue(colunas, indiceFonte);
        return string.IsNullOrWhiteSpace(fonte)
            ? (string.IsNullOrWhiteSpace(fontePadrao) ? "CSV" : fontePadrao.Trim())
            : fonte;
    }

    private static string EscapeCsv(string? valor)
    {
        var texto = (valor ?? string.Empty).Trim();
        if (texto.Contains(',') || texto.Contains('"') || texto.Contains('\n'))
        {
            texto = texto.Replace("\"", "\"\"");
            return $"\"{texto}\"";
        }

        return texto;
    }

    private static string NormalizeKey(string? valor)
        => (valor ?? string.Empty)
            .Trim()
            .ToLowerInvariant()
            .Normalize(NormalizationForm.FormD)
            .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            .Aggregate(new StringBuilder(), (builder, c) => builder.Append(c))
            .ToString();

    private static bool TryParseDoubleFlexivel(string valor, out double resultado)
    {
        if (double.TryParse(valor, NumberStyles.Float, CultureInfo.InvariantCulture, out resultado))
            return true;

        var normalizado = valor.Replace(',', '.');
        return double.TryParse(normalizado, NumberStyles.Float, CultureInfo.InvariantCulture, out resultado);
    }

    private List<DadoPublico> ConsolidarDadosPublicos(IEnumerable<DadoPublico> dados)
    {
        return dados
            .Where(d => !string.IsNullOrWhiteSpace(d.Bairro)
                && !string.IsNullOrWhiteSpace(d.Tipo)
                && d.Quantidade > 0
                && d.Latitude is >= -90 and <= 90
                && d.Longitude is >= -180 and <= 180)
            .GroupBy(d => new
            {
                Bairro = NormalizeKey(d.Bairro),
                Tipo = NormalizeKey(d.Tipo),
                Latitude = Math.Round(d.Latitude, 4),
                Longitude = Math.Round(d.Longitude, 4)
            })
            .Select(g => new DadoPublico
            {
                Bairro = g.First().Bairro,
                Tipo = g.First().Tipo,
                Latitude = g.First().Latitude,
                Longitude = g.First().Longitude,
                Quantidade = g.Sum(x => x.Quantidade)
            })
            .OrderByDescending(d => d.Quantidade)
            .ToList();
    }

    private static string? TryGetPropertyAsString(JsonElement element, string propertyName)
    {
        if (element.ValueKind != JsonValueKind.Object)
            return null;

        if (!element.TryGetProperty(propertyName, out var value))
            return null;

        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString(),
            JsonValueKind.Number => value.ToString(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            _ => null
        };
    }


}