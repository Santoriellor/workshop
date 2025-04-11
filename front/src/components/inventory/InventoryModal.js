import { useState, useEffect, useMemo } from 'react'

// Contexts
import { useGlobalContext } from '../../contexts/GlobalContext'
import { useInventoryContext } from '../../contexts/InventoryContext'
// Components
import ModalGenericsClose from '../modalGenerics/ModalGenericsClose'
import ModalGenericsTitle from '../modalGenerics/ModalGenericsTitle'
// Utils
import { Toast } from '../../utils/sweetalert'
import { isValidReferenceCode, isValidQuantityInStock, isValidPrice } from '../../utils/validation'
// Styles
import '../../styles/Modal.css'

/* Could be put into a JSON file */
// CATEGORIES
const categories = [
  'Brakes',
  'Engine',
  'Exhaust',
  'Suspension',
  'Transmission',
  'Wheels',
  'Steering',
  'Fluids',
  'Electrical',
  'Cooling',
]

const InventoryModal = () => {
  // Error messages
  const [errors, setErrors] = useState({
    name: '',
    reference_code: '',
    category: '',
    quantity_in_stock: '',
    unit_price: '',
  })

  const { modalState, openDeleteModal, closeModals, toggleReadonly } = useGlobalContext()
  const {
    inventory,
    createInventoryPartWithAlert,
    updateInventoryPartWithAlert,
    deleteInventoryPartWithAlert,
    loadingInventory,
  } = useInventoryContext()

  const [inventoryData, setInventoryData] = useState({
    name: modalState.selectedItem?.name || '',
    reference_code: modalState.selectedItem?.reference_code || '',
    category: modalState.selectedItem?.category || '',
    quantity_in_stock: modalState.selectedItem?.quantity_in_stock || '',
    unit_price: modalState.selectedItem?.unit_price || '',
  })

  const handleInventoryChange = (e) => {
    const { name, value } = e.target

    setInventoryData({
      ...inventoryData,
      [name]: value,
    })
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!inventoryData.name) {
      Toast.fire('Error', 'Please fill in a part name.', 'error')
      return
    }
    if (!inventoryData.reference_code) {
      Toast.fire('Error', 'Please fill in a reference code.', 'error')
      return
    }
    if (!inventoryData.category) {
      Toast.fire('Error', 'Please select a category.', 'error')
      return
    }
    if (!inventoryData.quantity_in_stock) {
      Toast.fire('Error', 'Please fill in a quantity.', 'error')
      return
    }
    if (!inventoryData.unit_price) {
      Toast.fire('Error', 'Please fill in a unit price.', 'error')
      return
    }

    try {
      const newInventory = await createInventoryPartWithAlert(inventoryData)
      if (newInventory) {
        setInventoryData({
          name: '',
          reference_code: '',
          category: '',
          quantity_in_stock: '',
          unit_price: '',
        })
      }
    } catch (error) {
      console.error('Error creating inventory part:', error)
      Toast.fire('Error', 'Something went wrong.', 'error')
    } finally {
      closeModals()
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!inventoryData.name) {
      Toast.fire('Error', 'Please fill in a part name.', 'error')
      return
    }
    if (!inventoryData.reference_code) {
      Toast.fire('Error', 'Please fill in a reference code.', 'error')
      return
    }
    if (!inventoryData.category) {
      Toast.fire('Error', 'Please select a category.', 'error')
      return
    }
    if (!inventoryData.quantity_in_stock) {
      Toast.fire('Error', 'Please fill in a quantity.', 'error')
      return
    }
    if (!inventoryData.unit_price) {
      Toast.fire('Error', 'Please fill in a unit price.', 'error')
      return
    }

    try {
      await updateInventoryPartWithAlert(modalState.selectedItem.id, inventoryData)
    } catch (error) {
      console.error('Error updating inventory part:', error)
      Toast.fire('Error', 'Something went wrong.', 'error')
    } finally {
      setInventoryData(null)
      closeModals()
    }
  }

  // Live validation
  const existingReferenceCodes = inventory
    .map((part) => part.reference_code)
    .filter(
      (reference) =>
        !modalState.selectedItem ||
        reference.toLowerCase() !== modalState.selectedItem.reference_code.toLowerCase(),
    )

  useEffect(() => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      name: inventoryData.name ? '' : 'This field is required.',
    }))
  }, [inventoryData.name])

  useEffect(() => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      category: inventoryData.category ? '' : 'This field is required.',
    }))
  }, [inventoryData.category])

  useEffect(() => {
    const referenceCodeError =
      inventoryData.reference_code.trim() === ''
        ? 'This field is required.'
        : isValidReferenceCode(inventoryData.reference_code, existingReferenceCodes)
    setErrors((prevErrors) =>
      prevErrors.reference_code !== referenceCodeError
        ? { ...prevErrors, reference_code: referenceCodeError }
        : prevErrors,
    )
  }, [inventoryData.reference_code, existingReferenceCodes])

  useEffect(() => {
    const quantityError =
      inventoryData.quantity_in_stock.toString().trim() === ''
        ? 'This field is required.'
        : isValidQuantityInStock(inventoryData.quantity_in_stock.toString())
    setErrors((prevErrors) =>
      prevErrors.quantity_in_stock !== quantityError
        ? { ...prevErrors, quantity_in_stock: quantityError }
        : prevErrors,
    )
  }, [inventoryData.quantity_in_stock])

  useEffect(() => {
    const priceError =
      inventoryData.unit_price.toString().trim() === ''
        ? 'This field is required.'
        : isValidPrice(inventoryData.unit_price.toString())
    setErrors((prevErrors) =>
      prevErrors.unit_price !== priceError ? { ...prevErrors, unit_price: priceError } : prevErrors,
    )
  }, [inventoryData.unit_price])

  const isFormValid = useMemo(
    () =>
      !errors.name &&
      !errors.reference_code &&
      !errors.category &&
      !errors.quantity_in_stock &&
      !errors.unit_price &&
      inventoryData.name &&
      inventoryData.reference_code &&
      inventoryData.category &&
      inventoryData.quantity_in_stock &&
      inventoryData.unit_price,
    [errors, inventoryData],
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
              <span>Name:</span>
              <input
                className={errors.name ? 'invalid' : 'valid'}
                type="text"
                name="name"
                value={inventoryData.name}
                onChange={handleInventoryChange}
                placeholder="Enter name"
                required
                disabled={modalState.readonly}
              />
              <p className="error-text">{errors.name && <>{errors.name}</>}</p>
            </label>

            <label>
              <span>Reference code:</span>
              <input
                className={errors.reference_code ? 'invalid' : 'valid'}
                type="text"
                name="reference_code"
                value={inventoryData.reference_code}
                onChange={handleInventoryChange}
                placeholder="Enter reference code"
                required
                disabled={modalState.readonly}
              />
              <p className="error-text">{errors.reference_code && <>{errors.reference_code}</>}</p>
            </label>

            <label>
              <span>Category:</span>
              <select
                className={errors.category ? 'invalid' : 'valid'}
                name="category"
                value={inventoryData.category}
                onChange={handleInventoryChange}
                required
                disabled={modalState.readonly}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <p className="error-text">{errors.category && <>{errors.category}</>}</p>
            </label>

            <label>
              <span>Quantity in stock:</span>
              <input
                className={errors.quantity_in_stock ? 'invalid' : 'valid'}
                type="text"
                name="quantity_in_stock"
                value={inventoryData.quantity_in_stock}
                onChange={handleInventoryChange}
                placeholder="Enter quantity in stock"
                disabled={modalState.readonly}
              />
              <p className="error-text">
                {errors.quantity_in_stock && <>{errors.quantity_in_stock}</>}
              </p>
            </label>
            <label>
              <span>Unit price:</span>
              <input
                className={errors.unit_price ? 'invalid' : 'valid'}
                type="text"
                name="unit_price"
                value={inventoryData.unit_price}
                onChange={handleInventoryChange}
                placeholder="Enter unit price"
                disabled={modalState.readonly}
              />
              <p className="error-text">{errors.unit_price && <>{errors.unit_price}</>}</p>
            </label>
          </fieldset>
          <div className="button-group">
            {modalState.selectedItem ? (
              <>
                {modalState.readonly ? (
                  <button type="button" onClick={toggleReadonly}>
                    Edit Part
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={modalState.readonly || !isFormValid || loadingInventory}
                  >
                    Update Part
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    openDeleteModal(
                      modalState.selectedItem,
                      modalState.itemType,
                      () => deleteInventoryPartWithAlert,
                    )
                  }
                >
                  Delete
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={modalState.readonly || !isFormValid || loadingInventory}
              >
                Create Part
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
export default InventoryModal
