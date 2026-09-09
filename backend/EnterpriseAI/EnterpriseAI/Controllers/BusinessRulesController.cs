namespace EnterpriseAI.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/business-rules")]
    public class BusinessRulesController : ControllerBase
    {
        private readonly IBusinessRuleService _ruleService;
        private readonly IAiServiceClient _aiServiceClient;

        public BusinessRulesController(
            IBusinessRuleService ruleService,
            IAiServiceClient aiServiceClient)
        {
            _ruleService = ruleService;
            _aiServiceClient = aiServiceClient;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BusinessRuleDto>>> GetByForm(
            [FromQuery] string formId,
            CancellationToken cancellationToken)
        {
            var rules = await _ruleService.GetByFormAsync(formId, cancellationToken);
            return Ok(rules);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<BusinessRuleDto>> Create(
            [FromBody] CreateBusinessRuleDto dto,
            CancellationToken cancellationToken)
        {
            var rule = await _ruleService.CreateAsync(dto, cancellationToken);
            return Ok(rule);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("upload-pdf")]
        public async Task<IActionResult> UploadPdf(
            IFormFile file,
            [FromForm] string formId,
            [FromForm] string formName,
            CancellationToken cancellationToken)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("PDF file is required.");
            }

            if (string.IsNullOrWhiteSpace(formName))
            {
                return BadRequest("Form name is required.");
            }

            using var stream = file.OpenReadStream();
            var success = await _aiServiceClient.UploadBusinessRulePdfAsync(formName, stream, file.FileName, cancellationToken);

            if (!success)
            {
                return BadRequest("Failed to process business rules PDF.");
            }

            return Ok(new
            {
                message = "Business rules PDF uploaded and processed successfully.",
                fileName = file.FileName,
                formName = formName,
                uploadedAt = DateTime.UtcNow
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<ActionResult<BusinessRuleDto>> Update(
            string id,
            [FromBody] UpdateBusinessRuleDto dto,
            CancellationToken cancellationToken)
        {
            var rule = await _ruleService.UpdateAsync(id, dto, cancellationToken);
            return rule is null ? NotFound() : Ok(rule);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
        {
            var deleted = await _ruleService.DeleteAsync(id, cancellationToken);
            return deleted ? NoContent() : NotFound();
        }
    }
}
