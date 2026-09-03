namespace EnterpriseAI.Services.Implementations
{
    public static class FormVersionStatus
    {
        public const string Draft = "Draft";
        public const string PendingApproval = "PendingApproval";
        public const string Published = "Published";
        public const string Rejected = "Rejected";
    }

    public class FormService : IFormService
    {
        private readonly IRepository<Form> _forms;
        private readonly IRepository<FormVersion> _versions;
        private readonly IRepository<FormField> _fields;
        private readonly IFormAccessService _formAccess;

        public FormService(
            IRepository<Form> forms,
            IRepository<FormVersion> versions,
            IRepository<FormField> fields,
            IFormAccessService formAccess)
        {
            _forms = forms;
            _versions = versions;
            _fields = fields;
            _formAccess = formAccess;
        }

        public async Task<IEnumerable<FormDto>> GetAllAsync(string currentUserId, bool isAdmin, bool isManager, CancellationToken cancellationToken = default)
        {
            var forms = (await _forms.GetAllAsync(cancellationToken)).ToList();

            if (isAdmin || isManager)
            {
                return forms.Select(f => f.ToDto());
            }

            var activeVersions = await _versions.GetManyAsync(
                v => v.Status == FormVersionStatus.Published && v.IsActive, cancellationToken);
            var formsWithPublishedActiveVersion = activeVersions.Select(v => v.FormId).ToHashSet();

            var accessible = await _formAccess.GetAccessForUserAsync(currentUserId, cancellationToken);
            var allowedFormIds = accessible.Select(a => a.FormId).ToHashSet();

            return forms
                .Where(f => f.IsActive && allowedFormIds.Contains(f.Id) && formsWithPublishedActiveVersion.Contains(f.Id))
                .Select(f => f.ToDto());
        }

        public async Task<FormDetailDto?> GetByIdAsync(string id, string currentUserId, bool isAdmin, bool isManager, CancellationToken cancellationToken = default)
        {
            if (!isAdmin && !isManager && !await _formAccess.HasAccessAsync(currentUserId, id, cancellationToken))
            {
                throw new UnauthorizedAccessException("You do not have access to this form.");
            }

            var form = await _forms.GetFirstAsync(
                f => f.Id == id,
                new Expression<Func<Form, object>>[] { f => f.Versions },
                cancellationToken);

            if (form is null)
            {
                return null;
            }

            var versionIds = form.Versions.Select(v => v.Id).ToList();
            var allFields = await _fields.GetManyAsync(f => versionIds.Contains(f.FormVersionId), cancellationToken);
            var fieldsByVersion = allFields.GroupBy(f => f.FormVersionId).ToDictionary(g => g.Key, g => g.ToList());

            foreach (var v in form.Versions)
            {
                if (fieldsByVersion.TryGetValue(v.Id, out var fList))
                {
                    v.Fields = fList;
                }
            }

            return form.ToDetailDto();
        }

        public async Task<FormSchemaDto?> GetSchemaAsync(string id, string currentUserId, bool isAdmin, bool isManager, CancellationToken cancellationToken = default)
        {
            if (!isAdmin && !isManager && !await _formAccess.HasAccessAsync(currentUserId, id, cancellationToken))
            {
                throw new UnauthorizedAccessException("You do not have access to this form.");
            }

            var form = await _forms.GetFirstAsync(
                f => f.Id == id,
                new Expression<Func<Form, object>>[] { f => f.Versions },
                cancellationToken);

            if (form is null)
            {
                return null;
            }

            var version = (isAdmin || isManager)
                ? form.Versions
                    .OrderByDescending(v => v.IsActive ? 1 : 0)
                    .ThenByDescending(v => v.VersionNumber)
                    .FirstOrDefault()
                : form.Versions
                    .Where(v => v.Status == FormVersionStatus.Published && v.IsActive)
                    .OrderByDescending(v => v.VersionNumber)
                    .FirstOrDefault();

            if (version is null)
            {
                return null;
            }

            var versionWithFields = await _versions.GetFirstAsync(
                v => v.Id == version.Id,
                new Expression<Func<FormVersion, object>>[] { v => v.Fields },
                cancellationToken);

            if (versionWithFields is null)
            {
                return null;
            }

            return form.ToSchemaDto(versionWithFields);
        }

        public async Task<FormDto> CreateAsync(CreateFormDto dto, CancellationToken cancellationToken = default)
        {
            var existing = await _forms.GetFirstAsync(
                f => f.Name.ToLower() == dto.Name.ToLower(), cancellationToken);

            if (existing is not null)
            {
                throw new InvalidOperationException("A form with this name already exists.");
            }

            var form = dto.ToEntity();
            await _forms.AddAsync(form, cancellationToken);
            await _forms.SaveChangesAsync(cancellationToken);
            return form.ToDto();
        }

        public async Task<FormVersionDto> CreateVersionAsync(string formId, CreateFormVersionDto dto, CancellationToken cancellationToken = default)
        {
            if (!await _forms.ExistsAsync(formId, cancellationToken))
            {
                throw new KeyNotFoundException("Form not found.");
            }

            var duplicate = await _versions.GetFirstAsync(
                v => v.FormId == formId && v.VersionNumber == dto.VersionNumber, cancellationToken);

            if (duplicate is not null)
            {
                throw new InvalidOperationException("A version with this number already exists for the form.");
            }

            var version = dto.ToEntity(formId);
            await _versions.AddAsync(version, cancellationToken);
            await _versions.SaveChangesAsync(cancellationToken);
            return version.ToDto();
        }

        public async Task<FormFieldDto> AddFieldAsync(string formId, string versionId, CreateFormFieldDto dto, CancellationToken cancellationToken = default)
        {
            var version = await _versions.GetFirstAsync(v => v.Id == versionId, cancellationToken);
            if (version is null || version.FormId != formId)
            {
                throw new KeyNotFoundException("Form version not found.");
            }

            if (version.Status != FormVersionStatus.Draft)
            {
                throw new InvalidOperationException("Fields can only be added to a Draft version.");
            }

            var duplicate = await _fields.GetFirstAsync(
                f => f.FormVersionId == versionId && f.FieldName.ToLower() == dto.FieldName.ToLower(), cancellationToken);

            if (duplicate is not null)
            {
                throw new InvalidOperationException("A field with this name already exists in the version.");
            }

            var field = dto.ToEntity(versionId);
            await _fields.AddAsync(field, cancellationToken);
            await _fields.SaveChangesAsync(cancellationToken);
            return field.ToDto();
        }

        public async Task<FormVersionDto?> SubmitForApprovalAsync(string formId, string versionId, CancellationToken cancellationToken = default)
        {
            var version = await _versions.GetFirstAsync(v => v.Id == versionId && v.FormId == formId, cancellationToken);
            if (version is null)
            {
                throw new KeyNotFoundException("Form version not found.");
            }

            if (version.Status != FormVersionStatus.Draft)
            {
                throw new InvalidOperationException("Only Draft versions can be submitted for approval.");
            }

            version.Status = FormVersionStatus.PendingApproval;
            version.UpdatedAt = DateTime.UtcNow;
            _versions.Update(version);
            await _versions.SaveChangesAsync(cancellationToken);
            return version.ToDto();
        }

        public async Task<FormVersionDto?> ApproveVersionAsync(string formId, string versionId, ApprovalActionDto dto, CancellationToken cancellationToken = default)
        {
            var version = await _versions.GetFirstAsync(v => v.Id == versionId && v.FormId == formId, cancellationToken);
            if (version is null)
            {
                throw new KeyNotFoundException("Form version not found.");
            }

            if (version.Status != FormVersionStatus.PendingApproval)
            {
                throw new InvalidOperationException("Only versions in PendingApproval status can be approved.");
            }

            var oldActiveVersion = await _versions.GetFirstAsync(
                v => v.FormId == formId && v.IsActive && v.Id != versionId, cancellationToken);

            if (oldActiveVersion is not null)
            {
                oldActiveVersion.IsActive = false;
                oldActiveVersion.UpdatedAt = DateTime.UtcNow;
                _versions.Update(oldActiveVersion);
            }

            version.Status = FormVersionStatus.Published;
            version.IsActive = true;
            version.PublishedAt = DateTime.UtcNow;
            version.UpdatedAt = DateTime.UtcNow;
            _versions.Update(version);

            var form = await _forms.GetFirstAsync(f => f.Id == formId, cancellationToken);
            if (form is not null && !form.IsActive)
            {
                form.IsActive = true;
                form.UpdatedAt = DateTime.UtcNow;
                _forms.Update(form);
                await _forms.SaveChangesAsync(cancellationToken);
            }

            await _versions.SaveChangesAsync(cancellationToken);
            return version.ToDto();
        }

        public async Task<FormVersionDto?> RejectVersionAsync(string formId, string versionId, ApprovalActionDto dto, CancellationToken cancellationToken = default)
        {
            var version = await _versions.GetFirstAsync(v => v.Id == versionId && v.FormId == formId, cancellationToken);
            if (version is null)
            {
                throw new KeyNotFoundException("Form version not found.");
            }

            if (version.Status != FormVersionStatus.PendingApproval)
            {
                throw new InvalidOperationException("Only versions in PendingApproval status can be rejected.");
            }

            version.Status = FormVersionStatus.Rejected;
            version.UpdatedAt = DateTime.UtcNow;
            _versions.Update(version);
            await _versions.SaveChangesAsync(cancellationToken);
            return version.ToDto();
        }

        public async Task<FormVersionDto?> ResubmitVersionAsync(string formId, string versionId, CancellationToken cancellationToken = default)
        {
            var version = await _versions.GetFirstAsync(v => v.Id == versionId && v.FormId == formId, cancellationToken);
            if (version is null)
            {
                throw new KeyNotFoundException("Form version not found.");
            }

            if (version.Status != FormVersionStatus.Rejected)
            {
                throw new InvalidOperationException("Only Rejected versions can be resubmitted.");
            }

            version.Status = FormVersionStatus.Draft;
            version.UpdatedAt = DateTime.UtcNow;
            _versions.Update(version);
            await _versions.SaveChangesAsync(cancellationToken);
            return version.ToDto();
        }
    }
}