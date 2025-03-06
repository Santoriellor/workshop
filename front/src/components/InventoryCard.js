const InventoryCard = ({
  item,
  handleViewClick,
  handleEditClick,
  handleDeleteClick,
}) => {
  return (
    <div
      key={item.id}
      className="card"
      title="View inventory part"
      onClick={(e) => {
        // Prevent triggering view mode if clicking on an action button
        if (!e.target.closest(".actions")) {
          handleViewClick(item);
        }
      }}
    >
      <div>
        <h3>{item.name}</h3>
        <p>
          <strong>Reference:</strong>&nbsp;{item.reference_code}
        </p>
        <p>
          <strong>Quantity:</strong>&nbsp;{item.quantity_in_stock}
        </p>
        <p>
          <strong>Category:</strong>&nbsp;
          {item.category}
        </p>
      </div>
      <div className="actions">
        <button className="btn btn-green" onClick={() => handleEditClick(item)}>
          Edit
        </button>
        <button className="btn btn-red" onClick={() => handleDeleteClick(item)}>
          Delete
        </button>
      </div>
    </div>
  );
};
export default InventoryCard;
