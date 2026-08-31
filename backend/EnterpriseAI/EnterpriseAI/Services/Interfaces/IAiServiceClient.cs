namespace EnterpriseAI.Services.Interfaces
{
    public interface IAiServiceClient
    {
        Task<AiExtractResponse> ExtractAsync(AiExtractRequest request, CancellationToken cancellationToken = default);
    }
}
