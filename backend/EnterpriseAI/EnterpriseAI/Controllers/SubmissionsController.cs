namespace EnterpriseAI.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/submissions")]
    public class SubmissionsController : ControllerBase
    {
        private readonly ISubmissionService _submissionService;

        public SubmissionsController(ISubmissionService submissionService)
        {
            _submissionService = submissionService;
        }

        [HttpPost]
        public async Task<ActionResult<SubmissionDto>> Create(
            [FromBody] CreateSubmissionDto dto,
            CancellationToken cancellationToken)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new UnauthorizedAccessException("User id claim is missing.");

            var submission = await _submissionService.CreateAsync(dto, userId, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = submission.Id }, submission);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SubmissionDto>> GetById(string id, CancellationToken cancellationToken)
        {
            var submission = await _submissionService.GetByIdAsync(id, cancellationToken);
            return submission is null ? NotFound() : Ok(submission);
        }

        [HttpPut("{id}/fields")]
        public async Task<ActionResult<SubmissionDto>> UpdateFields(
            string id,
            [FromBody] UpdateSubmissionFieldsDto dto,
            CancellationToken cancellationToken)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new UnauthorizedAccessException("User id claim is missing.");

            var submission = await _submissionService.UpdateFieldsAsync(id, dto, userId, cancellationToken);
            return Ok(submission);
        }

        [HttpPost("{id}/validate")]
        public async Task<ActionResult<ValidationResultDto>> Validate(string id, CancellationToken cancellationToken)
        {
            var result = await _submissionService.ValidateAsync(id, cancellationToken);
            return Ok(result);
        }

        [HttpPost("{id}/confirm")]
        public async Task<ActionResult<SubmissionDto>> Confirm(string id, CancellationToken cancellationToken)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new UnauthorizedAccessException("User id claim is missing.");

            var submission = await _submissionService.ConfirmAsync(id, userId, cancellationToken);
            return submission is null ? NotFound() : Ok(submission);
        }
    }
}
