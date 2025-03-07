const TaskTemplateCard = ({
  item,
  handleViewClick,
  handleEditClick,
  handleDeleteClick,
}) => {
  return (
    <div
      key={item.id}
      className="card"
      title="View task template"
      onClick={(e) => {
        // Prevent triggering view mode if clicking on an action button
        if (!e.target.closest(".actions")) {
          handleViewClick(item);
        }
      }}
    >
      <header>{item.name}</header>
      <div>
        <p>
          <strong>Description:</strong>&nbsp;{item.description}
        </p>
        <p>
          <strong>Price:</strong>&nbsp;{item.price}
        </p>
      </div>
      <div className="actions">
        <button
          title="Edit task"
          className="btn btn-edit"
          onClick={() => handleEditClick(item)}
        >
          Edit
        </button>
        <button
          title="Delete task"
          className="btn btn-delete"
          onClick={() => handleDeleteClick(item)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};
export default TaskTemplateCard;
