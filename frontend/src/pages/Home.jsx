import Button from "../components/common/Button";

const mockupFields = [
  { label: "Full Name", value: "Sara Ahmed", state: "ai" },
  { label: "Email", value: "sara@company.com", state: "ai" },
  { label: "Job Title", value: "Marketing Manager", state: "ai" },
  { label: "Department", value: "Marketing", state: "ai" },
  { label: "Salary", value: "$4,800 / month", state: "ai" },
  { label: "Start Date", value: "Jan 15, 2025", state: "user" },
];

const steps = [
  {
    number: "01",
    title: "Describe",
    description:
      "Tell the assistant what employee you want to create.",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "AI Fills",
    description:
      "The AI understands the description and fills the relevant fields.",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v3" />
        <path d="M12 18v3" />
        <path d="M3 12h3" />
        <path d="M18 12h3" />
        <path d="m5.6 5.6 2.1 2.1" />
        <path d="m16.3 16.3 2.1 2.1" />
        <path d="m18.4 5.6-2.1 2.1" />
        <path d="m7.7 16.3-2.1 2.1" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Review",
    description:
      "Review the generated information before submitting.",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

const features = [
  {
    title: "Natural language input",
    description:
      "No template filling. Just describe the person you need.",
  },
  {
    title: "Smart field matching",
    description:
      "The AI maps your words to the right form fields.",
  },
  {
    title: "Always in control",
    description:
      "Review and edit anything the AI fills before you submit.",
  },
];

function Home({ user, onOpenDemo, onOpenAdmin, onLogout }) {
  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-navbar">
          <div className="home-brand">
            <span className="brand-mark">AF</span>
            <span className="brand-name">Auto-Filler</span>
          </div>

          <nav className="home-nav">
            <a href="#how-it-works">How It Works</a>

            {user.role === "admin" && (
              <button
                type="button"
                className="admin-nav-link"
                onClick={onOpenAdmin}
              >
                Admin
              </button>
            )}
          </nav>
        </div>

        <div className="header-user">
          <span className="user-avatar">
            {user.fullName.charAt(0).toUpperCase()}
          </span>

          <span className="user-name">{user.fullName}</span>

          <button
            className="logout-button"
            type="button"
            onClick={onLogout}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="home-main">
        <section className="home-hero">
          <div className="hero-copy">
            <span className="hero-badge">✦ AI FORM ASSISTANT</span>

            <h1>
              Fill forms in seconds — just describe what you
              need.
            </h1>

            <p>
              Tell the assistant the details of the employee you
              want to create, and it will fill the form for you
              — automatically.
            </p>

            <div className="hero-cta">
              <Button onClick={onOpenDemo}>Open Live Demo</Button>
            </div>

            <span className="hero-note">
              See how it works in seconds
            </span>
          </div>

          <div className="hero-visual">
            <div className="mockup-card">
              <div className="mockup-head">
                <div className="mockup-heading">
                  <span className="mockup-eyebrow">
                    EMPLOYEE FORM
                  </span>
                  <h3>New Employee</h3>
                </div>

                <span className="mockup-chip">✦ AI</span>
              </div>

              <div className="mockup-prompt">
                <span className="mockup-prompt-avatar">Y</span>
                <p>
                  Add Sara as a marketing manager, salary
                  $4,800, starting Jan 15
                </p>
              </div>

              <div className="mockup-divider">
                <span className="divider-line"></span>
                <span className="divider-label">
                  ✦ AI Filled 5 fields
                </span>
                <span className="divider-line"></span>
              </div>

              <div className="mockup-fields">
                {mockupFields.map((field) => (
                  <div className="mockup-field" key={field.label}>
                    <span className="mockup-label">
                      {field.label}
                    </span>

                    <div className="mockup-input">
                      <span
                        className={`mockup-value ${
                          field.state === "user" ? "is-user" : ""
                        }`}
                      >
                        {field.value}
                      </span>

                      {field.state === "ai" ? (
                        <span className="ai-filled">✦ AI</span>
                      ) : (
                        <span className="user-edited">You</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="home-steps">
          <div className="section-head">
            <span className="section-eyebrow">HOW IT WORKS</span>
            <h2>From a sentence to a filled form</h2>
          </div>

          <div className="steps-grid">
            {steps.map((step) => (
              <div className="step-card" key={step.number}>
                <div className="step-top">
                  <span className="step-number">
                    {step.number}
                  </span>
                  <span className="step-icon">{step.icon}</span>
                </div>

                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="home-features">
          {features.map((feature) => (
            <div className="feature-item" key={feature.title}>
              <span className="feature-check">✓</span>
              <div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="home-footer">
        <span>Auto-Filler</span>
        <span>AI form assistant</span>
      </footer>
    </div>
  );
}

export default Home;
