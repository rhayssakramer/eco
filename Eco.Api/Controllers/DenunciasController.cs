
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
    public DenunciasController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<DenunciaResponseDto>> CriarDenuncia(CreateDenunciaDto dto)
    {
        var denuncia = new Denuncia
        {
            Tipo = dto.Tipo,
            Descricao = dto.Descricao,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            DataCriacao = DateTime.UtcNow,
            Status = StatusDenuncia.Recebido
        };
            _context.Denuncias.Add(denuncia);
            await _context.SaveChangesAsync();

        var response = new DenunciaResponseDto
        {
            Id = denuncia.Id,
            Tipo = denuncia.Tipo,
            Descricao = denuncia.Descricao,
            Latitude = denuncia.Latitude ?? 0,
            Longitude = denuncia.Longitude ?? 0,
            DataCriacao = denuncia.DataCriacao,
            Status = denuncia.Status
        };

        return CreatedAtAction(nameof(Listar), new { id = denuncia.Id }, response);
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        return Ok(await _context.Denuncias.ToListAsync());
    }

    [HttpPost("panico")]
    public async Task<IActionResult> Panico()
    {
        var denuncia = new Denuncia
        {
            Tipo = TipoDenuncia.Violencia,
            Descricao = "🚨 Emergência acionada via botão do pânico.",
            Status = StatusDenuncia.Emergencia
        };

        _context.Denuncias.Add(denuncia);
        await _context.SaveChangesAsync();

        return Ok("Alerta enviado.");
    }
}