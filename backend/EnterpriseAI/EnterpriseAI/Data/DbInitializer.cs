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
                if (!await db.Users.AnyAsync(u => u.Email.ToLower() == email.ToLower()))
                {
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
                }

                var managerEmail = configuration["Manager:Email"];
                var managerPassword = configuration["Manager:Password"];
                if (!string.IsNullOrWhiteSpace(managerEmail) && !string.IsNullOrWhiteSpace(managerPassword))
                {
                    if (!await db.Users.AnyAsync(u => u.Email.ToLower() == managerEmail.ToLower()))
                    {
                        var manager = new User
                        {
                            Id = Guid.NewGuid().ToString(),
                            FullName = configuration["Manager:FullName"] ?? "Form Manager",
                            Email = managerEmail.Trim(),
                            PasswordHash = string.Empty,
                            Role = "Manager",
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        manager.PasswordHash = hasher.HashPassword(manager, managerPassword);
                        db.Users.Add(manager);
                    }
                }

                await db.SaveChangesAsync();
            }
            catch (Exception)
            {
            }
        }
    }
}
