
using Eco.Api.Data;
using Eco.Api.Enums;
using Eco.Api.Models;
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
    public async Task<IActionResult> Criar(Denuncia denuncia)
        {
            _context.Denuncias.Add(denuncia);
            await _context.SaveChangesAsync();
            return Ok(denuncia);
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