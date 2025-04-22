import { useState, useEffect, useMemo } from 'react'
// Zustand
import useVehicleStore from '../../stores/useVehicleStore'
import useOwnerStore from '../../stores/useOwnerStore'
// Contexts
import { useGlobalContext } from '../../contexts/GlobalContext'
// Components
import ModalGenericsClose from '../modalGenerics/ModalGenericsClose'
import ModalGenericsTitle from '../modalGenerics/ModalGenericsTitle'
// Utils
import { Toast } from '../../utils/sweetalert'
import { isValidOrTakenLicensePlate, isValidYear } from '../../utils/validation'
import withSuccessAlert from '../../utils/successAlert'
// Styles
import '../../styles/Modal.css'
// Data
import brandModelMap from '../../data/brandModelMap.json'
const brands = Object.keys(brandModelMap)

const VehicleModal = () => {
  // Error messages
  const [errors, setErrors] = useState({
    brand: '',
    model: '',
    license_plate: 'This field is required.',
    owner: 'This field is required.',
  })

  const { modalState, openDeleteModal, closeModals, toggleReadonly } = useGlobalContext()
  const { vehicles, createVehicle, updateVehicle, deleteVehicle, loading } = useVehicleStore()
  const { owners } = useOwnerStore()

  const [vehicleData, setVehicleData] = useState({
    brand: modalState.selectedItem?.brand || '',
    model: modalState.selectedItem?.model,
    year: modalState.selectedItem?.year || '',
    license_plate: modalState.selectedItem?.license_plate || '',
    owner: modalState.selectedItem?.owner || '',
  })

  // Create, Update, Delete vehicle with alert
  const createVehicleWithAlert = withSuccessAlert(createVehicle, 'Vehicle created successfully!')
  const updateVehicleWithAlert = withSuccessAlert(updateVehicle, 'Vehicle updated successfully!')
  const deleteVehicleWithAlert = withSuccessAlert(deleteVehicle, 'Vehicle deleted successfully!')

  const handleVehicleChange = (e) => {
    const { name, value } = e.target

    setVehicleData((prevData) => ({
      ...prevData,
      [name]:
        name === 'owner' ? Number(value) : name === 'license_plate' ? value.toUpperCase() : value,
    }))
  }

  const handleBrandChange = (e) => {
    const { value } = e.target
    setVehicleData({
      ...vehicleData,
      brand: value,
      model: '', // Reset model when brand changes
    })
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!vehicleData.brand) {
      Toast.fire('Error', 'Please fill in a brand.', 'error')
      return
    }
    if (!vehicleData.model) {
      Toast.fire('Error', 'Please select a model.', 'error')
      return
    }
    if (!vehicleData.year) {
      Toast.fire('Error', 'Please select a year.', 'error')
      return
    }
    if (!vehicleData.license_plate) {
      Toast.fire('Error', 'Please fill in a license plate.', 'error')
      return
    }
    if (!vehicleData.owner) {
      Toast.fire('Error', 'Please fill in an owner.', 'error')
      return
    }

    try {
      const newVehicle = await createVehicleWithAlert(vehicleData)
      if (newVehicle) {
        setVehicleData({
          brand: '',
          model: '',
          year: '',
          license_plate: '',
          owner: '',
        })
      }
    } catch (error) {
      console.error('Error creating vehicle:', error)
      Toast.fire('Error', 'Something went wrong.', 'error')
    } finally {
      closeModals()
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!vehicleData.brand) {
      Toast.fire('Error', 'Please fill in a brand.', 'error')
      return
    }
    if (!vehicleData.model) {
      Toast.fire('Error', 'Please select a model.', 'error')
      return
    }
    if (!vehicleData.year) {
      Toast.fire('Error', 'Please select a year.', 'error')
      return
    }
    if (!vehicleData.license_plate) {
      Toast.fire('Error', 'Please fill in a license plate.', 'error')
      return
    }
    if (!vehicleData.owner) {
      Toast.fire('Error', 'Please fill in an owner.', 'error')
      return
    }

    try {
      await updateVehicleWithAlert(modalState.selectedItem.id, vehicleData)
    } catch (error) {
      console.error('Error updating vehicle:', error)
      Toast.fire('Error', 'Something went wrong.', 'error')
    } finally {
      setVehicleData(null)
      closeModals()
    }
  }

  // Live validation
  const existingLicensePlates = vehicles
    .map((vehicle) => vehicle.license_plate)
    .filter(
      (plate) =>
        !modalState.selectedItem ||
        plate.toLowerCase() !== modalState.selectedItem.license_plate.toLowerCase(),
    )

  useEffect(() => {
    const licensePlateError = isValidOrTakenLicensePlate(
      vehicleData.license_plate,
      existingLicensePlates,
    )
    setErrors((prevErrors) =>
      prevErrors.license_plate !== licensePlateError
        ? { ...prevErrors, license_plate: licensePlateError }
        : prevErrors,
    )
  }, [vehicleData.license_plate, existingLicensePlates])

  useEffect(() => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      brand: vehicleData.brand ? '' : 'This field is required.',
    }))
  }, [vehicleData.brand])

  useEffect(() => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      model: vehicleData.model ? '' : 'This field is required.',
    }))
  }, [vehicleData.model])

  useEffect(() => {
    const yearError =
      vehicleData.year === '' ? 'This field is required.' : isValidYear(vehicleData.year)
    setErrors((prevErrors) =>
      prevErrors.year !== yearError ? { ...prevErrors, year: yearError } : prevErrors,
    )
  }, [vehicleData.year])

  useEffect(() => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      owner: vehicleData.owner ? '' : 'This field is required.',
    }))
  }, [vehicleData.owner])

  const isFormValid = useMemo(
    () =>
      !errors.brand &&
      !errors.model &&
      !errors.year &&
      !errors.license_plate &&
      !errors.owner &&
      vehicleData.brand &&
      vehicleData.model &&
      vehicleData.year &&
      vehicleData.license_plate &&
      vehicleData.owner,
    [errors, vehicleData],
  )

  return (
    <div className="modal-container">
      <div className="modal-card">
        <ModalGenericsClose onClose={closeModals} />
        <ModalGenericsTitle
          readonly={modalState.readonly}
          selectedItem={modalState.selectedItem}
          itemType={modalState.itemType}
        />
        <form
          className="modal-form"
          onSubmit={modalState.selectedItem ? handleEditSubmit : handleCreateSubmit}
        >
          <fieldset>
            <label>
              <span>Brand:</span>
              <select
                className={errors.brand ? 'invalid' : 'valid'}
                name="brand"
                value={vehicleData.brand}
                onChange={handleBrandChange}
                required
                disabled={modalState.readonly}
              >
                <option value="">Select a brand</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
              <p className="error-text">{errors.brand && <>{errors.brand}</>}</p>
            </label>
            <label>
              <span>Model:</span>
              <select
                className={errors.model ? 'invalid' : 'valid'}
                name="model"
                value={vehicleData.model}
                onChange={handleVehicleChange}
                disabled={!vehicleData.brand || modalState.readonly}
                required
              >
                <option value="">Select a model</option>
                {vehicleData.brand &&
                  brandModelMap[vehicleData.brand]?.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
              </select>
              <p className="error-text">{errors.model && <>{errors.model}</>}</p>
            </label>
            <label>
              <span>Year:</span>
              <input
                className={errors.year ? 'invalid' : 'valid'}
                type="number"
                name="year"
                placeholder="Enter vehicle year"
                value={vehicleData.year}
                onChange={handleVehicleChange}
                min="1900"
                max={new Date().getFullYear()}
                required
                disabled={modalState.readonly}
              />
              <p className="error-text">{errors.year && <>{errors.year}</>}</p>
            </label>
            <label>
              <span>License plate:</span>
              <input
                className={errors.license_plate ? 'invalid' : 'valid'}
                type="text"
                name="license_plate"
                placeholder="Enter vehicle license plate"
                value={vehicleData.license_plate}
                onChange={handleVehicleChange}
                required
                disabled={modalState.readonly}
              />
              <p className="error-text">{errors.license_plate && <>{errors.license_plate}</>}</p>
            </label>
            <label>
              <span>Owner:</span>
              <select
                className={errors.owner ? 'invalid' : 'valid'}
                name="owner"
                value={vehicleData.owner}
                onChange={handleVehicleChange}
                required
                disabled={modalState.readonly}
              >
                <option value="">Select an owner</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.full_name}
                  </option>
                ))}
              </select>
              <p className="error-text">{errors.owner && <>{errors.owner}</>}</p>
            </label>
          </fieldset>
          <div className="button-group">
            {modalState.selectedItem ? (
              <>
                {modalState.readonly ? (
                  <button type="button" onClick={toggleReadonly}>
                    Edit Vehicle
                  </button>
                ) : (
                  <button type="submit" disabled={modalState.readonly || !isFormValid || loading}>
                    Update Vehicle
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    openDeleteModal(
                      modalState.selectedItem,
                      modalState.itemType,
                      () => deleteVehicleWithAlert,
                    )
                  }
                >
                  Delete
                </button>
              </>
            ) : (
              <button type="submit" disabled={modalState.readonly || !isFormValid || loading}>
                Create Vehicle
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
export default VehicleModal
