namespace EnterpriseAI.Services.Interfaces
{
    public interface IBusinessRuleEngine
    {
        Task<IReadOnlyList<RuleExecutionResult>> ExecuteAsync(
            FormSubmission submission,
            IReadOnlyList<BusinessRule> rules,
            CancellationToken cancellationToken = default);
    }
}
