using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eco.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAnonimaUsuarioAndReprovadoStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Anonima",
                table: "Denuncias",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "UsuarioId",
                table: "Denuncias",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Anonima",
                table: "Denuncias");

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "Denuncias");
        }
    }
}
