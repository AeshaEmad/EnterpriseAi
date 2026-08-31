namespace EnterpriseAI.Mappings

{
    public static class FormAccessMappings
    {
        public static UserFormAccessDto ToDto(this UserFormAccess entity)
        {
            return new UserFormAccessDto(
                entity.Id,
                entity.UserId,
                entity.User?.FullName ?? string.Empty,
                entity.FormId,
                entity.Form?.Name ?? string.Empty,
                entity.GrantedByUserId,
                entity.GrantedAt);
        }
    }
}