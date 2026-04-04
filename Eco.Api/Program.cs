using Eco.Api.Data;
using Eco.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Adicionar serviços
builder.Services.AddControllers();
builder.Services.AddScoped<DadosPublicosService>();
builder.Services.AddHttpClient<DadosPublicosService>();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

builder.Services.AddCors(options =>
{
    options.AddPolicy("EcoFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

        policy.SetIsOriginAllowed(origin =>
        {
            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                return false;

            var isLocalhost = uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                || uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase);

            if (builder.Environment.IsDevelopment() && isLocalhost)
                return true;

            return allowedOrigins.Any(x => string.Equals(x, origin, StringComparison.OrdinalIgnoreCase));
        });

        policy.AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    await context.Database.MigrateAsync();

    var adminEmail = builder.Configuration["AdminUser:Email"]
        ?? Environment.GetEnvironmentVariable("ECO_ADMIN_EMAIL");
    var adminSenha = builder.Configuration["AdminUser:Senha"]
        ?? Environment.GetEnvironmentVariable("ECO_ADMIN_SENHA");
    var adminNome = builder.Configuration["AdminUser:Nome"]
        ?? Environment.GetEnvironmentVariable("ECO_ADMIN_NOME");

    if (!string.IsNullOrWhiteSpace(adminEmail)
        && !string.IsNullOrWhiteSpace(adminSenha))
    {
        var usuarioAdmin = await context.Usuarios
            .FirstOrDefaultAsync(u => u.Email.ToLower() == adminEmail.ToLower());

        if (usuarioAdmin is null)
        {
            context.Usuarios.Add(new Usuario
            {
                NomeCompleto = string.IsNullOrWhiteSpace(adminNome) ? "Administrador ECO" : adminNome,
                Email = adminEmail,
                SenhaHash = HashSenha(adminSenha),
                FotoPerfil = null,
                DataCriacao = DateTime.UtcNow
            });
        }
        else
        {
            usuarioAdmin.NomeCompleto = string.IsNullOrWhiteSpace(adminNome) ? usuarioAdmin.NomeCompleto : adminNome;
            usuarioAdmin.SenhaHash = HashSenha(adminSenha);
        }

        await context.SaveChangesAsync();
    }
}

//Miiddleware
if (app.Environment.IsDevelopment()){
    app.UseSwagger();
    app.UseSwaggerUI();
}

var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
if (!Directory.Exists(uploadsPath))
    Directory.CreateDirectory(uploadsPath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseHttpsRedirection();
app.UseCors("EcoFrontend");
app.UseAuthorization();
app.MapControllers();

app.Run();

static string HashSenha(string senha)
{
    using var sha256 = SHA256.Create();
    var bytes = Encoding.UTF8.GetBytes(senha);
    var hash = sha256.ComputeHash(bytes);
    return Convert.ToBase64String(hash);
}