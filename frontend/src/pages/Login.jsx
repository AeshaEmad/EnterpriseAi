import { useState } from "react";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { login } from "../services/auth";

function Login({ onSuccess, onSwitch }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
    setErrors({ ...errors, [field]: "" });
    setFormError("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!form.password) {
      nextErrors.password = "Password is required";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setFormError("");

    const result = await login(form);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    onSuccess(result.user);
  };

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <span className="eyebrow">AUTO-FILLER</span>
        <h1>Welcome back</h1>
        <p>Sign in to continue filling your forms</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          placeholder="you@company.com"
          error={errors.email}
          required
          autoComplete="email"
        />

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={handleChange("password")}
          placeholder="Enter your password"
          error={errors.password}
          required
          autoComplete="current-password"
        />

        <label className="auth-checkbox">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(event) =>
              setShowPassword(event.target.checked)
            }
          />
          Show password
        </label>

        {formError && (
          <div className="form-error">{formError}</div>
        )}

        <Button type="submit" variant="primary" block>
          Sign In
        </Button>
      </form>

      <p className="auth-switch">
        Don't have an account?{" "}
        <button type="button" onClick={onSwitch}>
          Register
        </button>
      </p>
    </div>
  );
}

export default Login;
