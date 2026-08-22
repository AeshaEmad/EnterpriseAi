function FieldStatus({ status, confidence }) {
  if (!status) return null;

  const confidenceLabel =
    status === "ai" && typeof confidence === "number"
      ? ` ${Math.round(confidence * 100)}%`
      : "";

  return (
    <span className={`field-status ${status}`}>
      {status === "ai" && `AI-filled${confidenceLabel}`}
      {status === "user" && "User-entered"}
      {status === "missing" && "Missing"}
    </span>
  );
}

export default FieldStatus;
