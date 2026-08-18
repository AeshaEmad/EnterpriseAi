namespace EnterpriseAI.Mappings
{
    public static class FormMappings
    {
        public static FormDto ToDto(this Form form)
        {
            return new FormDto(
                form.Id,
                form.Name,
                form.Description,
                form.IsActive,
                form.CreatedAt,
                form.UpdatedAt);
        }

        public static FormDetailDto ToDetailDto(this Form form)
        {
            return new FormDetailDto(
                form.Id,
                form.Name,
                form.Description,
                form.IsActive,
                form.Versions.OrderBy(v => v.VersionNumber).Select(v => v.ToDto()).ToList());
        }

        public static FormVersionDto ToDto(this FormVersion version)
        {
            return new FormVersionDto(
                version.Id,
                version.FormId,
                version.VersionNumber,
                version.Status,
                version.IsActive,
                version.CreatedAt,
                version.PublishedAt);
        }

        public static FormFieldDto ToDto(this FormField field)
        {
            return new FormFieldDto(
                field.Id,
                field.FormVersionId,
                field.FieldName,
                field.FieldLabel,
                field.FieldType,
                field.IsRequired,
                field.DefaultValue,
                field.Options,
                field.ValidationRules,
                field.DisplayOrder);
        }

        public static FormSchemaDto ToSchemaDto(this Form form, FormVersion version)
        {
            return new FormSchemaDto(
                form.Id,
                form.Name,
                version.Id,
                version.VersionNumber,
                version.Fields.OrderBy(f => f.DisplayOrder).Select(f => f.ToSchemaFieldDto()).ToList());
        }

        public static FormSchemaFieldDto ToSchemaFieldDto(this FormField field)
        {
            return new FormSchemaFieldDto(
                field.FieldName,
                field.FieldLabel,
                field.FieldType,
                field.IsRequired,
                field.DefaultValue,
                field.Options,
                field.ValidationRules);
        }

        public static Form ToEntity(this CreateFormDto dto)
        {
            return new Form
            {
                Id = Guid.NewGuid().ToString(),
                Name = dto.Name,
                Description = dto.Description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        public static FormVersion ToEntity(this CreateFormVersionDto dto, string formId)
        {
            return new FormVersion
            {
                Id = Guid.NewGuid().ToString(),
                FormId = formId,
                VersionNumber = dto.VersionNumber,
                Status = dto.Status,
                IsActive = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                PublishedAt = dto.Status == "Published" ? DateTime.UtcNow : null
            };
        }

        public static FormField ToEntity(this CreateFormFieldDto dto, string formVersionId)
        {
            return new FormField
            {
                Id = Guid.NewGuid().ToString(),
                FormVersionId = formVersionId,
                FieldName = dto.FieldName,
                FieldLabel = dto.FieldLabel,
                FieldType = dto.FieldType,
                IsRequired = dto.IsRequired,
                DefaultValue = dto.DefaultValue,
                Options = dto.Options,
                ValidationRules = dto.ValidationRules,
                DisplayOrder = dto.DisplayOrder,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }
    }
}
