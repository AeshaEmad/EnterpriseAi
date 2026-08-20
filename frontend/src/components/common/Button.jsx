function Button({
  children,
  type = "button",
  variant = "primary",
  block = false,
  disabled = false,
  onClick,
  ...rest
}) {
  const className = [
    "btn",
    variant,
    block ? "btn-block" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={className}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
