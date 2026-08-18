function RequiredFields({ total = 5, completed = 0 }) {
  return (
    <div className="required-fields">
      {completed}/{total} required
    </div>
  );
}

export default RequiredFields;
