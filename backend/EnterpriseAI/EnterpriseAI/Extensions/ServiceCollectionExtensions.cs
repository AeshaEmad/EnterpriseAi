using EnterpriseAI.Data;
using EnterpriseAI.Repositories;
using EnterpriseAI.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseAI.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

            return services;
        }
    }
}
