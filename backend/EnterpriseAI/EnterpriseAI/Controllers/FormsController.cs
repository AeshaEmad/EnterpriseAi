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
            var forms = await _formService.GetAllAsync(cancellationToken);
            return Ok(forms);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<FormDetailDto>> GetById(string id, CancellationToken cancellationToken)
        {
            var form = await _formService.GetByIdAsync(id, cancellationToken);
            return form is null ? NotFound() : Ok(form);
        }

        [HttpGet("{id}/schema")]
        public async Task<ActionResult<FormSchemaDto>> GetSchema(string id, CancellationToken cancellationToken)
        {
            var schema = await _formService.GetSchemaAsync(id, cancellationToken);
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
    }
}
