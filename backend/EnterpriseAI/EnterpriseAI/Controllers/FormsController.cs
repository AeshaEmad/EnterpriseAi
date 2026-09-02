namespace EnterpriseAI.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/forms")]
    public class FormsController : ControllerBase
    {
        private readonly IFormService _formService;

        public FormsController(IFormService formService)
        {
            _formService = formService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<FormDto>>> GetAll(CancellationToken cancellationToken)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            var isAdmin = User.IsInRole("Admin");
            var isManager = User.IsInRole("Manager");
            var forms = await _formService.GetAllAsync(currentUserId, isAdmin, isManager, cancellationToken);
            return Ok(forms);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<FormDetailDto>> GetById(string id, CancellationToken cancellationToken)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            var isAdmin = User.IsInRole("Admin");
            var isManager = User.IsInRole("Manager");
            var form = await _formService.GetByIdAsync(id, currentUserId, isAdmin, isManager, cancellationToken);
            return form is null ? NotFound() : Ok(form);
        }

        [HttpGet("{id}/schema")]
        public async Task<ActionResult<FormSchemaDto>> GetSchema(string id, CancellationToken cancellationToken)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            var isAdmin = User.IsInRole("Admin");
            var isManager = User.IsInRole("Manager");
            var schema = await _formService.GetSchemaAsync(id, currentUserId, isAdmin, isManager, cancellationToken);
            return schema is null ? NotFound() : Ok(schema);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<FormDto>> Create(
            [FromBody] CreateFormDto dto,
            CancellationToken cancellationToken)
        {
            var form = await _formService.CreateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = form.Id }, form);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/versions")]
        public async Task<ActionResult<FormVersionDto>> CreateVersion(
            string id,
            [FromBody] CreateFormVersionDto dto,
            CancellationToken cancellationToken)
        {
            var version = await _formService.CreateVersionAsync(id, dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id }, version);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/versions/{versionId}/fields")]
        public async Task<ActionResult<FormFieldDto>> AddField(
            string id,
            string versionId,
            [FromBody] CreateFormFieldDto dto,
            CancellationToken cancellationToken)
        {
            var field = await _formService.AddFieldAsync(id, versionId, dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id }, field);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/versions/{versionId}/submit-for-approval")]
        public async Task<ActionResult<FormVersionDto>> SubmitForApproval(
            string id,
            string versionId,
            CancellationToken cancellationToken)
        {
            var version = await _formService.SubmitForApprovalAsync(id, versionId, cancellationToken);
            return Ok(version);
        }

        [Authorize(Roles = "Manager")]
        [HttpPost("{id}/versions/{versionId}/approve")]
        public async Task<ActionResult<FormVersionDto>> Approve(
            string id,
            string versionId,
            CancellationToken cancellationToken)
        {
            var version = await _formService.ApproveVersionAsync(id, versionId, new ApprovalActionDto(null), cancellationToken);
            return Ok(version);
        }

        [Authorize(Roles = "Manager")]
        [HttpPost("{id}/versions/{versionId}/reject")]
        public async Task<ActionResult<FormVersionDto>> Reject(
            string id,
            string versionId,
            [FromBody] ApprovalActionDto dto,
            CancellationToken cancellationToken)
        {
            var version = await _formService.RejectVersionAsync(id, versionId, dto, cancellationToken);
            return Ok(version);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/versions/{versionId}/resubmit")]
        public async Task<ActionResult<FormVersionDto>> Resubmit(
            string id,
            string versionId,
            CancellationToken cancellationToken)
        {
            var version = await _formService.ResubmitVersionAsync(id, versionId, cancellationToken);
            return Ok(version);
        }
    }
}