namespace EnterpriseAI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<UserProfileAttribute> UserProfileAttributes => Set<UserProfileAttribute>();
        public DbSet<Form> Forms => Set<Form>();
        public DbSet<FormVersion> FormVersions => Set<FormVersion>();
        public DbSet<FormField> FormFields => Set<FormField>();
        public DbSet<FormSubmission> FormSubmissions => Set<FormSubmission>();
        public DbSet<SubmissionField> SubmissionFields => Set<SubmissionField>();
        public DbSet<SubmissionFieldHistory> SubmissionFieldHistories => Set<SubmissionFieldHistory>();
        public DbSet<AIAnalysis> AIAnalyses => Set<AIAnalysis>();
        public DbSet<ConversationMessage> ConversationMessages => Set<ConversationMessage>();
        public DbSet<Clarification> Clarifications => Set<Clarification>();
        public DbSet<BusinessRule> BusinessRules => Set<BusinessRule>();
        public DbSet<RuleExecutionResult> RuleExecutionResults => Set<RuleExecutionResult>();
        public DbSet<Confirmation> Confirmations => Set<Confirmation>();
        public DbSet<UserFormAccess> UserFormAccesses => Set<UserFormAccess>();

        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            configurationBuilder.Properties<JsonNode?>().HaveConversion<JsonNodeValueConverter>();
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            var jsonComparer = new ValueComparer<JsonNode?>(
                (a, b) => (a == null && b == null) || (a != null && b != null && a.ToJsonString() == b.ToJsonString()),
                v => v == null ? 0 : v.ToJsonString().GetHashCode(),
                v => v == null ? null : JsonNode.Parse(v.ToJsonString()));

            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties().Where(p => p.ClrType == typeof(JsonNode)))
                {
                    property.SetValueComparer(jsonComparer);
                }
            }

            // Users
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // user_profile_attributes
            modelBuilder.Entity<UserProfileAttribute>()
                .HasOne(a => a.User)
                .WithMany(u => u.ProfileAttributes)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserProfileAttribute>()
                .HasIndex(a => new { a.UserId, a.AttributeKey })
                .IsUnique();

            // form_versions
            modelBuilder.Entity<FormVersion>()
                .HasOne(v => v.Form)
                .WithMany(f => f.Versions)
                .HasForeignKey(v => v.FormId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<FormVersion>()
                .HasIndex(v => new { v.FormId, v.VersionNumber })
                .IsUnique();

            // form_fields
            modelBuilder.Entity<FormField>()
                .HasOne(f => f.FormVersion)
                .WithMany(v => v.Fields)
                .HasForeignKey(f => f.FormVersionId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<FormField>()
                .HasIndex(f => new { f.FormVersionId, f.FieldName })
                .IsUnique();

            // form_submissions
            modelBuilder.Entity<FormSubmission>()
                .HasOne(s => s.User)
                .WithMany(u => u.Submissions)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<FormSubmission>()
                .HasOne(s => s.FormVersion)
                .WithMany(v => v.Submissions)
                .HasForeignKey(s => s.FormVersionId)
                .OnDelete(DeleteBehavior.Restrict);

            // submission_fields
            modelBuilder.Entity<SubmissionField>()
                .HasOne(f => f.Submission)
                .WithMany(s => s.SubmissionFields)
                .HasForeignKey(f => f.SubmissionId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SubmissionField>()
                .HasOne(f => f.FormField)
                .WithMany(f => f.SubmissionFields)
                .HasForeignKey(f => f.FormFieldId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SubmissionField>()
                .HasOne(f => f.ConfirmedByUser)
                .WithMany(u => u.ConfirmedSubmissionFields)
                .HasForeignKey(f => f.ConfirmedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SubmissionField>()
                .HasIndex(f => new { f.SubmissionId, f.FormFieldId })
                .IsUnique();

            // submission_field_history
            modelBuilder.Entity<SubmissionFieldHistory>()
                .HasOne(h => h.SubmissionField)
                .WithMany(f => f.HistoryEntries)
                .HasForeignKey(h => h.SubmissionFieldId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SubmissionFieldHistory>()
                .HasOne(h => h.ChangedByUser)
                .WithMany(u => u.FieldHistoryChanges)
                .HasForeignKey(h => h.ChangedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ai_analyses
            modelBuilder.Entity<AIAnalysis>()
                .HasOne(a => a.Submission)
                .WithMany(s => s.Analyses)
                .HasForeignKey(a => a.SubmissionId)
                .OnDelete(DeleteBehavior.Restrict);

            // conversation_messages
            modelBuilder.Entity<ConversationMessage>()
                .HasOne(m => m.Submission)
                .WithMany(s => s.ConversationMessages)
                .HasForeignKey(m => m.SubmissionId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ConversationMessage>()
                .HasIndex(m => new { m.SubmissionId, m.SequenceNumber })
                .IsUnique();

            // clarifications
            modelBuilder.Entity<Clarification>()
                .HasOne(c => c.Submission)
                .WithMany(s => s.Clarifications)
                .HasForeignKey(c => c.SubmissionId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Clarification>()
                .HasOne(c => c.FormField)
                .WithMany(f => f.Clarifications)
                .HasForeignKey(c => c.FormFieldId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Clarification>()
                .HasOne(c => c.QuestionMessage)
                .WithMany(m => m.QuestionClarifications)
                .HasForeignKey(c => c.QuestionMessageId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Clarification>()
                .HasOne(c => c.AnswerMessage)
                .WithMany(m => m.AnswerClarifications)
                .HasForeignKey(c => c.AnswerMessageId)
                .OnDelete(DeleteBehavior.Restrict);

            // business_rules
            modelBuilder.Entity<BusinessRule>()
                .HasOne(r => r.FormVersion)
                .WithMany(v => v.BusinessRules)
                .HasForeignKey(r => r.FormVersionId)
                .OnDelete(DeleteBehavior.Restrict);

            // rule_execution_results
            modelBuilder.Entity<RuleExecutionResult>()
                .HasOne(r => r.Submission)
                .WithMany(s => s.RuleExecutionResults)
                .HasForeignKey(r => r.SubmissionId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<RuleExecutionResult>()
                .HasOne(r => r.BusinessRule)
                .WithMany(r => r.ExecutionResults)
                .HasForeignKey(r => r.BusinessRuleId)
                .OnDelete(DeleteBehavior.Restrict);

            // confirmations
            modelBuilder.Entity<Confirmation>()
                .HasOne(c => c.Submission)
                .WithMany(s => s.Confirmations)
                .HasForeignKey(c => c.SubmissionId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Confirmation>()
                .HasOne(c => c.ConfirmedByUser)
                .WithMany(u => u.Confirmations)
                .HasForeignKey(c => c.ConfirmedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // user_form_accesses
            modelBuilder.Entity<UserFormAccess>()
                .HasOne(a => a.User)
                .WithMany(u => u.FormAccesses)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserFormAccess>()
                .HasOne(a => a.Form)
                .WithMany(f => f.UserAccesses)
                .HasForeignKey(a => a.FormId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserFormAccess>()
                .HasOne(a => a.GrantedByUser)
                .WithMany()
                .HasForeignKey(a => a.GrantedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserFormAccess>()
                .HasIndex(a => new { a.UserId, a.FormId })
                .IsUnique();
        
        }

        private sealed class JsonNodeValueConverter : ValueConverter<JsonNode?, string>
        {
            public JsonNodeValueConverter()
                : base(
                    v => v == null ? null! : v.ToJsonString(),
                    v => string.IsNullOrWhiteSpace(v) ? null : JsonNode.Parse(v))
            {
            }
        }
    }
}
