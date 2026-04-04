
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
        if (!dto.Anonima && dto.UsuarioId is null)
            return BadRequest("Para denúncia identificada, informe a usuária.");

        if (dto.UsuarioId is not null && !await _context.Usuarios.AnyAsync(u => u.Id == dto.UsuarioId))
            return BadRequest("Usuária informada não foi encontrada.");

        var codigo = $"ECO-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

        var denuncia = new Denuncia
        {
            Anonima = dto.Anonima,
            UsuarioId = dto.Anonima ? null : dto.UsuarioId,
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

        var usuario = denuncia.UsuarioId is null
            ? null
            : await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == denuncia.UsuarioId.Value);

        var response = new DenunciaResponseDto
        {
            Id = denuncia.Id,
            Anonima = denuncia.Anonima || denuncia.UsuarioId is null,
            UsuarioId = denuncia.UsuarioId,
            UsuarioNome = usuario?.NomeCompleto,
            UsuarioEmail = usuario?.Email,
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
        var denuncias = await _context.Denuncias
            .OrderByDescending(d => d.DataCriacao)
            .GroupJoin(
                _context.Usuarios,
                denuncia => denuncia.UsuarioId,
                usuario => usuario.Id,
                (denuncia, usuarios) => new { denuncia, usuario = usuarios.FirstOrDefault() }
            )
            .Select(x => new DenunciaResponseDto
            {
                Id = x.denuncia.Id,
                Anonima = x.denuncia.Anonima || x.denuncia.UsuarioId == null,
                UsuarioId = x.denuncia.UsuarioId,
                UsuarioNome = x.usuario != null ? x.usuario.NomeCompleto : null,
                UsuarioEmail = x.usuario != null ? x.usuario.Email : null,
                Codigo = x.denuncia.Codigo ?? string.Empty,
                Tipo = x.denuncia.Tipo,
                Descricao = x.denuncia.Descricao,
                Latitude = x.denuncia.Latitude,
                Longitude = x.denuncia.Longitude,
                DataCriacao = x.denuncia.DataCriacao,
                Status = x.denuncia.Status
            })
            .ToListAsync();

        return Ok(denuncias);
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
            Anonima = denuncia.Anonima || denuncia.UsuarioId is null,
            UsuarioId = denuncia.UsuarioId,
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

    [HttpGet("{id:int}/detalhes")]
    public async Task<IActionResult> BuscarDetalhes(int id)
    {
        var denuncia = await _context.Denuncias.FirstOrDefaultAsync(d => d.Id == id);
        if (denuncia == null)
            return NotFound("Denúncia não encontrada");

        Usuario? usuario = null;
        if (denuncia.UsuarioId is not null)
            usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == denuncia.UsuarioId.Value);

        var evidencias = await _context.Evidencias
            .Where(e => e.DenunciaId == id)
            .Select(e => new
            {
                id = e.Id,
                nomeArquivo = e.NomeArquivo,
                url = $"/uploads/{e.NomeArquivo}",
                tipo = ObterTipoMidia(e.NomeArquivo)
            })
            .ToListAsync();

        return Ok(new
        {
            id = denuncia.Id,
            anonima = denuncia.Anonima || denuncia.UsuarioId is null,
            usuarioId = denuncia.UsuarioId,
            usuarioNome = usuario?.NomeCompleto,
            usuarioEmail = usuario?.Email,
            codigo = denuncia.Codigo,
            tipo = denuncia.Tipo,
            descricao = denuncia.Descricao,
            latitude = denuncia.Latitude,
            longitude = denuncia.Longitude,
            dataCriacao = denuncia.DataCriacao,
            status = denuncia.Status,
            evidencias
        });
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

        var totalPublico = 0;
        if (System.IO.File.Exists(caminho))
        {
            var dadosPublicos = _dadosService.LerCsv(caminho);
            totalPublico = dadosPublicos.Sum(d => d.Quantidade);
        }

        var caminhoExternos = Path.Combine(
            Directory.GetCurrentDirectory(),
            "DataSources",
            "dados-violencia-externos.csv"
        );

        var totalExterno = 0;
        if (System.IO.File.Exists(caminhoExternos))
        {
            var dadosExternos = _dadosService.LerCsvExterno(caminhoExternos);
            totalExterno = dadosExternos.Sum(d => d.Quantidade);
        }

        return Ok(new
        {
            eco,
            publico = totalPublico + totalExterno,
            diferenca = (totalPublico + totalExterno) - eco
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

        var caminhoExternos = Path.Combine(
            Directory.GetCurrentDirectory(),
            "DataSources",
            "dados-violencia-externos.csv"
        );
        var dadosExternos = _dadosService.LerCsvExterno(caminhoExternos)
            .Select(d => new DadoPublico
            {
                Bairro = d.Bairro,
                Tipo = d.Tipo,
                Quantidade = d.Quantidade,
                Latitude = d.Latitude,
                Longitude = d.Longitude
            });

        return Ok(dados.Concat(dadosExternos));
    }

    [HttpGet("dados-externos")]
    public IActionResult DadosExternos()
    {
        var caminhoExternos = Path.Combine(
            Directory.GetCurrentDirectory(),
            "DataSources",
            "dados-violencia-externos.csv"
        );

        var dados = _dadosService.LerCsvExterno(caminhoExternos)
            .OrderByDescending(d => d.DataRegistro)
            .ToList();

        return Ok(dados);
    }

    [HttpPost("dados-externos")]
    public IActionResult CriarDadoExterno([FromBody] CreateDadoPublicoExternoDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Bairro))
            return BadRequest("Informe o bairro.");

        if (string.IsNullOrWhiteSpace(dto.Tipo))
            return BadRequest("Informe o tipo.");

        if (dto.Quantidade <= 0)
            return BadRequest("A quantidade deve ser maior que zero.");

        if (dto.Latitude is < -90 or > 90)
            return BadRequest("Latitude inválida.");

        if (dto.Longitude is < -180 or > 180)
            return BadRequest("Longitude inválida.");

        var caminhoExternos = Path.Combine(
            Directory.GetCurrentDirectory(),
            "DataSources",
            "dados-violencia-externos.csv"
        );

        var criado = _dadosService.AdicionarCsvExterno(caminhoExternos, dto);

        return Created(string.Empty, criado);
    }

    [HttpGet("heatmap")]
    public async Task<IActionResult> Heatmap()
    {
        var dadosInternos = await _context.Denuncias
            .Where(d => d.Latitude != null && d.Longitude != null)
            .GroupBy(d => new
            {
                Latitude = Math.Round(d.Latitude!.Value, 2),
                Longitude = Math.Round(d.Longitude!.Value, 2)
            })
            .Select(d => new
            {
                latitude = d.Key.Latitude,
                longitude = d.Key.Longitude,
                quantidade = d.Count()
            })
            .ToListAsync();

        var caminhoExternos = Path.Combine(
            Directory.GetCurrentDirectory(),
            "DataSources",
            "dados-violencia-externos.csv"
        );

        var dadosExternos = _dadosService.LerCsvExterno(caminhoExternos)
            .GroupBy(d => new
            {
                Latitude = Math.Round(d.Latitude, 2),
                Longitude = Math.Round(d.Longitude, 2)
            })
            .Select(g => new
            {
                latitude = g.Key.Latitude,
                longitude = g.Key.Longitude,
                quantidade = g.Sum(x => x.Quantidade)
            })
            .ToList();

        var dados = dadosInternos
            .Concat(dadosExternos)
            .GroupBy(d => new { d.latitude, d.longitude })
            .Select(g => new
            {
                latitude = g.Key.latitude,
                longitude = g.Key.longitude,
                quantidade = g.Sum(x => x.quantidade)
            })
            .ToList();

        // Se vazio, retorna dados de teste de Recife
        if (dados.Count == 0)
        {
            dados.Add(new { latitude = -8.04, longitude = -34.87, quantidade = 5 });
            dados.Add(new { latitude = -8.06, longitude = -34.88, quantidade = 3 });
            dados.Add(new { latitude = -8.05, longitude = -34.86, quantidade = 8 });
        }

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
            nomeArquivo = e.NomeArquivo,
            url = $"/uploads/{e.NomeArquivo}",
            tipo = ObterTipoMidia(e.NomeArquivo)
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

    [HttpPut("{id}/status")]
    public async Task<IActionResult> AtualizarStatus(int id, [FromBody] AtualizarStatusDto dto)
    {
        var denuncia = await _context.Denuncias.FindAsync(id);

        if (denuncia == null)
            return NotFound("Denúncia não encontrada");

        denuncia.Status = dto.Status;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "Status atualizado com sucesso",
            id = denuncia.Id,
            codigo = denuncia.Codigo,
            status = denuncia.Status
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Excluir(int id)
    {
        var denuncia = await _context.Denuncias.FirstOrDefaultAsync(d => d.Id == id);
        if (denuncia == null)
            return NotFound("Denúncia não encontrada");

        var evidencias = await _context.Evidencias
            .Where(e => e.DenunciaId == id)
            .ToListAsync();

        foreach (var evidencia in evidencias)
        {
            var caminhoArquivo = evidencia.Caminho;

            if (!string.IsNullOrWhiteSpace(caminhoArquivo) && System.IO.File.Exists(caminhoArquivo))
            {
                try
                {
                    System.IO.File.Delete(caminhoArquivo);
                }
                catch
                {
                    // Não bloqueia a exclusão do registro se o arquivo físico falhar.
                }
            }
        }

        _context.Evidencias.RemoveRange(evidencias);
        _context.Denuncias.Remove(denuncia);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "Denúncia excluída com sucesso",
            id
        });
    }

    private static string ObterTipoMidia(string? nomeArquivo)
    {
        var extensao = Path.GetExtension(nomeArquivo ?? string.Empty).ToLowerInvariant();

        return extensao switch
        {
            ".jpg" or ".jpeg" or ".png" or ".webp" => "imagem",
            ".mp4" or ".webm" => "video",
            _ => "arquivo"
        };
    }

}