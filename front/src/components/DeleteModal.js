import { useGlobalContext } from "../contexts/GlobalContext";

const DeleteModal = () => {
  const { itemType, handleDeleteConfirm, closeModals } = useGlobalContext();

  return (
    <div className="modal-container">
      <div className="modal-card">
        <svg
          onClick={closeModals}
          className="modal-card-close"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <title>Close</title>
          <path
            width="100%"
            height="100%"
            d="M11.414 10l2.829-2.828a1 1 0 1 0-1.415-1.415L10 8.586 7.172 5.757a1 1 0 0 0-1.415 1.415L8.586 10l-2.829 2.828a1 1 0 0 0 1.415 1.415L10 11.414l2.828 2.829a1 1 0 0 0 1.415-1.415L11.414 10zM10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10z"
          />
        </svg>
        <h2>Confirm Deletion</h2>
        <p>Are you sure you want to delete this {itemType?.toLowerCase()}?</p>
        <button
          type="button"
          className="delete-btn"
          onClick={() => handleDeleteConfirm()}
        >
          Yes, Delete
        </button>
        <button type="button" className="cancel-btn" onClick={closeModals}>
          Cancel
        </button>
      </div>
    </div>
  );
};
export default DeleteModal;
