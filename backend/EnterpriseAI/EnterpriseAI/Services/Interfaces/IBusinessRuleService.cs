namespace EnterpriseAI.Services.Interfaces
{
    public interface IBusinessRuleService
    {
        Task<IEnumerable<BusinessRuleDto>> GetByFormAsync(string formId, CancellationToken cancellationToken = default);
        Task<BusinessRuleDto> CreateAsync(CreateBusinessRuleDto dto, CancellationToken cancellationToken = default);
        Task<BusinessRuleDto?> UpdateAsync(string id, UpdateBusinessRuleDto dto, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
    }
}
