namespace EnterpriseAI.Data
{
    public static class DbInitializer
    {
        private const string EmployeeOnboardingFormName = "Employee Onboarding";

        private static readonly DemoField[] EmployeeOnboardingFields =
        {
            new("fullName", "Full Name", "text", true, 0),
            new(
                "department",
                "Department",
                "select",
                true,
                1,
                JsonNode.Parse("[\"Sales\",\"Marketing\",\"Finance\",\"HR\",\"Engineering\"]")),
            new("jobTitle", "Job Title", "text", true, 2),
            new(
                "employmentType",
                "Employment Type",
                "select",
                true,
                3,
                JsonNode.Parse("[\"Full-time\",\"Part-time\",\"Contract\",\"Intern\"]")),
            new("startDate", "Start Date", "date", true, 4),
            new("dateOfBirth", "Date of Birth", "date", false, 5),
            new("salary", "Salary", "number", false, 6),
            new("workEmail", "Work Email", "email", false, 7),
            new("phoneNumber", "Phone Number", "tel", false, 8),
            new("city", "City", "text", false, 9)
        };

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

        public static async Task SeedDemoFormAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var forms = await db.Forms
                .Include(form => form.Versions)
                .ThenInclude(version => version.Fields)
                .AsSplitQuery()
                .ToListAsync();

            var form = FindEmployeeForm(forms);
            var now = DateTime.UtcNow;

            if (form is null)
            {
                form = new Form
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = EmployeeOnboardingFormName,
                    Description = "Employee onboarding form",
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                db.Forms.Add(form);
            }
            else if (!form.IsActive)
            {
                form.IsActive = true;
                form.UpdatedAt = now;
            }

            var version = form.Versions
                .OrderByDescending(item => item.IsActive)
                .ThenByDescending(item => item.VersionNumber)
                .FirstOrDefault();

            if (version is null)
            {
                version = new FormVersion
                {
                    Id = Guid.NewGuid().ToString(),
                    FormId = form.Id,
                    VersionNumber = 1,
                    Status = FormVersionStatus.Published,
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now,
                    PublishedAt = now
                };

                form.Versions.Add(version);
            }

            foreach (var definition in EmployeeOnboardingFields)
            {
                var field = version.Fields.FirstOrDefault(item =>
                    string.Equals(item.FieldName, definition.Name, StringComparison.OrdinalIgnoreCase));

                if (field is null)
                {
                    version.Fields.Add(new FormField
                    {
                        Id = Guid.NewGuid().ToString(),
                        FormVersionId = version.Id,
                        FieldName = definition.Name,
                        FieldLabel = definition.Label,
                        FieldType = definition.Type,
                        IsRequired = definition.IsRequired,
                        Options = CloneJson(definition.Options),
                        DisplayOrder = definition.DisplayOrder,
                        CreatedAt = now,
                        UpdatedAt = now
                    });

                    continue;
                }

                if (ApplyDefinition(field, definition))
                {
                    field.UpdatedAt = now;
                }
            }

            await db.SaveChangesAsync();
        }

        private static Form? FindEmployeeForm(IEnumerable<Form> forms)
        {
            var aliases = new[] { EmployeeOnboardingFormName, "Employee Form" };
            var formList = forms.ToList();

            var namedForm = formList.FirstOrDefault(form => aliases.Any(alias =>
                string.Equals(form.Name, alias, StringComparison.OrdinalIgnoreCase)));

            if (namedForm is not null)
            {
                return namedForm;
            }

            return formList.FirstOrDefault(form =>
            {
                var fieldNames = form.Versions
                    .SelectMany(version => version.Fields)
                    .Select(field => field.FieldName)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                return fieldNames.Contains("fullName")
                    && fieldNames.Contains("department")
                    && fieldNames.Contains("startDate");
            });
        }

        private static bool ApplyDefinition(FormField field, DemoField definition)
        {
            var changed = false;

            changed |= SetIfDifferent(field.FieldName, definition.Name, value => field.FieldName = value);
            changed |= SetIfDifferent(field.FieldLabel, definition.Label, value => field.FieldLabel = value);
            changed |= SetIfDifferent(field.FieldType, definition.Type, value => field.FieldType = value);

            if (field.IsRequired != definition.IsRequired)
            {
                field.IsRequired = definition.IsRequired;
                changed = true;
            }

            if (field.DisplayOrder != definition.DisplayOrder)
            {
                field.DisplayOrder = definition.DisplayOrder;
                changed = true;
            }

            var currentOptions = field.Options?.ToJsonString();
            var expectedOptions = definition.Options?.ToJsonString();
            if (!string.Equals(currentOptions, expectedOptions, StringComparison.Ordinal))
            {
                field.Options = CloneJson(definition.Options);
                changed = true;
            }

            return changed;
        }

        private static bool SetIfDifferent(string current, string expected, Action<string> setter)
        {
            if (string.Equals(current, expected, StringComparison.Ordinal))
            {
                return false;
            }

            setter(expected);
            return true;
        }

        private static JsonNode? CloneJson(JsonNode? value)
        {
            return value is null ? null : JsonNode.Parse(value.ToJsonString());
        }

        private sealed record DemoField(
            string Name,
            string Label,
            string Type,
            bool IsRequired,
            int DisplayOrder,
            JsonNode? Options = null);
    }
}
