using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EnterpriseAI.Migrations
{
    /// <inheritdoc />
    public partial class AddUserFormAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserFormAccesses",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FormId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    GrantedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    GrantedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFormAccesses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserFormAccesses_Forms_FormId",
                        column: x => x.FormId,
                        principalTable: "Forms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserFormAccesses_Users_GrantedByUserId",
                        column: x => x.GrantedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserFormAccesses_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserFormAccesses_FormId",
                table: "UserFormAccesses",
                column: "FormId");

            migrationBuilder.CreateIndex(
                name: "IX_UserFormAccesses_GrantedByUserId",
                table: "UserFormAccesses",
                column: "GrantedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserFormAccesses_UserId_FormId",
                table: "UserFormAccesses",
                columns: new[] { "UserId", "FormId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserFormAccesses");
        }
    }
}
