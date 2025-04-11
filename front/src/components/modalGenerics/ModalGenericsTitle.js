const ModalGenericsTitle = ({ readonly, selectedItem, itemType }) => {
  return (
    <>
      {readonly ? (
        <h2>View {itemType}</h2>
      ) : selectedItem ? (
        <h2>Edit {itemType}</h2>
      ) : (
        <h2>Create {itemType}</h2>
      )}
    </>
  )
}
export default ModalGenericsTitle
