using EnterpriseAI.DTOs;
using EnterpriseAI.Mappings;
using EnterpriseAI.Models;
using EnterpriseAI.Repositories.Interfaces;
using EnterpriseAI.Services.Interfaces;

namespace EnterpriseAI.Services
{
    public class UserService : IUserService
    {
        private readonly IRepository<User> _repository;

        public UserService(IRepository<User> repository)
        {
            _repository = repository;
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
            var user = dto.ToEntity();
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
