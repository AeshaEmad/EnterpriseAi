namespace EnterpriseAI.Services.Implementations
{
    public class BusinessRuleService : IBusinessRuleService
    {
        private readonly IRepository<Form> _forms;
        private readonly IRepository<FormVersion> _versions;
        private readonly IRepository<BusinessRule> _rules;

        public BusinessRuleService(
            IRepository<Form> forms,
            IRepository<FormVersion> versions,
            IRepository<BusinessRule> rules)
        {
            _forms = forms;
            _versions = versions;
            _rules = rules;
        }

        public async Task<IEnumerable<BusinessRuleDto>> GetByFormAsync(string formId, CancellationToken cancellationToken = default)
        {
            var form = await _forms.GetFirstAsync(
                f => f.Id == formId,
                new Expression<Func<Form, object>>[] { f => f.Versions },
                cancellationToken);

            if (form is null)
            {
                throw new KeyNotFoundException("Form not found.");
            }

            var versionIds = form.Versions.Select(v => v.Id).ToHashSet();

            var rules = await _rules.GetManyAsync(
                r => r.FormVersionId != null && versionIds.Contains(r.FormVersionId),
                cancellationToken);

            return rules.OrderBy(r => r.Priority).Select(r => r.ToDto(formId));
        }

        public async Task<BusinessRuleDto> CreateAsync(CreateBusinessRuleDto dto, CancellationToken cancellationToken = default)
        {
            string versionId;

            if (!string.IsNullOrWhiteSpace(dto.FormVersionId))
            {
                var version = await _versions.GetFirstAsync(v => v.Id == dto.FormVersionId, cancellationToken);
                if (version is null)
                {
                    throw new KeyNotFoundException("Form version not found.");
                }

                versionId = version.Id;
            }
            else
            {
                var form = await _forms.GetFirstAsync(
                    f => f.Id == dto.FormId,
                    new Expression<Func<Form, object>>[] { f => f.Versions },
                    cancellationToken);

                if (form is null)
                {
                    throw new KeyNotFoundException("Form not found.");
                }

                var version = form.Versions
                    .OrderByDescending(v => v.IsActive ? 1 : 0)
                    .ThenByDescending(v => v.VersionNumber)
                    .FirstOrDefault();

                if (version is null)
                {
                    throw new InvalidOperationException("The form has no version. Create a version first.");
                }

                versionId = version.Id;
            }

            var rule = dto.ToEntity(versionId);
            await _rules.AddAsync(rule, cancellationToken);
            await _rules.SaveChangesAsync(cancellationToken);
            return rule.ToDto(dto.FormId);
        }

        public async Task<BusinessRuleDto?> UpdateAsync(string id, UpdateBusinessRuleDto dto, CancellationToken cancellationToken = default)
        {
            var rule = await _rules.GetFirstAsync(
                r => r.Id == id,
                new Expression<Func<BusinessRule, object>>[] { r => r.FormVersion! },
                cancellationToken);

            if (rule is null)
            {
                return null;
            }

            dto.Apply(rule);
            _rules.Update(rule);
            await _rules.SaveChangesAsync(cancellationToken);
            return rule.ToDto(rule.FormVersion?.FormId ?? string.Empty);
        }

        public async Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
        {
            var rule = await _rules.GetByIdAsync(id, cancellationToken);
            if (rule is null)
            {
                return false;
            }

            _rules.Delete(rule);
            await _rules.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
