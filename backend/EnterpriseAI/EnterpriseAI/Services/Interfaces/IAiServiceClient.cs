namespace EnterpriseAI.Services.Interfaces
{
    public interface IAiServiceClient
    {
        Task<AiExtractResponse> ExtractAsync(AiExtractRequest request, CancellationToken cancellationToken = default);
        Task<bool> UploadBusinessRulePdfAsync(string formName, Stream stream, string fileName, CancellationToken cancellationToken = default);
    }
}
