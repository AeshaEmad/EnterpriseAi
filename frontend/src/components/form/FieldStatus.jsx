function FieldStatus({ status }) {
  if (!status) return null;

  return (
    <span className={`field-status ${status}`}>
      {status === "ai" && "AI-filled"}
      {status === "user" && "User-entered"}
      {status === "missing" && "Missing"}
    </span>
  );
}

export default FieldStatus;