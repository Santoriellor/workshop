// Components
import OwnerModal from "./OwnerModal";
// Contexts
import { useOwnerContext } from "../../contexts/OwnerContext";
import { useGlobalContext } from "../../contexts/GlobalContext";

const OwnerCard = ({ item }) => {
  const cardItemType = "Owner";

  const { deleteOwnerWithAlert } = useOwnerContext();
  const { openModal, openDeleteModal } = useGlobalContext();

  return (
    <div
      key={item.id}
      className="card"
      title="View Owner"
      onClick={(e) => {
        // Prevent triggering view mode if clicking on an action button
        if (!e.target.closest(".actions")) {
          openModal(OwnerModal, item, cardItemType, true);
        }
      }}
    >
      <div className="card-content">
        <section>
          <header>{item.full_name}</header>
          <div>
            <p>
              <strong>Email:</strong>&nbsp;{item.email}
            </p>
            <p>
              <strong>Phone:</strong>&nbsp;{item.phone}
            </p>
            {/* <p>
          <strong>Address:</strong>&nbsp;
          {item.address}
        </p> */}
          </div>
        </section>
        <section className="actions">
          <button
            title="Edit owner"
            className="btn btn-edit"
            onClick={() => openModal(OwnerModal, item, cardItemType, false)}
          >
            Edit
          </button>
          <button
            title="Delete owner"
            className="btn btn-delete"
            onClick={() =>
              openDeleteModal(item, cardItemType, () => deleteOwnerWithAlert)
            }
          >
            Delete
          </button>
        </section>
      </div>
    </div>
  );
};
export default OwnerCard;
