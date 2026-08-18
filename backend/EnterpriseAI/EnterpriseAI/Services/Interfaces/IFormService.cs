namespace EnterpriseAI.Services.Interfaces
{
    public interface IFormService
    {
        Task<IEnumerable<FormDto>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<FormDetailDto?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
        Task<FormSchemaDto?> GetSchemaAsync(string id, CancellationToken cancellationToken = default);
        Task<FormDto> CreateAsync(CreateFormDto dto, CancellationToken cancellationToken = default);
        Task<FormVersionDto> CreateVersionAsync(string formId, CreateFormVersionDto dto, CancellationToken cancellationToken = default);
        Task<FormFieldDto> AddFieldAsync(string formId, string versionId, CreateFormFieldDto dto, CancellationToken cancellationToken = default);
    }
}
