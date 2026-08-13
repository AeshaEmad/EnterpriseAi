namespace EnterpriseAI.Data
{
    public static class DbInitializer
    {
        public static async Task SeedAdminAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();

            var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var email = configuration["Admin:Email"];
            var password = configuration["Admin:Password"];
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                return;
            }

            try
            {
                if (await db.Users.AnyAsync(u => u.Email.ToLower() == email.ToLower()))
                {
                    return;
                }

                var admin = new User
                {
                    Id = Guid.NewGuid().ToString(),
                    FullName = configuration["Admin:FullName"] ?? "System Administrator",
                    Email = email.Trim(),
                    PasswordHash = string.Empty,
                    Role = "Admin",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                admin.PasswordHash = hasher.HashPassword(admin, password);

                db.Users.Add(admin);
                await db.SaveChangesAsync();
            }
            catch (Exception)
            {
                // Database may be unavailable at startup; the admin will be seeded on the next run.
            }
        }
    }
}
