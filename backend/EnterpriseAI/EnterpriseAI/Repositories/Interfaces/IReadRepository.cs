namespace EnterpriseAI.Repositories.Interfaces
{
    public interface IReadRepository<T> where T : class
    {
        Task<T?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
        Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<T?> GetFirstAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
        Task<T?> GetFirstAsync(Expression<Func<T, bool>> predicate, Expression<Func<T, object>>[] includes, CancellationToken cancellationToken = default);
        Task<IEnumerable<T>> GetManyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
        Task<bool> ExistsAsync(string id, CancellationToken cancellationToken = default);
    }
}
