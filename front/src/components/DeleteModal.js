// Contexts
import { useGlobalContext } from "../contexts/GlobalContext";
// Components
import ModalGenericsClose from "./modalGenerics/ModalGenericsClose";

const DeleteModal = () => {
  const { modalState, handleDeleteConfirm, closeModals } = useGlobalContext();

  return (
    <div className="modal-container">
      <div className="modal-card">
        <ModalGenericsClose onClose={closeModals} />
        <h2>Confirm Deletion</h2>
        <p>
          Are you sure you want to delete this{" "}
          {modalState.itemType?.toLowerCase()}?
        </p>
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
