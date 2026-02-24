using Microsoft.EntityFrameworkCore;
using Eco.Api.Models;

namespace Eco.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Denuncia> Denuncias { get; set; }
}