namespace EnterpriseAI.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly IRepository<User> _users;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly JwtSettings _jwt;

        public AuthService(
            IRepository<User> users,
            IPasswordHasher<User> passwordHasher,
            IOptions<JwtSettings> jwtOptions)
        {
            _users = users;
            _passwordHasher = passwordHasher;
            _jwt = jwtOptions.Value;
        }

        public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
        {
            var user = await _users.GetFirstAsync(
                u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);

            if (user is null || !user.IsActive)
            {
                throw new UnauthorizedAccessException("Invalid email or password.");
            }

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
            if (result == PasswordVerificationResult.Failed)
            {
                throw new UnauthorizedAccessException("Invalid email or password.");
            }

            if (result == PasswordVerificationResult.SuccessRehashNeeded)
            {
                user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
                _users.Update(user);
                await _users.SaveChangesAsync(cancellationToken);
            }

            return CreateLoginResponse(user);
        }

        private LoginResponse CreateLoginResponse(User user)
        {
            return new LoginResponse(
                CreateToken(user),
                DateTime.UtcNow.AddMinutes(_jwt.ExpiryMinutes),
                user.ToDto());
        }

        private string CreateToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var descriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(_jwt.ExpiryMinutes),
                Issuer = _jwt.Issuer,
                Audience = _jwt.Audience,
                SigningCredentials = credentials
            };

            return new JwtSecurityTokenHandler().CreateEncodedJwt(descriptor);
        }
    }
}
