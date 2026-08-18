namespace EnterpriseAI.Services.Interfaces
{
    public interface ISubmissionService
    {
        Task<SubmissionDto> CreateAsync(CreateSubmissionDto dto, string userId, CancellationToken cancellationToken = default);
        Task<SubmissionDto?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
        Task<SubmissionDto> UpdateFieldsAsync(string id, UpdateSubmissionFieldsDto dto, string userId, CancellationToken cancellationToken = default);
        Task<ValidationResultDto> ValidateAsync(string id, CancellationToken cancellationToken = default);
        Task<SubmissionDto?> ConfirmAsync(string id, string userId, CancellationToken cancellationToken = default);
    }
}
