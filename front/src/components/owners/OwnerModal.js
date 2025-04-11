import { useState, useEffect, useMemo } from 'react'

// Contexts
import { useGlobalContext } from '../../contexts/GlobalContext'
import { useOwnerContext } from '../../contexts/OwnerContext'
// Components
import ModalGenericsClose from '../modalGenerics/ModalGenericsClose'
import ModalGenericsTitle from '../modalGenerics/ModalGenericsTitle'
// Utils
import { Toast } from '../../utils/sweetalert'
import {
  isValidEmail,
  isTakenOwnerName,
  isValidPhone,
  isValidAddress,
} from '../../utils/validation'
// Styles
import '../../styles/Modal.css'
import '../../styles/Auth.css'

const OwnerModal = () => {
  // Error messages
  const [errors, setErrors] = useState({
    full_name: '',
    email: '',
    address: '',
    phone: '',
  })

  const { modalState, openDeleteModal, closeModals, toggleReadonly } = useGlobalContext()
  const {
    owners,
    createOwnerWithAlert,
    updateOwnerWithAlert,
    deleteOwnerWithAlert,
    loadingOwners,
  } = useOwnerContext()

  const [ownerData, setOwnerData] = useState({
    full_name: modalState.selectedItem?.full_name || '',
    email: modalState.selectedItem?.email || '',
    phone: modalState.selectedItem?.phone || '',
    address: modalState.selectedItem?.address || '',
  })

  const handleOwnerChange = (e) => {
    const { name, value } = e.target

    setOwnerData({
      ...ownerData,
      [name]: value,
    })
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!ownerData.full_name) {
      Toast.fire('Error', 'Please fill in a full name.', 'error')
      return
    }
    if (!ownerData.email) {
      Toast.fire('Error', 'Please select a email.', 'error')
      return
    }
    if (!ownerData.address) {
      Toast.fire('Error', 'Please select an address.', 'error')
      return
    }
    if (!ownerData.phone) {
      Toast.fire('Error', 'Please fill in a phone number.', 'error')
      return
    }

    try {
      const newOwner = await createOwnerWithAlert(ownerData)
      if (newOwner) {
        setOwnerData({
          full_name: '',
          email: '',
          phone: '',
          address: '',
        })
      }
    } catch (error) {
      console.error('Error creating owner:', error)
      Toast.fire('Error', 'Something went wrong.', 'error')
    } finally {
      closeModals()
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!ownerData.full_name) {
      Toast.fire('Error', 'Please fill in a full name.', 'error')
      return
    }
    if (!ownerData.email) {
      Toast.fire('Error', 'Please select a email.', 'error')
      return
    }
    if (!ownerData.address) {
      Toast.fire('Error', 'Please select an address.', 'error')
      return
    }
    if (!ownerData.phone) {
      Toast.fire('Error', 'Please fill in a phone number.', 'error')
      return
    }

    try {
      await updateOwnerWithAlert(modalState.selectedItem.id, ownerData)
    } catch (error) {
      console.error('Error updating owner:', error)
      Toast.fire('Error', 'Something went wrong.', 'error')
    } finally {
      setOwnerData(null)
      closeModals()
    }
  }

  // Live validation
  const existingOwnerNames = owners
    .map((owner) => owner.full_name)
    .filter(
      (name) =>
        !modalState.selectedItem ||
        name.toLowerCase() !== modalState.selectedItem.full_name.toLowerCase(),
    )

  useEffect(() => {
    const fullNameError =
      ownerData.full_name.trim() === ''
        ? 'This field is required.'
        : isTakenOwnerName(ownerData.full_name, existingOwnerNames)
    setErrors((prevErrors) =>
      prevErrors.full_name !== fullNameError
        ? { ...prevErrors, full_name: fullNameError }
        : prevErrors,
    )
  }, [ownerData.full_name, existingOwnerNames])

  useEffect(() => {
    const emailError =
      ownerData.email.trim() === '' ? 'This field is required.' : isValidEmail(ownerData.email)
    setErrors((prevErrors) =>
      prevErrors.email !== emailError ? { ...prevErrors, email: emailError } : prevErrors,
    )
  }, [ownerData.email])

  useEffect(() => {
    const addressError =
      ownerData.address.trim() === ''
        ? 'This field is required.'
        : isValidAddress(ownerData.address)
    setErrors((prevErrors) =>
      prevErrors.address !== addressError ? { ...prevErrors, address: addressError } : prevErrors,
    )
  }, [ownerData.address])

  useEffect(() => {
    const phoneError =
      ownerData.phone.trim() === '' ? 'This field is required.' : isValidPhone(ownerData.phone)
    setErrors((prevErrors) =>
      prevErrors.phone !== phoneError ? { ...prevErrors, phone: phoneError } : prevErrors,
    )
  }, [ownerData.phone])

  const isFormValid = useMemo(
    () =>
      !errors.email &&
      !errors.full_name &&
      !errors.address &&
      !errors.phone &&
      ownerData.email &&
      ownerData.full_name &&
      ownerData.address &&
      ownerData.phone,
    [errors, ownerData],
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
              <span>Full Name:</span>
              <input
                className={errors.full_name ? 'invalid' : 'valid'}
                type="text"
                name="full_name"
                value={ownerData.full_name}
                onChange={handleOwnerChange}
                placeholder="Enter full name"
                required
                disabled={modalState.readonly}
              />
              <p className="error-text">{errors.full_name && <>{errors.full_name}</>}</p>
            </label>

            <label>
              <span>Email:</span>
              <input
                className={errors.email ? 'invalid' : 'valid'}
                type="email"
                name="email"
                value={ownerData.email}
                onChange={handleOwnerChange}
                placeholder="Enter email"
                required
                disabled={modalState.readonly}
              />
              <p className="error-text">{errors.email && <>{errors.email}</>}</p>
            </label>

            <label>
              <span>Address:</span>
              <input
                className={errors.address ? 'invalid' : 'valid'}
                type="text"
                name="address"
                value={ownerData.address}
                onChange={handleOwnerChange}
                placeholder="Enter address"
                required
                disabled={modalState.readonly}
              />
              <p className="error-text">{errors.address && <>{errors.address}</>}</p>
            </label>

            <label>
              <span>Phone:</span>
              <input
                className={errors.phone ? 'invalid' : 'valid'}
                type="text"
                name="phone"
                value={ownerData.phone}
                onChange={handleOwnerChange}
                placeholder="Enter phone"
                required
                disabled={modalState.readonly}
              />
              <p className="error-text">{errors.phone && <>{errors.phone}</>}</p>
            </label>
          </fieldset>
          <div className="button-group">
            {modalState.selectedItem ? (
              <>
                {modalState.readonly ? (
                  <button type="button" onClick={toggleReadonly}>
                    Edit Owner
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={modalState.readonly || !isFormValid || loadingOwners}
                  >
                    Update Owner
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    openDeleteModal(
                      modalState.selectedItem,
                      modalState.itemType,
                      () => deleteOwnerWithAlert,
                    )
                  }
                >
                  Delete
                </button>
              </>
            ) : (
              <button type="submit" disabled={modalState.readonly || !isFormValid || loadingOwners}>
                Create Owner
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
export default OwnerModal
