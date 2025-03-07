const OwnerCard = ({
  item,
  handleViewClick,
  handleEditClick,
  handleDeleteClick,
}) => {
  // Return a truncated text
  const truncateText = (text, maxLength = 25) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  return (
    <div
      key={item.id}
      className="card"
      title="View Owner"
      onClick={(e) => {
        // Prevent triggering view mode if clicking on an action button
        if (!e.target.closest(".actions")) {
          handleViewClick(item);
        }
      }}
    >
      <header>{item.full_name}</header>
      <div>
        <p>
          <strong>Email:</strong>&nbsp;{item.email}
        </p>
        <p>
          <strong>Phone:</strong>&nbsp;{item.phone}
        </p>
        <p>
          <strong>Address:</strong>&nbsp;
          {item.address}
        </p>
      </div>
      <div className="actions">
        <button
          title="Edit owner"
          className="btn btn-edit"
          onClick={() => handleEditClick(item)}
        >
          Edit
        </button>
        <button
          title="Delete owner"
          className="btn btn-delete"
          onClick={() => handleDeleteClick(item)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};
export default OwnerCard;
