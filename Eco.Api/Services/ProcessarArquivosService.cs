using ClosedXML.Excel;
using iTextSharp.text.pdf;
using iTextSharp.text.pdf.parser;
using System.Text.RegularExpressions;

public class ProcessarArquivosService
{
    public List<(string bairro, string tipo, int quantidade)> LerExcel(Stream stream)
    {
        var dados = new List<(string, string, int)>();
        
        try
        {
            using (var workbook = new XLWorkbook(stream))
            {
                var worksheet = workbook.Worksheets.First();
                
                foreach (var row in worksheet.RangeUsed().RowsUsed().Skip(1))
                {
                    var bairro = row.Cell(1).Value.ToString()?.Trim();
                    var tipo = row.Cell(2).Value.ToString()?.Trim();
                    var quantidade = row.Cell(3).Value.ToString()?.Trim();

                    if (!string.IsNullOrWhiteSpace(bairro) && 
                        !string.IsNullOrWhiteSpace(tipo) && 
                        int.TryParse(quantidade, out var qty))
                    {
                        dados.Add((bairro, tipo, qty));
                    }
                }
            }
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Erro ao ler arquivo Excel: " + ex.Message);
        }

        return dados;
    }

    public List<(string bairro, string tipo, int quantidade)> LerPdf(Stream stream)
    {
        var dados = new List<(string, string, int)>();
        var padraoLinha = new Regex(@"([A-Z\s]+)\s+([A-Z\s/\-]+)\s+(\d+)", RegexOptions.IgnoreCase);

        try
        {
            using (var pdf = new PdfReader(stream))
            {
                for (int pagina = 1; pagina <= pdf.NumberOfPages; pagina++)
                {
                    var text = PdfTextExtractor.GetTextFromPage(pdf, pagina);
                    var linhas = text.Split('\n');

                    foreach (var linha in linhas)
                    {
                        var match = padraoLinha.Match(linha);
                        if (match.Success && match.Groups.Count >= 4)
                        {
                            var bairro = match.Groups[1].Value.Trim();
                            var tipo = match.Groups[2].Value.Trim();
                            
                            if (int.TryParse(match.Groups[3].Value, out var quantidade))
                            {
                                dados.Add((bairro, tipo, quantidade));
                            }
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Erro ao ler arquivo PDF: " + ex.Message);
        }

        return dados;
    }
}
