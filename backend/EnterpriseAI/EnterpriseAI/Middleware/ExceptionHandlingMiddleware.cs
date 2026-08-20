namespace EnterpriseAI.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (UnauthorizedAccessException ex)
            {
                await WriteErrorAsync(context, StatusCodes.Status401Unauthorized, "UNAUTHORIZED", ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                await WriteErrorAsync(context, StatusCodes.Status409Conflict, "INVALID_OPERATION", ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                await WriteErrorAsync(context, StatusCodes.Status404NotFound, "NOT_FOUND", ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception during request.");
                await WriteErrorAsync(context, StatusCodes.Status500InternalServerError, "INTERNAL_ERROR", "An unexpected error occurred.");
            }
        }

        private static async Task WriteErrorAsync(HttpContext context, int statusCode, string code, string message)
        {
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";
            var response = new ErrorResponseEnvelope(new ErrorResponse(code, message, null));
            await context.Response.WriteAsJsonAsync(response);
        }
    }
}
