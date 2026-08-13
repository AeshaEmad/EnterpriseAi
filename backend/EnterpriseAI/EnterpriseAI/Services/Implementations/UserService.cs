namespace EnterpriseAI.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly IRepository<User> _repository;
        private readonly IPasswordHasher<User> _passwordHasher;

        public UserService(IRepository<User> repository, IPasswordHasher<User> passwordHasher)
        {
            _repository = repository;
            _passwordHasher = passwordHasher;
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            var users = await _repository.GetAllAsync(cancellationToken);
            return users.Select(u => u.ToDto());
        }

        public async Task<UserDto?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
        {
            var user = await _repository.GetByIdAsync(id, cancellationToken);
            return user?.ToDto();
        }

        public async Task<UserDto> CreateAsync(CreateUserDto dto, CancellationToken cancellationToken = default)
        {
            var existing = await _repository.GetFirstAsync(
                u => u.Email.ToLower() == dto.Email.ToLower(), cancellationToken);

            if (existing is not null)
            {
                throw new InvalidOperationException("Email is already registered.");
            }

            var user = dto.ToEntity(string.Empty);
            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            await _repository.AddAsync(user, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
            return user.ToDto();
        }

        public async Task<UserDto?> UpdateAsync(string id, UpdateUserDto dto, CancellationToken cancellationToken = default)
        {
            var user = await _repository.GetByIdAsync(id, cancellationToken);
            if (user is null)
            {
                return null;
            }

            dto.Apply(user);
            _repository.Update(user);
            await _repository.SaveChangesAsync(cancellationToken);
            return user.ToDto();
        }

        public async Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
        {
            var user = await _repository.GetByIdAsync(id, cancellationToken);
            if (user is null)
            {
                return false;
            }

            _repository.Delete(user);
            await _repository.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
