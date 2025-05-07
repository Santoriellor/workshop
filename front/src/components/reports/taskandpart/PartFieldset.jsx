// Components
import FormField from '../../formHelper/FormField'
import SvgTrash from '../../svgGenerics/SvgTrash'
import LoadingScreen from '../../LoadingScreen'

const PartFieldset = ({
  errors,
  loading,
  modalState,
  selectedPartId,
  quantityPart,
  partsUsed,
  addPart,
  removePart,
  inventory,
  handlePartChange,
  handleQuantityChange,
}) => {
  return (
    <fieldset>
      <FormField label="Repair parts" error={errors.parts}>
        <div className="repair-section">
          <select value={selectedPartId} onChange={handlePartChange} disabled={modalState.readonly}>
            <option value="">Select a repair part</option>
            {inventory?.map((part) => (
              <option key={part.id} value={part.id}>
                {part.name} - €{part.unit_price}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={quantityPart}
            onChange={handleQuantityChange}
            disabled={modalState.readonly}
          />
          <button
            type="button"
            className="small"
            onClick={addPart}
            disabled={modalState.readonly || !selectedPartId || !quantityPart}
          >
            Add Part
          </button>
        </div>
        {/* Parts display */}
        {loading ? (
          <LoadingScreen fullscreen={false} small={true} />
        ) : partsUsed && partsUsed?.length > 0 ? (
          <ul className="repair-list">
            {partsUsed?.map((partUsed, index) => {
              const part = inventory.find((p) => p.id === partUsed.partId)
              return (
                <li key={index}>
                  <p>
                    {partUsed.quantity_used ?? 'N/A'}x&nbsp;
                    {part?.name ?? 'Unknown Part'} - €{part?.unit_price ?? 'N/A'}
                  </p>
                  <button
                    title="Remove Part"
                    type="button"
                    onClick={() => removePart(partUsed.partId)}
                    disabled={modalState.readonly}
                  >
                    <SvgTrash />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <span>No parts available</span>
        )}
      </FormField>
    </fieldset>
  )
}
export default PartFieldset
