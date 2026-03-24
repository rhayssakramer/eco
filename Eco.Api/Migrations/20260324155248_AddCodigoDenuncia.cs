using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eco.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCodigoDenuncia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Codigo",
                table: "Denuncias",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Codigo",
                table: "Denuncias");
        }
    }
}
