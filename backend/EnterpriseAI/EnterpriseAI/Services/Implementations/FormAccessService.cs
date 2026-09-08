namespace EnterpriseAI.Services.Implementations
{
    public class FormAccessService : IFormAccessService
    {
        private readonly AppDbContext _db;
        private readonly IRepository<User> _users;
        private readonly IRepository<Form> _forms;

        public FormAccessService(AppDbContext db, IRepository<User> users, IRepository<Form> forms)
        {
            _db = db;
            _users = users;
            _forms = forms;
        }

        public async Task<UserFormAccessDto> GrantAccessAsync(AssignFormAccessDto dto, string grantedByUserId, CancellationToken cancellationToken = default)
        {
            if (!await _users.ExistsAsync(dto.UserId, cancellationToken))
            {
                throw new KeyNotFoundException("User not found.");
            }

            if (!await _forms.ExistsAsync(dto.FormId, cancellationToken))
            {
                throw new KeyNotFoundException("Form not found.");
            }

            var alreadyExists = await _db.UserFormAccesses
                .AnyAsync(a => a.UserId == dto.UserId && a.FormId == dto.FormId, cancellationToken);

            if (alreadyExists)
            {
                throw new InvalidOperationException("This user already has access to this form.");
            }

            var grant = new UserFormAccess
            {
                Id = Guid.NewGuid().ToString(),
                UserId = dto.UserId,
                FormId = dto.FormId,
                GrantedByUserId = grantedByUserId,
                GrantedAt = DateTime.UtcNow
            };

            _db.UserFormAccesses.Add(grant);
            await _db.SaveChangesAsync(cancellationToken);

            var withDetails = await _db.UserFormAccesses
                .Include(a => a.User)
                .Include(a => a.Form)
                .FirstAsync(a => a.Id == grant.Id, cancellationToken);

            return withDetails.ToDto();
        }

        public async Task<bool> RevokeAccessAsync(string userId, string formId, CancellationToken cancellationToken = default)
        {
            var grant = await _db.UserFormAccesses
                .FirstOrDefaultAsync(a => a.UserId == userId && a.FormId == formId, cancellationToken);

            if (grant is null)
            {
                return false;
            }

            _db.UserFormAccesses.Remove(grant);
            await _db.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<IEnumerable<UserFormAccessDto>> GetAccessForUserAsync(string userId, CancellationToken cancellationToken = default)
        {
            var grants = await _db.UserFormAccesses
                .AsNoTracking()
                .Include(a => a.User)
                .Include(a => a.Form)
                .Where(a => a.UserId == userId)
                .ToListAsync(cancellationToken);

            return grants.Select(g => g.ToDto());
        }

        public async Task<bool> HasAccessAsync(string userId, string formId, CancellationToken cancellationToken = default)
        {
            return await _db.UserFormAccesses
                .AsNoTracking()
                .AnyAsync(a => a.UserId == userId && a.FormId == formId, cancellationToken);
        }
    }
}