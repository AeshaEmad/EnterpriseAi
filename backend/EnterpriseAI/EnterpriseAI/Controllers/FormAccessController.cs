namespace EnterpriseAI.Controllers
{
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Route("api/users/{userId}/forms")]
    public class FormAccessController : ControllerBase
    {
        private readonly IFormAccessService _formAccessService;

        public FormAccessController(IFormAccessService formAccessService)
        {
            _formAccessService = formAccessService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserFormAccessDto>>> GetAccess(string userId, CancellationToken cancellationToken)
        {
            var access = await _formAccessService.GetAccessForUserAsync(userId, cancellationToken);
            return Ok(access);
        }

        [HttpPost]
        public async Task<ActionResult<UserFormAccessDto>> GrantAccess(
            string userId,
            [FromBody] GrantFormAccessDto dto,
            CancellationToken cancellationToken)
        {
            var grantedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            var result = await _formAccessService.GrantAccessAsync(
                new AssignFormAccessDto(userId, dto.FormId), grantedByUserId, cancellationToken);
            return CreatedAtAction(nameof(GetAccess), new { userId }, result);
        }

        [HttpDelete]
        public async Task<IActionResult> RevokeAccess(
            string userId,
            [FromBody] GrantFormAccessDto dto,
            CancellationToken cancellationToken)
        {
            var revoked = await _formAccessService.RevokeAccessAsync(userId, dto.FormId, cancellationToken);
            return revoked ? NoContent() : NotFound();
        }
    }
}