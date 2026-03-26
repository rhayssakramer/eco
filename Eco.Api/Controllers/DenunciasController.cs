
using Eco.Api.Data;
using Eco.Api.Enums;
using Eco.Api.Models;
using Eco.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Eco.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DenunciasController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly DadosPublicosService _dadosService;
    public DenunciasController(AppDbContext context, DadosPublicosService dadosService)
    {
        _context = context;
        _dadosService = dadosService;
    }

    [HttpPost]
    public async Task<ActionResult<DenunciaResponseDto>> CriarDenuncia(CreateDenunciaDto dto)
    {

        var codigo = $"ECO-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

        var denuncia = new Denuncia
        {
            Tipo = dto.Tipo,
            Descricao = dto.Descricao,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            DataCriacao = DateTime.UtcNow,
            Status = StatusDenuncia.Recebido,
            Codigo = codigo
        };
            _context.Denuncias.Add(denuncia);
            await _context.SaveChangesAsync();

        var response = new DenunciaResponseDto
        {
            Id = denuncia.Id,
            Codigo = denuncia.Codigo,
            Tipo = denuncia.Tipo,
            Descricao = denuncia.Descricao,
            Latitude = denuncia.Latitude ?? 0,
            Longitude = denuncia.Longitude ?? 0,
            DataCriacao = denuncia.DataCriacao,
            Status = denuncia.Status
        };

        return CreatedAtAction(nameof(Listar), new { id = denuncia.Id }, response);
    }

    [HttpPost("{id}/evidencias")]
    public async Task<IActionResult> UploadEvidencia(int id, IFormFile file)
    {
        var denunciaExiste = await _context.Denuncias.AnyAsync(d => d.Id == id);

        if(!denunciaExiste)
            return NotFound("Denúncia não encontrada");
        
        if(file == null || file.Length == 0)
            return BadRequest("Arquivo inválido");

        var tiposPermitidos = new[]
        {
            "image/jpeg",
            "image/png",
            "video/mp4",
            "video/webm"
        };

        if(!tiposPermitidos.Contains(file.ContentType))
            return BadRequest("Tipo de arquivo não permitido");

        var extensoesPermitidas = new[]
        {
            ".jpg", ".jpeg", ".png",
            ".mp4", ".webm"
        };

        var extensao = Path.GetExtension(file.FileName).ToLower();

        if(!extensoesPermitidas.Contains(extensao))
            return BadRequest("Extensão não permitida");

        var tamanhoMaximoImagem = 5 * 1024 * 1024; //5MB
        var tamanhoMaximoVideo = 50 * 1024 * 1024; ///50MB

        if(file.ContentType.StartsWith("image/") && file.Length > tamanhoMaximoImagem)
            return BadRequest("Imagem muito grande (máx: 5MB)");

        if(file.ContentType.StartsWith("video/") && file.Length > tamanhoMaximoVideo)
            return BadRequest("Vídeo muito grande (máx: 50MB)");

        var pasta = Path.Combine(Directory.GetCurrentDirectory(), "uploads");

        if(!Directory.Exists(pasta))
        Directory.CreateDirectory(pasta);

        var nomeArquivo = Guid.NewGuid() + Path.GetExtension(file.FileName);
        var caminho = Path.Combine(pasta, nomeArquivo);

        using (var stream = new FileStream(caminho, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var evidencia = new Evidencia
        {
            DenunciaId = id,
            NomeArquivo = nomeArquivo,
            Caminho = caminho
        };

        _context.Evidencias.Add(evidencia);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "Upload realizado com sucesso",
            arquivo = nomeArquivo
        });
    }

    [HttpPost("panico")]
    public async Task<IActionResult> Panico(PanicoDto dto)
    {
        var denuncia = new Denuncia
        {
            Tipo = TipoDenuncia.Violencia,
            Descricao = dto.Descricao ?? "🚨 Emergência acionada via botão do pânico.",
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Status = StatusDenuncia.Emergencia,
            DataCriacao = DateTime.UtcNow,
            Codigo = $"ECO-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}"
        };

        _context.Denuncias.Add(denuncia);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "🚨 Alerta enviado com sucesso",
            codigo = denuncia.Codigo
        });
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        return Ok(await _context.Denuncias.ToListAsync());
    }

    [HttpGet("{codigo}")]
    public async Task<IActionResult> BuscarPorCodigo(string codigo)
    {
        var denuncia = await _context.Denuncias
            .FirstOrDefaultAsync(d => d.Codigo == codigo);

        if (denuncia == null)
            return NotFound("Denúncia não encontrada");

        var response = new DenunciaResponseDto
        {
            Id = denuncia.Id,
            Codigo = denuncia.Codigo,
            Tipo = denuncia.Tipo,
            Descricao = denuncia.Descricao,
            Latitude = denuncia.Latitude ?? 0,
            Longitude = denuncia.Longitude ?? 0,
            DataCriacao = denuncia.DataCriacao,
            Status = denuncia.Status
        };

        return Ok(response);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var total = await _context.Denuncias.CountAsync();

        var ultimaSemana = await _context.Denuncias
            .Where(d => d.DataCriacao >= DateTime.UtcNow.AddDays(-7))
            .CountAsync();

        var tipos = await _context.Denuncias
            .GroupBy(d => d.Tipo)
            .Select(g => new
            {
                tipo = g.Key.ToString(),
                quantidade = g.Count()
            })
            .ToListAsync();
        
        return Ok(new
        {
            totalDenuncias = total,
            ultimaSemana,
            tipos
        });
    }

    [HttpGet("dashboard-completo")]
    public async Task<IActionResult> DashboardCompleto()
    {
        var eco = await _context.Denuncias.CountAsync();

        var caminho = Path.Combine(
            Directory.GetCurrentDirectory(), 
            "DataSources", 
            "dados-violencia-pe.csv"
        );

        var dadosPublicos = _dadosService.LerCsv(caminho);
        var totalPublico = dadosPublicos.Sum(d => d.Quantidade);

        return Ok(new
        {
            eco,
            publico = totalPublico,
            diferenca = totalPublico - eco
        });
    }

    [HttpGet("dados-publicos")]
    public IActionResult DadosPublicos()
    {
        var caminho = Path.Combine(
            Directory.GetCurrentDirectory(),
            "DataSources",
            "dados-violencia-pe.csv"
        );

        var dados = _dadosService.LerCsv(caminho);

        return Ok(dados);
    }

    [HttpGet("heatmap")]
    public async Task<IActionResult> Heatmap()
    {
        var dados = await _context.Denuncias
            .Where(d => d.Latitude != null && d.Longitude != null)
            .Select(d => new
            {
                latitude = Math.Round(d.Latitude.Value, 2),
                longitude = Math.Round(d.Longitude.Value, 2)
            })
            .ToListAsync();

        return Ok(dados);
    }

    [HttpGet("{id}/evidencias")]
    public async Task<IActionResult> ListarEvidencias(int id)
    {
        var denunciaExiste = await _context.Denuncias.AnyAsync(d => d.Id == id);

    if(!denunciaExiste)
        return NotFound("Denúncia não encontrada");

    var evidencias = await _context.Evidencias
        .Where(e => e.DenunciaId == id)
        .Select(e => new
        {
            id = e.Id,
            nomeAruivo = e.NomeArquivo,
            url = $"/uploads/{e.NomeArquivo}"
        })
        .ToListAsync();

        return Ok(evidencias);
    }

    [HttpGet("dados-publicos-api")]
    public async Task<IActionResult> DadosPublicosApi()
    {
        var dados = await _dadosService.ObterDadosAsync();
        return Ok(dados);
    }

}