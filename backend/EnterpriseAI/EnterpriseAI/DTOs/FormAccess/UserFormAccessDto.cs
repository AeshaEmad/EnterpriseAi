namespace EnterpriseAI.DTOs.FormAccess
{
    public record UserFormAccessDto(
        string Id,
        string UserId,
        string UserFullName,
        string FormId,
        string FormName,
        string GrantedByUserId,
        DateTime GrantedAt);
}