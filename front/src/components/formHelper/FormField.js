const FormField = ({ label, error, children }) => (
  <label className="field-label">
    <span className="field-name">{label}</span>
    {children}
    <p className={`error-text ${error ? 'visible' : 'hidden'}`}>{error || '\u00A0'}</p>
  </label>
)

export default FormField
