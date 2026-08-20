import { useState } from "react";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { register, login } from "../services/auth";

function Register({ onSuccess, onSwitch }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!form.password) {
      nextErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      nextErrors.password =
        "Password must be at least 6 characters";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword =
        "Please confirm your password";
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Passwords do not match";
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

    const result = await register(form);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    const session = await login({
      email: form.email,
      password: form.password,
    });

    onSuccess(session.user);
  };

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <span className="eyebrow">AUTO-FILLER</span>
        <h1>Create account</h1>
        <p>Register to start auto-filling your forms</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Full Name"
          type="text"
          value={form.fullName}
          onChange={handleChange("fullName")}
          placeholder="Your full name"
          error={errors.fullName}
          required
          autoComplete="name"
        />

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
          placeholder="At least 6 characters"
          error={errors.password}
          required
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password"
          type={showPassword ? "text" : "password"}
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          placeholder="Re-enter your password"
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
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
          Create Account
        </Button>
      </form>

      <p className="auth-switch">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch}>
          Sign In
        </button>
      </p>
    </div>
  );
}

export default Register;
