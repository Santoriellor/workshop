import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Contexts
import { useGlobalContext } from '../../contexts/GlobalContext'
// Styles
import '../../styles/CreateItemButton.css'

const CreateItemButton = () => {
  const location = useLocation()
  const { modalState, openModal } = useGlobalContext()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Define the paths where the button should be visible
    const allowedPaths = ['/report', '/owner', '/vehicle', '/inventory', '/tasktemplate']
    if (allowedPaths.includes(location.pathname)) {
      if (modalState.showModal || modalState.showDeleteModal) {
        setVisible(false)
      } else {
        setVisible(true)
      }
    } else {
      setVisible(false)
    }
  }, [location.pathname, modalState.showModal, modalState.showDeleteModal])

  return (
    <div className={`create-item-button-container${visible ? ' slide-in' : ' slide-out'}`}>
      <button
        title={`Create new ${
          typeof modalState.itemType === 'string' ? modalState.itemType.toLowerCase() : 'item'
        }`}
        type="button"
        className="create-item-button"
        onClick={() => openModal(modalState.modalComponent, null, modalState.itemType, false)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="icon"
        >
          <path
            d="M12 22.4199C17.5228 22.4199 22 17.9428 22 12.4199C22 6.89707 17.5228 2.41992 12 2.41992C6.47715 2.41992 2 6.89707 2 12.4199C2 17.9428 6.47715 22.4199 12 22.4199Z"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M12 8V16" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 12H16" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

export default CreateItemButton
