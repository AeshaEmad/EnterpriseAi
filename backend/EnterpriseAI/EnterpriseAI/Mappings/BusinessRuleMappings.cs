namespace EnterpriseAI.Mappings
{
    public static class BusinessRuleMappings
    {
        public static BusinessRuleDto ToDto(this BusinessRule rule, string formId)
        {
            return new BusinessRuleDto(
                rule.Id,
                rule.FormVersionId,
                formId,
                rule.Name,
                rule.Description,
                rule.RuleType,
                rule.Definition,
                rule.Priority,
                rule.IsActive,
                rule.CreatedAt,
                rule.UpdatedAt);
        }

        public static BusinessRule ToEntity(this CreateBusinessRuleDto dto, string formVersionId)
        {
            return new BusinessRule
            {
                Id = Guid.NewGuid().ToString(),
                FormVersionId = formVersionId,
                Name = dto.Name,
                Description = dto.Description,
                RuleType = dto.RuleType,
                Definition = dto.Definition,
                Priority = dto.Priority,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        public static void Apply(this UpdateBusinessRuleDto dto, BusinessRule rule)
        {
            rule.Name = dto.Name;
            rule.Description = dto.Description;
            rule.RuleType = dto.RuleType;
            rule.Definition = dto.Definition;
            rule.Priority = dto.Priority;
            rule.IsActive = dto.IsActive;
            rule.UpdatedAt = DateTime.UtcNow;
        }
    }
}
