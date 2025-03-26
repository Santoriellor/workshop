const ModalGenericsTitle = ({ readonly, selectedItem }) => {
  return (
    <>
      {readonly ? (
        <h2>View Report</h2>
      ) : selectedItem ? (
        <h2>Edit Report</h2>
      ) : (
        <h2>Create Report</h2>
      )}
    </>
  );
};
export default ModalGenericsTitle;
