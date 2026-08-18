namespace EnterpriseAI.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/business-rules")]
    public class BusinessRulesController : ControllerBase
    {
        private readonly IBusinessRuleService _ruleService;

        public BusinessRulesController(IBusinessRuleService ruleService)
        {
            _ruleService = ruleService;
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
