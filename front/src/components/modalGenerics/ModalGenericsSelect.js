const ModalGenericsSelect = ({
  name,
  value,
  onChange,
  required,
  disabled,
  placeholder,
  valueKey,
  optionsList,
  labelRenderer,
}) => {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {optionsList.map((option) => (
        <option key={option[valueKey]} value={option[valueKey]}>
          {labelRenderer(option)}
        </option>
      ))}
    </select>
  );
};
export default ModalGenericsSelect;

/* example
<ModalGenericsSelect
                  name="vehicle"
                  value={reportData.vehicle}
                  onChange={handleReportChange}
                  required={true}
                  disabled={readonly}
                  placeholder="Select a vehicle"
                  valueKey="id"
                  optionsList={vehicles}
                  labelRenderer={(option) =>
                    `${option.__str__} - ${getOwnerNameByVehicleId(option.id)}`
                  }
                /> */
