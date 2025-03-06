import { useState } from "react";
// Utils
import getFilterOptions from "../utils/filterBarFilterOptions";
// Components
import Page from "../components/Page";
import OwnerCard from "../components/OwnerCard";
import OwnerModal from "../components/OwnerModal";
// Contexts
import { useOwnerContext } from "../contexts/OwnerContext";
// Styles
import "../styles/Owner.css";

const Owner = () => {
  const { owners, deleteOwnerWithAlert } = useOwnerContext();
  const [filters, setFilters] = useState({
    name: "",
    email: "",
  });

  return (
    <Page
      itemType="Owner"
      filters={{ ...filters, type: "owner" }}
      setFilters={setFilters}
      filterOptions={getFilterOptions(filters).owners}
      sortingCardFunction={(a, b) => a.full_name.localeCompare(b.full_name)}
      items={owners}
      deleteItemWithAlert={deleteOwnerWithAlert}
      CardComponent={OwnerCard}
      ModalComponent={OwnerModal}
    />
  );
};

export default Owner;
